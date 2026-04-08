'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Button } from '@/components/ui/button';
import { exportForMonday, downloadBlob } from '@/lib/export';
import { FileSpreadsheet } from 'lucide-react';

export function ExportButtons() {
  const { currentOutput, inputs } = useSprintStore();
  const [exporting, setExporting] = useState<'excel' | null>(null);

  if (!currentOutput) return null;

  const getTimestamp = () => {
    const now = new Date();
    return now.toISOString().slice(0, 10).replace(/-/g, '');
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const blob = exportForMonday(currentOutput, inputs.breakdowns);
      const filename = `sprint-plan-${getTimestamp()}.xlsx`;
      downloadBlob(blob, filename);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={exporting !== null}
        className="w-full border-border/50 hover:bg-primary/10 hover:border-primary/50"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        {exporting === 'excel' ? 'Exporting...' : 'Export to Excel'}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Note: Persona not included in exports
      </p>
    </div>
  );
}
