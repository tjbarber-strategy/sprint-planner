'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Button } from '@/components/ui/button';
import {
  exportToCSV,
  exportToExcel,
  exportForMonday,
  downloadCSV,
  downloadBlob,
} from '@/lib/export';
import { FileSpreadsheet, FileText, Calendar } from 'lucide-react';

export function ExportButtons() {
  const { currentOutput, inputs } = useSprintStore();
  const [exporting, setExporting] = useState<'csv' | 'excel' | 'monday' | null>(null);

  if (!currentOutput) return null;

  const getTimestamp = () => {
    const now = new Date();
    return now.toISOString().slice(0, 10).replace(/-/g, '');
  };

  const handleExportCSV = async () => {
    setExporting('csv');
    try {
      const csv = exportToCSV(currentOutput, inputs.breakdowns);
      const filename = `sprint-plan-${getTimestamp()}.csv`;
      downloadCSV(csv, filename);
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const blob = exportToExcel(currentOutput, inputs.breakdowns);
      const filename = `sprint-plan-${getTimestamp()}.xlsx`;
      downloadBlob(blob, filename);
    } finally {
      setExporting(null);
    }
  };

  const handleExportMonday = async () => {
    setExporting('monday');
    try {
      const blob = exportForMonday(currentOutput, inputs.breakdowns);
      const filename = `monday-import-${getTimestamp()}.xlsx`;
      downloadBlob(blob, filename);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={exporting !== null}
          className="flex-1 border-border/50 hover:bg-primary/10 hover:border-primary/50"
        >
          <FileText className="w-4 h-4 mr-2" />
          {exporting === 'csv' ? 'Exporting...' : 'CSV'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={exporting !== null}
          className="flex-1 border-border/50 hover:bg-primary/10 hover:border-primary/50"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {exporting === 'excel' ? 'Exporting...' : 'Excel'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportMonday}
          disabled={exporting !== null}
          className="flex-1 border-border/50 hover:bg-primary/10 hover:border-primary/50"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {exporting === 'monday' ? 'Exporting...' : 'Monday.com'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Note: Persona not included in exports
      </p>
    </div>
  );
}
