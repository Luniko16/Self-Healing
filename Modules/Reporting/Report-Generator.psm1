# Report Generator Module
# Generates HTML dashboards and analytics reports

Import-Module (Join-Path $PSScriptRoot "..\..\Core-Logging.psm1") -Force

function Get-AgentStatistics {
    <#
    .SYNOPSIS
    Collects statistics from agent logs and reports
    
    .PARAMETER Days
    Number of days to analyze (default: 30)
    
    .RETURNS
    Hashtable containing statistics
    #>
    param(
        [int]$Days = 30
    )
    
    Write-AgentLog -Message "Collecting agent statistics for last $Days days" `
        -Level "INFO" -Component "Reporting" -Operation "Get-AgentStatistics"
    
    $agentPath = "C:\Program Files\SelfHealingAgent"
    $logsPath = Join-Path $agentPath "Logs"
    
    $cutoffDate = (Get-Date).AddDays(-$Days)
    
    # Get all JSON reports
    $reports = Get-ChildItem "$logsPath\*.json" -ErrorAction SilentlyContinue | 
        Where-Object { $_.LastWriteTime -gt $cutoffDate }
    
    $statistics = @{
        TotalExecutions = 0
        TotalIssuesDetected = 0
        TotalIssuesResolved = 0
        SuccessfulRemediations = 0
        FailedRemediations = 0
        PartialRemediations = 0
        ModuleStats = @{}
        IssuesByType = @{}
        RemediationsByDay = @{}
        AverageIssuesPerExecution = 0
        SuccessRate = 0
        EstimatedTimeSavedHours = 0
        Period = @{
            StartDate = $cutoffDate
            EndDate = Get-Date
            Days = $Days
        }
    }
    
    foreach ($reportFile in $reports) {
        try {
            $report = Get-Content $reportFile.FullName -Raw | ConvertFrom-Json
            
            $statistics.TotalExecutions++
            
            # Module statistics
            $module = $report.Module
            if (-not $statistics.ModuleStats.ContainsKey($module)) {
                $statistics.ModuleStats[$module] = @{
                    Executions = 0
                    IssuesDetected = 0
                    IssuesResolved = 0
                    Successful = 0
                    Failed = 0
                }
            }
            
            $statistics.ModuleStats[$module].Executions++
            
            # Detection statistics
            if ($report.Detection) {
                $issueCount = if ($report.Detection.IssueCount) { 
                    $report.Detection.IssueCount 
                } else { 
                    $report.Detection.Issues.Count 
                }
                
                $statistics.TotalIssuesDetected += $issueCount
                $statistics.ModuleStats[$module].IssuesDetected += $issueCount
                
                # Track issues by type
                foreach ($issue in $report.Detection.Issues) {
                    $issueType = if ($issue -match "^(CRITICAL|WARNING):") {
                        $matches[1]
                    } else {
                        "INFO"
                    }
                    
                    if (-not $statistics.IssuesByType.ContainsKey($issueType)) {
                        $statistics.IssuesByType[$issueType] = 0
                    }
                    $statistics.IssuesByType[$issueType]++
                }
            }
            
            # Remediation statistics
            if ($report.Remediation) {
                $actionCount = if ($report.Remediation.ActionsTaken) {
                    $report.Remediation.ActionsTaken.Count
                } else {
                    0
                }
                
                if ($report.Remediation.Success) {
                    $statistics.SuccessfulRemediations++
                    $statistics.ModuleStats[$module].Successful++
                } else {
                    $statistics.FailedRemediations++
                    $statistics.ModuleStats[$module].Failed++
                }
            }
            
            # Resolution status
            switch ($report.ResolutionStatus) {
                "FULLY_RESOLVED" {
                    $statistics.TotalIssuesResolved += $issueCount
                    $statistics.ModuleStats[$module].IssuesResolved += $issueCount
                }
                "PARTIALLY_RESOLVED" {
                    $statistics.PartialRemediations++
                    if ($report.Verification) {
                        $resolved = ($report.Verification.Results | Where-Object { $_.Fixed }).Count
                        $statistics.TotalIssuesResolved += $resolved
                        $statistics.ModuleStats[$module].IssuesResolved += $resolved
                    }
                }
            }
            
            # Track by day
            $day = $report.Timestamp.ToString("yyyy-MM-dd")
            if (-not $statistics.RemediationsByDay.ContainsKey($day)) {
                $statistics.RemediationsByDay[$day] = 0
            }
            $statistics.RemediationsByDay[$day]++
            
        }
        catch {
            Write-AgentLog -Message "Failed to process report $($reportFile.Name): $_" `
                -Level "WARN" -Component "Reporting"
        }
    }
    
    # Calculate derived statistics
    if ($statistics.TotalExecutions -gt 0) {
        $statistics.AverageIssuesPerExecution = [math]::Round(
            $statistics.TotalIssuesDetected / $statistics.TotalExecutions, 2
        )
    }
    
    if ($statistics.TotalIssuesDetected -gt 0) {
        $statistics.SuccessRate = [math]::Round(
            ($statistics.TotalIssuesResolved / $statistics.TotalIssuesDetected) * 100, 2
        )
    }
    
    # Estimate time saved (assume 15 minutes per issue resolved)
    $statistics.EstimatedTimeSavedHours = [math]::Round(
        ($statistics.TotalIssuesResolved * 15) / 60, 1
    )
    
    Write-AgentLog -Message "Statistics collected: $($statistics.TotalExecutions) executions, $($statistics.TotalIssuesResolved) issues resolved" `
        -Level "INFO" -Component "Reporting"
    
    return $statistics
}

function Generate-AgentReport {
    <#
    .SYNOPSIS
    Generates comprehensive HTML dashboard report
    
    .PARAMETER Days
    Number of days to include in report (default: 30)
    
    .PARAMETER OutputPath
    Path to save the HTML report
    
    .RETURNS
    Path to generated report
    #>
    param(
        [int]$Days = 30,
        [string]$OutputPath = "C:\Program Files\SelfHealingAgent\Reports\Dashboard.html"
    )
    
    Write-AgentLog -Message "Generating agent report for last $Days days" `
        -Level "INFO" -Component "Reporting" -Operation "Generate-AgentReport"
    
    # Ensure Reports directory exists
    $reportsDir = Split-Path $OutputPath -Parent
    if (-not (Test-Path $reportsDir)) {
        New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
    }
    
    # Collect statistics
    $stats = Get-AgentStatistics -Days $Days
    
    # Get recent issues
    $agentPath = "C:\Program Files\SelfHealingAgent"
    $logsPath = Join-Path $agentPath "Logs"
    
    $recentReports = Get-ChildItem "$logsPath\*.json" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 10
    
    $recentIssues = @()
    foreach ($reportFile in $recentReports) {
        try {
            $report = Get-Content $reportFile.FullName -Raw | ConvertFrom-Json
            $recentIssues += @{
                Timestamp = $report.Timestamp
                Module = $report.Module
                Status = $report.ResolutionStatus
                IssueCount = if ($report.Detection.IssueCount) { $report.Detection.IssueCount } else { 0 }
                Issues = $report.Detection.Issues
            }
        }
        catch {
            # Skip invalid reports
        }
    }
    
    # Generate chart data
    $chartData = @{
        ModuleLabels = ($stats.ModuleStats.Keys | ForEach-Object { "'$_'" }) -join ','
        ModuleIssues = ($stats.ModuleStats.Values | ForEach-Object { $_.IssuesDetected }) -join ','
        ModuleResolved = ($stats.ModuleStats.Values | ForEach-Object { $_.IssuesResolved }) -join ','
        DayLabels = ($stats.RemediationsByDay.Keys | Sort-Object | ForEach-Object { "'$_'" }) -join ','
        DayValues = ($stats.RemediationsByDay.Keys | Sort-Object | ForEach-Object { $stats.RemediationsByDay[$_] }) -join ','
    }
    
    # Build HTML report
    $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Self-Healing Agent Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js" onerror="console.warn('CDN unavailable - charts disabled')"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .header h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 14px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stat-card .value {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-card .subtext {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }
        
        .stat-card.success .value { color: #10b981; }
        .stat-card.warning .value { color: #f59e0b; }
        .stat-card.error .value { color: #ef4444; }
        .stat-card.info .value { color: #3b82f6; }
        
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .chart-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .chart-card h2 {
            margin-bottom: 20px;
            color: #667eea;
            font-size: 18px;
        }
        
        .recent-issues {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .recent-issues h2 {
            margin-bottom: 20px;
            color: #667eea;
            font-size: 18px;
        }
        
        .issue-item {
            padding: 15px;
            border-left: 4px solid #667eea;
            background: #f9fafb;
            margin-bottom: 10px;
            border-radius: 5px;
        }
        
        .issue-item.resolved {
            border-left-color: #10b981;
        }
        
        .issue-item.partial {
            border-left-color: #f59e0b;
        }
        
        .issue-item.failed {
            border-left-color: #ef4444;
        }
        
        .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .issue-module {
            font-weight: bold;
            color: #667eea;
        }
        
        .issue-time {
            font-size: 12px;
            color: #999;
        }
        
        .issue-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .issue-status.resolved {
            background: #d1fae5;
            color: #065f46;
        }
        
        .issue-status.partial {
            background: #fef3c7;
            color: #92400e;
        }
        
        .issue-status.failed {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .issue-list {
            font-size: 13px;
            color: #666;
            margin-top: 10px;
        }
        
        .issue-list li {
            margin-left: 20px;
            margin-bottom: 5px;
        }
        
        .footer {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Self-Healing Agent Dashboard</h1>
            <p>Generated: $(Get-Date -Format "MMMM dd, yyyy HH:mm:ss") | Period: Last $Days days | Endpoint: $env:COMPUTERNAME</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card success">
                <h3>Total Executions</h3>
                <div class="value">$($stats.TotalExecutions)</div>
                <div class="subtext">Agent runs in last $Days days</div>
            </div>
            
            <div class="stat-card info">
                <h3>Issues Detected</h3>
                <div class="value">$($stats.TotalIssuesDetected)</div>
                <div class="subtext">Avg: $($stats.AverageIssuesPerExecution) per execution</div>
            </div>
            
            <div class="stat-card success">
                <h3>Issues Resolved</h3>
                <div class="value">$($stats.TotalIssuesResolved)</div>
                <div class="subtext">Success rate: $($stats.SuccessRate)%</div>
            </div>
            
            <div class="stat-card warning">
                <h3>Time Saved</h3>
                <div class="value">$($stats.EstimatedTimeSavedHours)h</div>
                <div class="subtext">Estimated IT support hours</div>
            </div>
        </div>
        
        <div class="chart-grid">
            <div class="chart-card">
                <h2>📊 Issues by Module</h2>
                <canvas id="moduleChart"></canvas>
            </div>
            
            <div class="chart-card">
                <h2>📈 Activity Over Time</h2>
                <canvas id="timelineChart"></canvas>
            </div>
        </div>
        
        <div class="recent-issues">
            <h2>🔍 Recent Activity</h2>
"@

    # Add recent issues
    foreach ($issue in $recentIssues) {
        $statusClass = switch ($issue.Status) {
            "FULLY_RESOLVED" { "resolved" }
            "PARTIALLY_RESOLVED" { "partial" }
            "FAILED" { "failed" }
            default { "" }
        }
        
        $statusText = switch ($issue.Status) {
            "FULLY_RESOLVED" { "Resolved" }
            "PARTIALLY_RESOLVED" { "Partial" }
            "FAILED" { "Failed" }
            "NO_ISSUES" { "No Issues" }
            default { $issue.Status }
        }
        
        $timestamp = if ($issue.Timestamp) {
            [DateTime]::Parse($issue.Timestamp).ToString("MMM dd, yyyy HH:mm")
        } else {
            "Unknown"
        }
        
        $html += @"
            <div class="issue-item $statusClass">
                <div class="issue-header">
                    <span class="issue-module">$($issue.Module)</span>
                    <span class="issue-time">$timestamp</span>
                </div>
                <span class="issue-status $statusClass">$statusText</span>
                <span style="margin-left: 10px; font-size: 12px; color: #666;">$($issue.IssueCount) issue(s)</span>
"@
        
        if ($issue.Issues -and $issue.Issues.Count -gt 0) {
            $html += "<ul class='issue-list'>"
            foreach ($issueText in ($issue.Issues | Select-Object -First 3)) {
                $html += "<li>$issueText</li>"
            }
            if ($issue.Issues.Count -gt 3) {
                $html += "<li><em>... and $($issue.Issues.Count - 3) more</em></li>"
            }
            $html += "</ul>"
        }
        
        $html += "</div>"
    }

    $html += @"
        </div>
        
        <div class="footer">
            <p>Self-Healing Agent v1.0.0 | Automated IT Support | $env:COMPUTERNAME</p>
        </div>
    </div>
    
    <script>
        // Module Chart
        const moduleCtx = document.getElementById('moduleChart').getContext('2d');
        new Chart(moduleCtx, {
            type: 'bar',
            data: {
                labels: [$($chartData.ModuleLabels)],
                datasets: [{
                    label: 'Issues Detected',
                    data: [$($chartData.ModuleIssues)],
                    backgroundColor: 'rgba(102, 126, 234, 0.5)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }, {
                    label: 'Issues Resolved',
                    data: [$($chartData.ModuleResolved)],
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Timeline Chart
        const timelineCtx = document.getElementById('timelineChart').getContext('2d');
        new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: [$($chartData.DayLabels)],
                datasets: [{
                    label: 'Executions',
                    data: [$($chartData.DayValues)],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
</body>
</html>
"@

    # Save report
    try {
        $html | Out-File -FilePath $OutputPath -Encoding UTF8 -Force
        Write-AgentLog -Message "Report generated successfully: $OutputPath" `
            -Level "AUDIT" -Component "Reporting"
        
        return $OutputPath
    }
    catch {
        Write-AgentLog -Message "Failed to save report: $_" `
            -Level "ERROR" -Component "Reporting"
        return $null
    }
}

Export-ModuleMember -Function Get-AgentStatistics, Generate-AgentReport
