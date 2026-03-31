'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table2,
  FileText,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Pencil,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { JobsTable } from './JobsTable';
import { AnalysisPanel } from './AnalysisPanel';
import {
  exportToCSV,
  exportToExcel,
  exportForMonday,
  downloadCSV,
  downloadBlob,
} from '@/lib/export';

export function OutputPanel() {
  const {
    currentOutput,
    inputs,
    isFinalized,
    setFinalized,
    addToHistory,
    generations,
    currentGenerationIndex,
    navigateGeneration,
    regenerateWithFeedback,
    isRegenerating,
  } = useSprintStore();
  const jobs = currentOutput?.jobs ?? [];
  const [exporting, setExporting] = useState<'csv' | 'excel' | 'monday' | null>(null);
  const [feedback, setFeedback] = useState('');

  if (!currentOutput) return null;

  const getTimestamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const handleExportCSV = async () => {
    setExporting('csv');
    try {
      const csv = exportToCSV(currentOutput, inputs.breakdowns);
      downloadCSV(csv, `sprint-plan-${getTimestamp()}.csv`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const blob = exportToExcel(currentOutput, inputs.breakdowns);
      downloadBlob(blob, `sprint-plan-${getTimestamp()}.xlsx`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportMonday = async () => {
    setExporting('monday');
    try {
      const blob = exportForMonday(currentOutput, inputs.breakdowns);
      downloadBlob(blob, `monday-import-${getTimestamp()}.xlsx`);
    } finally {
      setExporting(null);
    }
  };

  const handleRegenerate = async () => {
    if (!feedback.trim() || isRegenerating) return;
    await regenerateWithFeedback(feedback.trim());
    setFeedback('');
  };

  const totalGens = generations.length;
  const isLatest = currentGenerationIndex === totalGens - 1;
  const canGoBack = currentGenerationIndex > 0;
  const canGoForward = currentGenerationIndex < totalGens - 1;

  return (
    <div className="h-full flex flex-col">
      {/* Phase banner */}
      {!isFinalized ? (
        /* ── Phase A: Review & Edit ── */
        <div
          className="mx-4 mt-4 mb-0 rounded-xl border p-4 flex flex-col gap-3"
          style={{
            background: 'linear-gradient(135deg, hsla(217,91%,60%,0.08), hsla(270,70%,60%,0.06))',
            borderColor: 'hsla(217,91%,60%,0.25)',
          }}
        >
          {/* Top row: step badge + description + approve button */}
          <div className="flex items-start justify-between gap-4">
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
                  Review the AI-generated plan. Edit any cell directly in the table. Give feedback below to regenerate, or approve when satisfied.
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

          {/* Generation carousel (only shown when there are multiple generations) */}
          {totalGens > 1 && (
            <div className="flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => navigateGeneration(currentGenerationIndex - 1)}
                disabled={!canGoBack}
                className="p-1 rounded hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-primary" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Generation {currentGenerationIndex + 1} / {totalGens}
              </span>
              <button
                type="button"
                onClick={() => navigateGeneration(currentGenerationIndex + 1)}
                disabled={!canGoForward}
                className="p-1 rounded hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-primary" />
              </button>
              {generations[currentGenerationIndex]?.feedbackUsed && (
                <span className="text-xs text-muted-foreground/60 truncate max-w-[220px]">
                  {'\u2014 \u201c'}{generations[currentGenerationIndex].feedbackUsed}{'\u201d'}
                </span>
              )}
            </div>
          )}

          {/* Non-latest warning */}
          {!isLatest && totalGens > 1 && (
            <p className="text-xs text-amber-400/80 px-1">
              Viewing generation {currentGenerationIndex + 1}. Regenerating from here will discard generations {currentGenerationIndex + 2}–{totalGens}.
            </p>
          )}

          {/* Feedback + regenerate */}
          <div className="flex gap-2 items-end">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={'Give feedback to regenerate\u2026 e.g. "Add more Meta jobs, reduce FIX types"'}
              className="text-xs resize-none min-h-[60px] flex-1 bg-background/40 border-border/40 placeholder:text-muted-foreground/40"
              disabled={isRegenerating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRegenerate();
              }}
            />
            <Button
              size="sm"
              onClick={handleRegenerate}
              disabled={!feedback.trim() || isRegenerating}
              variant="outline"
              className="flex-shrink-0 self-end border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-40"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span className="ml-1.5">{isRegenerating ? 'Regenerating…' : 'Regenerate'}</span>
            </Button>
          </div>
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
                  Your plan is locked and ready to export. Download as Excel for sharing, or Monday.com for direct import.
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

          {/* Export buttons */}
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
            <Button
              size="sm"
              onClick={handleExportMonday}
              disabled={exporting !== null}
              variant="outline"
              className="border-border/50 hover:bg-secondary/70"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              {exporting === 'monday' ? 'Exporting…' : 'Monday.com'}
            </Button>
            <Button
              size="sm"
              onClick={handleExportCSV}
              disabled={exporting !== null}
              variant="outline"
              className="border-border/50 hover:bg-secondary/70"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              {exporting === 'csv' ? 'Exporting…' : 'CSV'}
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

        <TabsContent
          value="jobs"
          className="flex-1 overflow-y-auto p-4 mt-0 relative"
        >
          {isRegenerating && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/20">
              <div className="flex items-center gap-2 text-sm text-primary bg-background/90 px-4 py-2 rounded-lg border border-primary/30">
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating sprint plan…
              </div>
            </div>
          )}
          <div className={`transition-opacity duration-300 ${isRegenerating ? 'opacity-30' : 'opacity-100'}`}>
            <JobsTable jobs={currentOutput.jobs} editable={!isFinalized && !isRegenerating} />
          </div>
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
