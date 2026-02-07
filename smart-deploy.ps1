param([Parameter(Mandatory=$true)][string]$CommitMessage)
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot
$MainBranch = "master"
$DeployBranch = "deploy/auto-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$BuildInfoPath = "lib/buildInfo.ts"
$MaxWaitSeconds = 180
$PollIntervalSeconds = 10

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
    Write-Host "[6/7] Aguardando Vercel Agent..."  -ForegroundColor Yellow
    $elapsed = 0
    $agentResult = "TIMEOUT"
    while ($elapsed -lt $MaxWaitSeconds) {
        Start-Sleep -Seconds $PollIntervalSeconds
        $elapsed += $PollIntervalSeconds
        $checks = gh pr checks $DeployBranch 2>&1
        $checksStr = "$checks"
        Write-Host "  -> [${elapsed}s / ${MaxWaitSeconds}s] Verificando..."  -ForegroundColor Gray
        if ($checksStr -match "fail|failure") {
            $agentResult = "AGENT_REVIEW_ERRORS_FOUND"
            Write-Host "`n  AGENT_REVIEW_ERRORS_FOUND"  -ForegroundColor Red
            Write-Host $checksStr  -ForegroundColor Red
            break
        } elseif ($checksStr -match "pass|success" -and $checksStr -notmatch "pending|queued|in_progress") {
            $agentResult = "AGENT_REVIEW_PASSED"
            Write-Host "`n  AGENT_REVIEW_PASSED"  -ForegroundColor Green
            break
        }
    }
    if ($agentResult -eq "TIMEOUT") { Write-Host "`n  TIMEOUT - Agent nao respondeu em ${MaxWaitSeconds}s"  -ForegroundColor DarkYellow }
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
