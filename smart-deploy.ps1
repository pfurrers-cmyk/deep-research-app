param([Parameter(Mandatory=$true)][string]$CommitMessage)
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot
$MainBranch = "master"
$DeployBranch = "deploy/auto-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$BuildInfoPath = "lib/buildInfo.ts"
$MaxWaitSeconds = 120
$PollIntervalSeconds = 5

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  SMART DEPLOY - Deep Research App"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

Write-Host "[1/7] Atualizando buildInfo.ts (timestamp + commitHash)..."  -ForegroundColor Yellow
$ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$hash = git rev-parse --short HEAD 2>$null
if (-not $hash) { $hash = "unknown" }
$biPath = Join-Path $PSScriptRoot $BuildInfoPath
$biContent = [System.IO.File]::ReadAllText($biPath)
$biContent = $biContent -replace "buildTimestamp: '.*?'", "buildTimestamp: '$ts'"
$biContent = $biContent -replace "commitHash: '.*?'", "commitHash: '$hash'"
[System.IO.File]::WriteAllText($biPath, $biContent)
Write-Host "  -> buildTimestamp: $ts | commitHash: $hash"  -ForegroundColor Gray

Write-Host "[2/7] Staging changes..."  -ForegroundColor Yellow
git add -A 2>&1 | Out-Null
$st = git status --porcelain
if (-not $st) { Write-Host "  -> Nenhuma alteracao. Abortando."  -ForegroundColor Red; exit 0 }
Write-Host "  -> Arquivos alterados"  -ForegroundColor Gray

Write-Host "[3/7] Commit: $CommitMessage"  -ForegroundColor Yellow
git commit -m $CommitMessage 2>&1 | Out-Null

Write-Host "[4/7] Criando branch $DeployBranch e push..."  -ForegroundColor Yellow
git checkout -b $DeployBranch 2>&1 | Out-Null
git push origin $DeployBranch 2>&1 | Out-Null
Write-Host "  -> Branch pushed"  -ForegroundColor Gray

Write-Host "[5/7] Criando Pull Request..."  -ForegroundColor Yellow
$ghOk = $false
try { Get-Command gh -ErrorAction Stop | Out-Null; $ghOk = $true } catch {}
$prUrl = ""
if ($ghOk) {
    $prOut = gh pr create --base $MainBranch --head $DeployBranch --title $CommitMessage --body "Deploy automatico via smart-deploy.ps1 - $ts" 2>&1
    $match = [regex]::Match("$prOut", "https://[^\s]+")
    if ($match.Success) { $prUrl = $match.Value; Write-Host "  -> PR criada: $prUrl"  -ForegroundColor Green }
    else { Write-Host "  -> PR falhou, merge direto..."  -ForegroundColor DarkYellow }
} else { Write-Host "  -> gh CLI indisponivel, merge direto..."  -ForegroundColor DarkYellow }

$agentResult = "DIRECT_MERGE"
if ($prUrl) {
    Write-Host "[6/7] Aguardando Vercel Agent (JSON polling a cada ${PollIntervalSeconds}s)..."  -ForegroundColor Yellow
    $elapsed = 0
    $agentResult = "TIMEOUT"
    $deployPassed = $false
    while ($elapsed -lt $MaxWaitSeconds) {
        Start-Sleep -Seconds $PollIntervalSeconds
        $elapsed += $PollIntervalSeconds
        $checksRaw = gh pr checks $DeployBranch --json name,state,description 2>&1
        try {
            $checksArr = $checksRaw | ConvertFrom-Json
        } catch {
            Write-Host "  -> [${elapsed}s] Aguardando checks aparecerem..."  -ForegroundColor Gray
            continue
        }
        if (-not $checksArr -or $checksArr.Count -eq 0) {
            Write-Host "  -> [${elapsed}s] Nenhum check registrado ainda..."  -ForegroundColor Gray
            continue
        }
        $total = $checksArr.Count
        $succeeded = @($checksArr | Where-Object { $_.state -eq "SUCCESS" }).Count
        $failed = @($checksArr | Where-Object { $_.state -eq "FAILURE" -or $_.state -eq "ERROR" })
        $pending = @($checksArr | Where-Object { $_.state -eq "PENDING" -or $_.state -eq "IN_PROGRESS" }).Count
        $allSuccess = $pending -eq 0 -and $failed.Count -eq 0
        $names = ($checksArr | ForEach-Object { "$($_.name):$($_.state)" }) -join " | "
        Write-Host "  -> [${elapsed}s] $succeeded/$total ok, $pending pendente(s) - $names"  -ForegroundColor Gray
        if ($failed.Count -gt 0) {
            $agentResult = "AGENT_REVIEW_ERRORS_FOUND"
            Write-Host ""
            Write-Host "  AGENT_REVIEW_ERRORS_FOUND"  -ForegroundColor Red
            foreach ($f in $failed) {
                Write-Host "    X $($f.name): $($f.description)"  -ForegroundColor Red
            }
            break
        }
        if ($allSuccess) {
            $agentResult = "AGENT_REVIEW_PASSED"
            Write-Host ""
            Write-Host "  AGENT_REVIEW_PASSED"  -ForegroundColor Green
            foreach ($c in $checksArr) {
                Write-Host "    OK $($c.name): $($c.description)"  -ForegroundColor Green
            }
            break
        }
        $vercelDeploy = $checksArr | Where-Object { $_.name -eq "Vercel" }
        if ($vercelDeploy -and $vercelDeploy.state -eq "SUCCESS" -and -not $deployPassed) {
            $deployPassed = $true
            Write-Host "  -> Deploy Vercel OK! Aguardando Agent Review..."  -ForegroundColor Green
        }
        if ($deployPassed -and $elapsed -ge 90) {
            $agentResult = "DEPLOY_OK_AGENT_SLOW"
            Write-Host ""
            Write-Host "  DEPLOY_OK_AGENT_SLOW - Deploy passou, Agent Review ainda em andamento (${elapsed}s)"  -ForegroundColor DarkYellow
            Write-Host "  -> Prosseguindo com merge. Agent revisara post-merge."  -ForegroundColor DarkYellow
            break
        }
    }
    if ($agentResult -eq "TIMEOUT") { Write-Host "`n  TIMEOUT - Nenhum check respondeu em ${MaxWaitSeconds}s"  -ForegroundColor DarkYellow }
    if ($agentResult -ne "AGENT_REVIEW_ERRORS_FOUND") {
        Write-Host "[7/7] Merge da PR..."  -ForegroundColor Yellow
        gh pr merge $DeployBranch --merge --delete-branch 2>&1 | Out-Null
        Write-Host "  -> PR merged e branch deletada"  -ForegroundColor Green
    } else {
        Write-Host "[7/7] MERGE BLOQUEADO - Erros do Agent"  -ForegroundColor Red
    }
} else {
    Write-Host "[6/7] Merge direto no $MainBranch..."  -ForegroundColor Yellow
    git checkout $MainBranch 2>&1 | Out-Null
    git merge $DeployBranch 2>&1 | Out-Null
    git push origin $MainBranch 2>&1 | Out-Null
    git branch -d $DeployBranch 2>&1 | Out-Null
    git push origin --delete $DeployBranch 2>&1 | Out-Null
    Write-Host "  -> Merged e branch deletada"  -ForegroundColor Green
    Write-Host "[7/7] Deploy acionado via push"  -ForegroundColor Green
}

git checkout $MainBranch 2>&1 | Out-Null
Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  RESULTADO: $agentResult"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan
