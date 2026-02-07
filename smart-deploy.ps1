param(
    [Parameter(Mandatory=$true)][string]$CommitMessage,
    [switch]$SkipTests,
    [switch]$SkipAgentReview
)
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot
$MainBranch = "master"
$DeployBranch = "deploy/auto-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$BuildInfoPath = "lib/buildInfo.ts"
$MaxWaitSeconds = 300
$PollIntervalSeconds = 5
# Checks que nunca bloqueiam merge (CI jobs que so rodam em master push)
$AlwaysAdvisory = @("e2e-tests", "llm-evals")

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  SMART DEPLOY - Deep Research App"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

# ============================================================
# [1/8] BUILD INFO
# ============================================================
Write-Host "[1/8] Atualizando buildInfo.ts (timestamp + commitHash)..."  -ForegroundColor Yellow
$ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$hash = git rev-parse --short HEAD 2>$null
if (-not $hash) { $hash = "unknown" }
$biPath = Join-Path $PSScriptRoot $BuildInfoPath
$biContent = [System.IO.File]::ReadAllText($biPath)
$biContent = $biContent -replace "buildTimestamp: '.*?'", "buildTimestamp: '$ts'"
$biContent = $biContent -replace "commitHash: '.*?'", "commitHash: '$hash'"
[System.IO.File]::WriteAllText($biPath, $biContent)
Write-Host "  -> buildTimestamp: $ts | commitHash: $hash"  -ForegroundColor Gray

# ============================================================
# [2/8] TESTES UNITARIOS PRE-DEPLOY
# ============================================================
if ($SkipTests) {
    Write-Host "[2/8] TESTES IGNORADOS (-SkipTests)"  -ForegroundColor DarkYellow
} else {
    Write-Host "[2/8] Rodando testes unitarios..."  -ForegroundColor Yellow
    $testOutput = npx vitest run --reporter=verbose 2>&1
    $testExit = $LASTEXITCODE
    if ($testExit -ne 0) {
        Write-Host ""
        Write-Host "  TESTES FALHARAM - Deploy bloqueado. Corrija os testes antes de deployar."  -ForegroundColor Red
        Write-Host ""
        $testOutput | Select-Object -Last 30 | ForEach-Object { Write-Host "  $_"  -ForegroundColor Red }
        Write-Host "`n========================================" -ForegroundColor Red
        Write-Host "  RESULTADO: TESTS_FAILED" -ForegroundColor Red
        Write-Host "========================================`n" -ForegroundColor Red
        exit 1
    }
    # Extract pass count from output
    $passLine = $testOutput | Select-String "Tests\s+\d+ passed" | Select-Object -Last 1
    if ($passLine) {
        Write-Host "  -> $($passLine.Line.Trim())"  -ForegroundColor Green
    } else {
        Write-Host "  -> Testes passaram (exit code 0)"  -ForegroundColor Green
    }
}

# ============================================================
# [3/8] STAGING
# ============================================================
Write-Host "[3/8] Staging changes..."  -ForegroundColor Yellow
git add -A 2>&1 | Out-Null
$st = git status --porcelain
if (-not $st) { Write-Host "  -> Nenhuma alteracao. Abortando."  -ForegroundColor Red; exit 0 }
Write-Host "  -> Arquivos alterados"  -ForegroundColor Gray

# ============================================================
# [4/8] COMMIT
# ============================================================
Write-Host "[4/8] Commit: $CommitMessage"  -ForegroundColor Yellow
git commit -m $CommitMessage 2>&1 | Out-Null

# ============================================================
# [5/8] BRANCH + PUSH
# ============================================================
Write-Host "[5/8] Criando branch $DeployBranch e push..."  -ForegroundColor Yellow
git checkout -b $DeployBranch 2>&1 | Out-Null
git push origin $DeployBranch 2>&1 | Out-Null
Write-Host "  -> Branch pushed"  -ForegroundColor Gray

# ============================================================
# [6/8] PULL REQUEST
# ============================================================
Write-Host "[6/8] Criando Pull Request..."  -ForegroundColor Yellow
$ghOk = $false
try { Get-Command gh -ErrorAction Stop | Out-Null; $ghOk = $true } catch {}
$prUrl = ""
if ($ghOk) {
    $prOut = gh pr create --base $MainBranch --head $DeployBranch --title $CommitMessage --body "Deploy automatico via smart-deploy.ps1 - $ts" 2>&1
    $match = [regex]::Match("$prOut", "https://[^\s]+")
    if ($match.Success) { $prUrl = $match.Value; Write-Host "  -> PR criada: $prUrl"  -ForegroundColor Green }
    else { Write-Host "  -> PR falhou, merge direto..."  -ForegroundColor DarkYellow }
} else { Write-Host "  -> gh CLI indisponivel, merge direto..."  -ForegroundColor DarkYellow }

