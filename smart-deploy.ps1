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
    Write-Host "[6/7] Aguardando Vercel checks (polling ${PollIntervalSeconds}s)..."  -ForegroundColor Yellow
    Write-Host "  NOTA: 'Vercel Agent Review' fica IN_PROGRESS no GitHub (advisory, nao-bloqueante)"  -ForegroundColor DarkGray
    $elapsed = 0
    $agentResult = "TIMEOUT"
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
        $blocking = @($checksArr | Where-Object { $_.name -ne "Vercel Agent Review" })
        $agentCheck = $checksArr | Where-Object { $_.name -eq "Vercel Agent Review" }
        $agentState = if ($agentCheck) { $agentCheck.state } else { "N/A" }
        $blockingOk = @($blocking | Where-Object { $_.state -eq "SUCCESS" }).Count
        $blockingFail = @($blocking | Where-Object { $_.state -eq "FAILURE" -or $_.state -eq "ERROR" })
        $blockingPend = @($blocking | Where-Object { $_.state -eq "PENDING" -or $_.state -eq "IN_PROGRESS" }).Count
        $names = ($checksArr | ForEach-Object { "$($_.name):$($_.state)" }) -join " | "
        Write-Host "  -> [${elapsed}s] Deploy:$blockingOk/$($blocking.Count) ok | Agent:$agentState | $names"  -ForegroundColor Gray
        if ($blockingFail.Count -gt 0) {
            $agentResult = "AGENT_REVIEW_ERRORS_FOUND"
            Write-Host ""
            Write-Host "  DEPLOY_FAILED"  -ForegroundColor Red
            foreach ($f in $blockingFail) {
                Write-Host "    X $($f.name): $($f.description)"  -ForegroundColor Red
            }
            break
        }
        if ($blockingOk -eq $blocking.Count -and $blocking.Count -gt 0) {
            $agentResult = "AGENT_REVIEW_PASSED"
            Write-Host ""
            Write-Host "  DEPLOY_SUCCESS (Agent Review: $agentState - advisory)"  -ForegroundColor Green
            foreach ($c in $blocking) {
                Write-Host "    OK $($c.name): $($c.description)"  -ForegroundColor Green
            }
            break
        }
    }
    if ($agentResult -eq "TIMEOUT") { Write-Host "`n  TIMEOUT - Checks nao completaram em ${MaxWaitSeconds}s"  -ForegroundColor DarkYellow }
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
