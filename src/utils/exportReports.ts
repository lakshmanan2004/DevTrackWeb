export interface TimesheetLogItem {
  id: string;
  date: string;
  hourSlot?: number;
  hourLabel?: string;
  developerName: string;
  developerEmail?: string;
  developerInitials?: string;
  projectName: string;
  teamName?: string;
  moduleName?: string;
  task: string;
  description: string;
  status: string;
  activeMinutes: number;
  durationFormatted?: string;
  review: string;
  reviewNote?: string;
  commitUrl?: string;
  commitsCount?: number;
  blocker?: string;
  isLate?: boolean;
  submittedAt?: string;
}

export interface TimesheetSummary {
  totalLogs: number;
  totalMinutes: number;
  totalHours: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  verifiedCommitsCount: number;
  blockersCount: number;
  approvalRate: number;
}

export interface TimesheetReportData {
  companyName: string;
  logoUrl?: string;
  supportEmail?: string;
  generatedAt: string;
  filter?: {
    projectName?: string;
    developerName?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
  summary: TimesheetSummary;
  logs: TimesheetLogItem[];
}

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates and triggers download of a standardized CSV Timesheet for Excel / Google Sheets
 */
export function downloadCsvTimesheet(report: TimesheetReportData, customFilename?: string) {
  const { companyName, generatedAt, summary, logs, filter } = report;

  const lines: string[] = [];

  // Metadata & Summary Header Block
  lines.push(`${escapeCsvCell(companyName)} - Verified Engineering Timesheet & Audit Report`);
  lines.push(`Generated At,${escapeCsvCell(new Date(generatedAt).toLocaleString())}`);
  if (filter?.projectName) lines.push(`Project,${escapeCsvCell(filter.projectName)}`);
  if (filter?.developerName) lines.push(`Developer,${escapeCsvCell(filter.developerName)}`);
  if (filter?.startDate || filter?.endDate) {
    lines.push(`Date Range,${escapeCsvCell(`${filter?.startDate || 'Earliest'} to ${filter?.endDate || 'Latest'}`)}`);
  }
  lines.push('');

  // KPI Summary Row
  lines.push('Total Logs,Total Hours Logged,Approved Logs,Approval Rate,Verified Git Commits,Blockers Encountered');
  lines.push(
    [
      summary.totalLogs,
      summary.totalHours.toFixed(1),
      summary.approvedCount,
      `${summary.approvalRate}%`,
      summary.verifiedCommitsCount,
      summary.blockersCount
    ].join(',')
  );
  lines.push('');
  lines.push('--- Detailed Work Logs & Verification Audit Trail ---');

  // Detailed Table Headers
  const headers = [
    'Date',
    'Time Slot',
    'Developer',
    'Email',
    'Project',
    'Module',
    'Task Name',
    'Description',
    'Status',
    'Active Minutes',
    'Hours',
    'Review Status',
    'Reviewer Note',
    'Verified Git Commit',
    'Blocker Details',
    'Submitted At'
  ];
  lines.push(headers.map(escapeCsvCell).join(','));

  // Table Data Rows
  for (const log of logs) {
    const row = [
      log.date,
      log.hourLabel || `Slot ${log.hourSlot || ''}`,
      log.developerName,
      log.developerEmail || '',
      log.projectName,
      log.moduleName || 'Core',
      log.task,
      log.description,
      log.status.toUpperCase(),
      log.activeMinutes,
      (log.activeMinutes / 60).toFixed(2),
      log.review.toUpperCase(),
      log.reviewNote || '',
      log.commitUrl || (log.commitsCount ? `${log.commitsCount} commit(s)` : 'No commit linked'),
      log.blocker || '',
      log.submittedAt ? new Date(log.submittedAt).toLocaleTimeString() : ''
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }

  // Prepend UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 properly without garbled characters
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanProject = (filter?.projectName || 'All_Projects').replace(/[^a-zA-Z0-9_-]/g, '_');
  const todayStr = new Date().toISOString().slice(0, 10);
  const fileName = customFilename || `Timesheet_${cleanProject}_${todayStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a clean, high-resolution printable HTML page suitable for Save-as-PDF or printing
 */
export function printTimesheetReport(report: TimesheetReportData) {
  const { companyName, logoUrl, generatedAt, summary, logs, filter } = report;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable client report.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${companyName} — Client Timesheet & Delivery Audit</title>
  <style>
    @page { size: A4 portrait; margin: 16mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .report-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #64748b;
    }
    .meta-box strong { color: #1e293b; }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 7px 8px;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 7px 8px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 10px;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-pending { background: #fef9c3; color: #854d0e; }
    .badge-rejected { background: #fee2e2; color: #b91c1c; }
    .badge-done { background: #e0e7ff; color: #3730a3; }
    .badge-blocked { background: #ffedd5; color: #c2410c; }
    
    .signoff {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-block {
      width: 42%;
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      font-size: 10px;
      color: #475569;
    }
    .sig-title { font-weight: 700; color: #0f172a; margin-bottom: 2px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; align-items: center; gap: 12px;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="height: 42px; width: 42px; object-fit: contain; border-radius: 8px;" />` : ''}
      <div>
        <div class="company-title">${companyName}</div>
        <div class="report-subtitle">Official Engineering Timesheet &amp; Deliverables Audit</div>
      </div>
    </div>
    <div class="meta-box">
      <div><strong>Report Date:</strong> ${new Date(generatedAt).toLocaleDateString()}</div>
      <div><strong>Project:</strong> ${filter?.projectName || 'All Active Projects'}</div>
      ${filter?.developerName ? `<div><strong>Developer:</strong> ${filter.developerName}</div>` : ''}
      <div><strong>Status:</strong> ${filter?.status ? filter.status.toUpperCase() : 'ALL LOGS'}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Time Tracked</div>
      <div class="kpi-value">${summary.totalHours.toFixed(1)} hrs</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Check-Ins</div>
      <div class="kpi-value">${summary.totalLogs}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Approval Rate</div>
      <div class="kpi-value">${summary.approvalRate}%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Verified Git Commits</div>
      <div class="kpi-value">${summary.verifiedCommitsCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Blockers Raised</div>
      <div class="kpi-value">${summary.blockersCount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 75px;">Date &amp; Slot</th>
        <th style="width: 110px;">Developer</th>
        <th style="width: 110px;">Project / Module</th>
        <th>Task Description &amp; Accomplishments</th>
        <th style="width: 60px;">Duration</th>
        <th style="width: 70px;">Task State</th>
        <th style="width: 75px;">Audit Review</th>
      </tr>
    </thead>
    <tbody>
      ${logs.map((l) => `
        <tr>
          <td>
            <strong>${l.date}</strong><br/>
            <span style="color: #64748b; font-size: 9px;">${l.hourLabel || ''}</span>
          </td>
          <td>
            <strong>${l.developerName}</strong><br/>
            <span style="color: #64748b; font-size: 9px;">${l.developerEmail || ''}</span>
          </td>
          <td>
            <strong>${l.projectName}</strong><br/>
            <span style="color: #64748b; font-size: 9px;">${l.moduleName || 'Core Feature'}</span>
          </td>
          <td>
            <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">${l.task}</div>
            <div style="color: #475569;">${l.description}</div>
            ${l.commitUrl ? `<div style="margin-top: 4px; font-size: 9px; color: #2563eb;">✓ Git Proof: ${l.commitUrl}</div>` : ''}
            ${l.blocker ? `<div style="margin-top: 4px; font-size: 9px; color: #dc2626;">⚠ Blocker: ${l.blocker}</div>` : ''}
          </td>
          <td>
            <strong>${l.durationFormatted || `${l.activeMinutes}m`}</strong>
          </td>
          <td>
            <span class="badge badge-${l.status}">${l.status}</span>
          </td>
          <td>
            <span class="badge badge-${l.review}">${l.review}</span>
            ${l.reviewNote ? `<div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">${l.reviewNote}</div>` : ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="signoff">
    <div class="sig-block">
      <div class="sig-title">Client / Project Sponsor Sign-Off</div>
      <div>Name: _____________________________________</div>
      <div style="margin-top: 4px;">Date: ____________________ Signature: __________</div>
    </div>
    <div class="sig-block">
      <div class="sig-title">Engineering Project Manager / Lead</div>
      <div>Name: _____________________________________</div>
      <div style="margin-top: 4px;">Date: ____________________ Signature: __________</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