# ============================================================
# [7/8] AGUARDAR CHECKS
# ============================================================
$deployResult = "DIRECT_MERGE"
if ($prUrl) {
    Write-Host "[7/8] Aguardando checks (timeout ${MaxWaitSeconds}s)..."  -ForegroundColor Yellow
    if ($SkipAgentReview) {
        Write-Host "  NOTA: Agent Review tratado como advisory (-SkipAgentReview)"  -ForegroundColor DarkYellow
    }
    $elapsed = 0
    $deployResult = "TIMEOUT"
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

        # Build advisory list: always-advisory + conditionally Agent Review
        $advisoryNames = [System.Collections.ArrayList]@($AlwaysAdvisory)
        if ($SkipAgentReview) { $advisoryNames.Add("Vercel Agent Review") | Out-Null }

        # Classify checks
        $blocking = @($checksArr | Where-Object { $advisoryNames -notcontains $_.name })
        $advisory = @($checksArr | Where-Object { $advisoryNames -contains $_.name })

        $blockingOk = @($blocking | Where-Object { $_.state -eq "SUCCESS" -or $_.state -eq "NEUTRAL" }).Count
        $blockingFail = @($blocking | Where-Object { $_.state -eq "FAILURE" -or $_.state -eq "ERROR" })
        $blockingPending = @($blocking | Where-Object { $_.state -eq "PENDING" -or $_.state -eq "IN_PROGRESS" })

        $advisoryStr = ($advisory | ForEach-Object { "$($_.name):$($_.state)" }) -join ", "
        $allStr = ($checksArr | ForEach-Object { "$($_.name):$($_.state)" }) -join " | "

        # Agent Review status for display
        $agentCheck = $checksArr | Where-Object { $_.name -eq "Vercel Agent Review" }
        $agentState = if ($agentCheck) { $agentCheck.state } else { "N/A" }
        $agentIcon = switch ($agentState) {
            "SUCCESS" { "[OK]" }
            "FAILURE" { "[X]" }
            "IN_PROGRESS" { "[...]" }
            default { "[-]" }
        }

        Write-Host "  -> [${elapsed}s] Blocking:$blockingOk/$($blocking.Count) | Agent:$agentIcon $agentState | $allStr"  -ForegroundColor Gray

        # Check for failures
        if ($blockingFail.Count -gt 0) {
            # Special case: if ONLY Agent Review failed, show warning but don't block
            $nonAgentFail = @($blockingFail | Where-Object { $_.name -ne "Vercel Agent Review" })
            $agentFailed = @($blockingFail | Where-Object { $_.name -eq "Vercel Agent Review" })
            if ($nonAgentFail.Count -gt 0) {
                $deployResult = "CHECK_FAILED"
                Write-Host ""
                Write-Host "  CHECK FAILED"  -ForegroundColor Red
                foreach ($f in $blockingFail) {
                    Write-Host "    X $($f.name): $($f.description)"  -ForegroundColor Red
                }
                break
            }
            if ($agentFailed.Count -gt 0) {
                Write-Host "  -> Agent Review reportou problemas (review comments posted)"  -ForegroundColor DarkYellow
            }
        }

        # Check if all blocking passed
        if ($blockingOk -eq $blocking.Count -and $blocking.Count -gt 0) {
            $deployResult = "DEPLOY_SUCCESS"
            Write-Host ""
            Write-Host "  ALL CHECKS PASSED"  -ForegroundColor Green
            foreach ($c in $blocking) {
                $icon = if ($c.state -eq "SUCCESS") { "OK" } else { "~" }
                Write-Host "    $icon $($c.name): $($c.state)"  -ForegroundColor Green
            }
            if ($advisory.Count -gt 0) {
                Write-Host "  Advisory: $advisoryStr"  -ForegroundColor DarkGray
            }
            break
        }

        # After 300s, if only Agent Review is pending, allow merge (timeout fallback)
        if ($elapsed -ge $MaxWaitSeconds -and $blockingPending.Count -eq 1) {
            $pendName = $blockingPending[0].name
            if ($pendName -eq "Vercel Agent Review") {
                $deployResult = "AGENT_TIMEOUT"
                Write-Host ""
                Write-Host "  Agent Review: timeout (${MaxWaitSeconds}s) - procedendo com merge"  -ForegroundColor DarkYellow
                break
            }
        }
    }

    if ($deployResult -eq "TIMEOUT") {
        Write-Host "`n  TIMEOUT - Checks nao completaram em ${MaxWaitSeconds}s"  -ForegroundColor DarkYellow
    }

    # ============================================================
    # [8/8] MERGE
    # ============================================================
    if ($deployResult -eq "CHECK_FAILED") {
        Write-Host "[8/8] MERGE BLOQUEADO - Check obrigatorio falhou"  -ForegroundColor Red
    } else {
        Write-Host "[8/8] Merge da PR..."  -ForegroundColor Yellow
        gh pr merge $DeployBranch --merge --delete-branch 2>&1 | Out-Null
        Write-Host "  -> PR merged e branch deletada"  -ForegroundColor Green
    }
} else {
    Write-Host "[7/8] Merge direto no $MainBranch..."  -ForegroundColor Yellow
    git checkout $MainBranch 2>&1 | Out-Null
    git merge $DeployBranch 2>&1 | Out-Null
    git push origin $MainBranch 2>&1 | Out-Null
    git branch -d $DeployBranch 2>&1 | Out-Null
    git push origin --delete $DeployBranch 2>&1 | Out-Null
    Write-Host "  -> Merged e branch deletada"  -ForegroundColor Green
    Write-Host "[8/8] Deploy acionado via push"  -ForegroundColor Green
}

git checkout $MainBranch 2>&1 | Out-Null
Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  RESULTADO: $deployResult"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan
