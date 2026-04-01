import * as XLSX from 'xlsx';
import {
  SprintOutput,
  BreakdownTypes,
  JobSlot,
  JobTypeCode,
  // Legacy types
  SprintPlan,
  SprintTask,
} from './types';

// ===========================================
// Constants
// ===========================================

export const MONDAY_COLUMN_MAPPING: Record<string, string> = {
  jobType: 'Job Subtype',
  product: 'Products',
  productCategory: 'Battleground/SKU',
  motivator: 'Swimlane',
  platform: 'Platform',
  buyerFunnelStage: 'Consideration Stage',
  visualFormat: 'Visual Formats',
};

export const NON_EXPORTABLE = ['keyPersona'];

// ===========================================
// Helper Functions
// ===========================================

export function mapJobTypeToSubtype(jobType: JobTypeCode): string {
  const mapping: Record<JobTypeCode, string> = {
    MORE: 'More1',
    UPGRADE: 'Upgrade1',
    ADAPT: 'Adapt2',
    NEW: 'New1',
    FIX: 'Upgrade1',
  };
  return mapping[jobType] || jobType;
}

export function getExportableBreakdowns(breakdowns: BreakdownTypes): string[] {
  const exportable: string[] = [];

  for (const [key, config] of Object.entries(breakdowns)) {
    // Skip non-exportable breakdowns
    if (NON_EXPORTABLE.includes(key)) continue;

    // Skip breakdowns marked as not exportable
    if (!config.exportable) continue;

    // Skip breakdowns with priority 'not_needed'
    if (config.priority === 'not_needed') continue;

    exportable.push(key);
  }

  return exportable;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

// ===========================================
// CSV Export
// ===========================================

export function exportToCSV(output: SprintOutput, breakdowns: BreakdownTypes): string {
  const exportableBreakdowns = getExportableBreakdowns(breakdowns);

  // Build headers
  const headers = ['Slot', 'Job Type', 'Category', ...exportableBreakdowns.map(key => {
    const config = breakdowns[key as keyof BreakdownTypes];
    return config.displayName;
  })];

  // Build rows
  const rows: string[][] = [];

  for (const job of output.jobs) {
    const row: string[] = [
      job.slotNumber.toString(),
      job.jobType,
      job.jobCategory,
    ];

    // Add breakdown values
    for (const key of exportableBreakdowns) {
      const value = job[key];
      row.push(value !== undefined ? String(value) : '');
    }

    rows.push(row);
  }

  // Convert to CSV with proper quoting
  const csvRows = [headers, ...rows].map(row =>
    row.map(cell => {
      // Quote cells that contain commas, quotes, or newlines
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  );

  return csvRows.join('\n');
}

// ===========================================
// Excel Export
// ===========================================

export function exportToExcel(output: SprintOutput, breakdowns: BreakdownTypes): Blob {
  const exportableBreakdowns = getExportableBreakdowns(breakdowns);

  // Build headers
  const headers = ['Slot', 'Job Type', 'Category', ...exportableBreakdowns.map(key => {
    const config = breakdowns[key as keyof BreakdownTypes];
    return config.displayName;
  })];

  // Build data rows
  const data: (string | number)[][] = [];

  for (const job of output.jobs) {
    const row: (string | number)[] = [
      job.slotNumber,
      job.jobType,
      job.jobCategory,
    ];

    // Add breakdown values
    for (const key of exportableBreakdowns) {
      const value = job[key];
      row.push(value !== undefined ? String(value) : '');
    }

    data.push(row);
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  XLSX.utils.book_append_sheet(wb, ws, 'Sprint Plan');

  // Generate blob
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ===========================================
// Monday.com Export
// ===========================================

interface MondayExportOptions {
  client?: string;
}

export function exportForMonday(
  output: SprintOutput,
  breakdowns: BreakdownTypes,
  options: MondayExportOptions = {}
): Blob {
  const exportableBreakdowns = getExportableBreakdowns(breakdowns);

  // Build headers with Monday.com column names
  const headers: string[] = ['Name'];

  // Add mapped column names
  for (const key of exportableBreakdowns) {
    const mondayName = MONDAY_COLUMN_MAPPING[key];
    if (mondayName) {
      headers.push(mondayName);
    }
  }

  // Build data rows
  const data: (string | number)[][] = [];

  for (const job of output.jobs) {
    // Generate job name: "Job{n} - {visualFormat}" or "Job{n} - TBD"
    const visualFormat = job.visualFormat || job['visualFormat'];
    const jobName = `Job${job.slotNumber} - ${visualFormat || 'TBD'}`;

    const row: (string | number)[] = [jobName];

    // Add breakdown values with Monday column mapping
    for (const key of exportableBreakdowns) {
      const mondayName = MONDAY_COLUMN_MAPPING[key];
      if (!mondayName) continue;

      let value = job[key];

      // Special handling for jobType - convert to subtype
      if (key === 'jobType' && value) {
        value = mapJobTypeToSubtype(value as JobTypeCode);
      }

      row.push(value !== undefined ? String(value) : '');
    }

    data.push(row);
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths
  ws['!cols'] = headers.map((_, i) => ({ wch: i === 0 ? 30 : 20 }));

  // Sheet name includes client if provided
  const sheetName = options.client ? `${options.client} Sprint` : 'Monday Import';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate blob
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ===========================================
// Legacy Export Functions (for backwards compatibility)
// ===========================================

interface LegacyExportRow {
  ID: string;
  Title: string;
  Description: string;
  'Story Points': number;
  Priority: string;
  Status: string;
  Category: string;
  Dependencies: string;
  'Acceptance Criteria': string;
  'Estimated Hours': number | string;
}

export function exportLegacyToCSV(plan: SprintPlan): string {
  const rows = transformToLegacyExportRows(plan.tasks);

  // Build CSV manually with proper quoting
  const headers = Object.keys(rows[0] || {});
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(header => {
        const value = String(row[header as keyof LegacyExportRow] || '');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ];

  return csvRows.join('\n');
}

export function exportLegacyToExcel(plan: SprintPlan): Buffer {
  const rows = transformToLegacyExportRows(plan.tasks);

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // Tasks sheet
  const tasksWs = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  tasksWs['!cols'] = [
    { wch: 10 }, // ID
    { wch: 40 }, // Title
    { wch: 60 }, // Description
    { wch: 12 }, // Story Points
    { wch: 10 }, // Priority
    { wch: 12 }, // Status
    { wch: 20 }, // Category
    { wch: 20 }, // Dependencies
    { wch: 60 }, // Acceptance Criteria
    { wch: 15 }, // Estimated Hours
  ];

  XLSX.utils.book_append_sheet(wb, tasksWs, 'Sprint Tasks');

  // Summary sheet
  const summaryData = [
    ['Sprint Plan Summary'],
    [''],
    ['Sprint Name', plan.config.sprintName],
    ['Sprint Goal', plan.config.sprintGoal],
    ['Team Size', plan.config.teamSize],
    ['Duration (days)', plan.config.sprintDurationDays],
    ['Hours per Day', plan.config.hoursPerDay],
    ['Target Velocity', plan.config.velocityPoints],
    ['Actual Points', plan.totalPoints],
    ['Total Tasks', plan.tasks.length],
    [''],
    ['Summary', plan.summary],
    [''],
    ['Risks'],
    ...(plan.risks?.map((r) => ['', r]) || []),
    [''],
    ['Assumptions'],
    ...(plan.assumptions?.map((a) => ['', a]) || []),
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 60 }];

  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

function transformToLegacyExportRows(tasks: SprintTask[]): LegacyExportRow[] {
  return tasks.map((task) => ({
    ID: task.id,
    Title: task.title,
    Description: task.description,
    'Story Points': task.storyPoints,
    Priority: task.priority,
    Status: task.status,
    Category: task.category,
    Dependencies: task.dependencies?.join(', ') || '',
    'Acceptance Criteria': task.acceptanceCriteria?.join('; ') || '',
    'Estimated Hours': task.estimatedHours || '',
  }));
}

export function downloadFile(content: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
