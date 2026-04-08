'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table2,
  FileText,
  CheckCircle2,
  FileSpreadsheet,
  Pencil,
} from 'lucide-react';
import { JobsTable } from './JobsTable';
import { AnalysisPanel } from './AnalysisPanel';
import {
  exportForMonday,
  downloadBlob,
} from '@/lib/export';

export function OutputPanel() {
  const { currentOutput, inputs, isFinalized, setFinalized, addToHistory } = useSprintStore();
  const jobs = currentOutput?.jobs ?? [];
  const [exporting, setExporting] = useState<'excel' | null>(null);

  if (!currentOutput) return null;

  const getTimestamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const blob = exportForMonday(currentOutput, inputs.breakdowns);
      downloadBlob(blob, `sprint-plan-${getTimestamp()}.xlsx`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Phase banner */}
      {!isFinalized ? (
        /* ── Phase A: Review & Edit ── */
        <div
          className="mx-4 mt-4 mb-0 rounded-xl border p-4 flex items-start justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, hsla(217,91%,60%,0.08), hsla(270,70%,60%,0.06))',
            borderColor: 'hsla(217,91%,60%,0.25)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5"
              style={{ background: 'hsl(217,91%,60%)' }}
            >
              7
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-primary" />
                Review &amp; Edit
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review the AI-generated plan. Edit any cell directly in the table using the dropdowns. When satisfied, approve to finalize.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => { addToHistory(currentOutput, inputs); setFinalized(true); }}
            className="flex-shrink-0 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 hover:border-primary"
            variant="outline"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Approve Sprint Plan
          </Button>
        </div>
      ) : (
        /* ── Phase B: Approved — Export ── */
        <div
          className="mx-4 mt-4 mb-0 rounded-xl border p-4"
          style={{
            background: 'linear-gradient(135deg, hsla(160,84%,39%,0.1), hsla(160,84%,39%,0.04))',
            borderColor: 'hsla(160,84%,39%,0.35)',
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5"
                style={{ background: 'hsl(160,84%,39%)' }}
              >
                8
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  Sprint Plan Approved
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your plan is locked and ready to export.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFinalized(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              Edit plan
            </button>
          </div>

          {/* Export button */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              size="sm"
              onClick={handleExportExcel}
              disabled={exporting !== null}
              className="bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 hover:border-green-500"
              variant="outline"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              {exporting === 'excel' ? 'Exporting…' : 'Export to Excel'}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="flex-1 flex flex-col min-h-0 mt-3">
        <div className="px-4 border-b border-border/30">
          <TabsList className="bg-secondary/30 border border-border/30">
            <TabsTrigger
              value="jobs"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Table2 className="w-4 h-4 mr-2" />
              Jobs Table
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <FileText className="w-4 h-4 mr-2" />
              Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="jobs" className="flex-1 overflow-y-auto p-4 mt-0">
          <JobsTable jobs={currentOutput.jobs} editable={!isFinalized} />
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 overflow-y-auto p-4 mt-0">
          <AnalysisPanel
            analysis={currentOutput.analysis}
            constraints={currentOutput.constraintsSummary}
            jobs={jobs}
            rules={inputs.rules}
            volume={inputs.volume}
            breakdowns={inputs.breakdowns}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
