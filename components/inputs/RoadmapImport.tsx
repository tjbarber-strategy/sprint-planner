'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Input } from '@/components/ui/input';
import { Loader2, Link, FileText, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { RoadmapExtraction } from '@/lib/types';

type TabType = 'paste' | 'url' | 'upload';

export function RoadmapImport() {
  const {
    roadmapData,
    isParsingRoadmap,
    setRoadmapData,
    setIsParsingRoadmap,
    applyRoadmapToInputs,
    clearRoadmapData,
    setError,
  } = useSprintStore();

  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [pasteContent, setPasteContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [applied, setApplied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['products', 'motivators', 'visualFormats', 'gaps'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleParse = async () => {
    if (activeTab === 'url') {
      if (!urlInput.trim()) {
        setError('Please enter a Google Docs URL.');
        return;
      }
      if (!urlInput.includes('docs.google.com')) {
        setError('Please enter a valid Google Docs URL.');
        return;
      }

      setIsParsingRoadmap(true);
      setError(null);
      setApplied(false);

      try {
        const response = await fetch('/api/parse-roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch and parse roadmap');
        }

        const data = await response.json();
        setRoadmapData(data.extraction);
        applyRoadmapToInputs(data.extraction);
        setApplied(true);
        // Re-open all sections when new data arrives
        setExpandedSections(new Set(['products', 'motivators', 'visualFormats', 'gaps']));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse roadmap');
      } finally {
        setIsParsingRoadmap(false);
      }
    } else if (activeTab === 'paste') {
      if (!pasteContent.trim()) {
        setError('Please paste roadmap content to parse.');
        return;
      }

      setIsParsingRoadmap(true);
      setError(null);
      setApplied(false);

      try {
        const response = await fetch('/api/parse-roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: pasteContent }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to parse roadmap');
        }

        const data = await response.json();
        setRoadmapData(data.extraction);
        applyRoadmapToInputs(data.extraction);
        setApplied(true);
        setExpandedSections(new Set(['products', 'motivators', 'visualFormats', 'gaps']));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse roadmap');
      } finally {
        setIsParsingRoadmap(false);
      }
    } else if (activeTab === 'upload') {
      // Upload tab
      if (!uploadedFile) {
        setError('Please select a file to upload.');
        return;
      }

      setIsParsingRoadmap(true);
      setError(null);
      setApplied(false);

      try {
        const isPdf = uploadedFile.name.endsWith('.pdf');
        let response: Response;

        if (isPdf) {
          // Use FormData to avoid base64 encoding large files in the browser
          const formData = new FormData();
          formData.append('file', uploadedFile);
          response = await fetch('/api/parse-roadmap', {
            method: 'POST',
            body: formData,
          });
        } else {
          const text = await uploadedFile.text();
          response = await fetch('/api/parse-roadmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text }),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to parse roadmap');
        }

        const data = await response.json();
        setRoadmapData(data.extraction);
        applyRoadmapToInputs(data.extraction);
        setApplied(true);
        setExpandedSections(new Set(['products', 'motivators', 'visualFormats', 'gaps']));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse roadmap');
      } finally {
        setIsParsingRoadmap(false);
      }
    }
  };

  const handleApply = () => {
    if (roadmapData) {
      applyRoadmapToInputs(roadmapData);
    }
    setApplied(true);
  };

  const handleClear = () => {
    clearRoadmapData();
    setPasteContent('');
    setUrlInput('');
    setUploadedFile(null);
    setApplied(false);
  };

  return (
    <div className="space-y-4">
      {/* Tab Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          style={
            activeTab === 'paste'
              ? { backgroundColor: 'hsl(160, 84%, 39%)', color: 'white', border: '2px solid hsl(160, 84%, 39%)' }
              : { backgroundColor: 'transparent', color: 'hsl(215, 20%, 55%)', border: '2px solid hsl(222, 30%, 20%)' }
          }
        >
          <FileText className="w-4 h-4" />
          Paste
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          style={
            activeTab === 'url'
              ? { backgroundColor: 'hsl(160, 84%, 39%)', color: 'white', border: '2px solid hsl(160, 84%, 39%)' }
              : { backgroundColor: 'transparent', color: 'hsl(215, 20%, 55%)', border: '2px solid hsl(222, 30%, 20%)' }
          }
        >
          <Link className="w-4 h-4" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          style={
            activeTab === 'upload'
              ? { backgroundColor: 'hsl(160, 84%, 39%)', color: 'white', border: '2px solid hsl(160, 84%, 39%)' }
              : { backgroundColor: 'transparent', color: 'hsl(215, 20%, 55%)', border: '2px solid hsl(222, 30%, 20%)' }
          }
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Input Area */}
      {activeTab === 'paste' ? (
        <textarea
          value={pasteContent}
          onChange={(e) => setPasteContent(e.target.value)}
          placeholder="Paste your roadmap content here..."
          className="w-full h-32 px-3 py-2 text-sm bg-secondary/50 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={isParsingRoadmap}
        />
      ) : activeTab === 'url' ? (
        <div className="space-y-2">
          <Input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://docs.google.com/document/d/..."
            className="bg-secondary/50 border-border/50"
            disabled={isParsingRoadmap}
          />
          <p className="text-xs text-muted-foreground">
            Paste a Google Docs URL to automatically fetch and parse the roadmap.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label
            className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploadedFile
                ? 'border-primary/50 bg-primary/5'
                : 'border-border/50 bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50'
            } ${isParsingRoadmap ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="flex flex-col items-center gap-1.5">
              <Upload className="w-5 h-5 text-muted-foreground" />
              {uploadedFile ? (
                <span className="text-xs text-primary font-medium">{uploadedFile.name}</span>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">Click to upload PDF or Markdown</span>
                  <span className="text-[10px] text-muted-foreground/60">.pdf, .md</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".pdf,.md"
              className="hidden"
              onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
              disabled={isParsingRoadmap}
            />
          </label>
          {uploadedFile && (
            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear file
            </button>
          )}
        </div>
      )}

      {/* Parse Button */}
      <button
        type="button"
        onClick={handleParse}
        disabled={
          isParsingRoadmap ||
          (activeTab === 'paste' && !pasteContent.trim()) ||
          (activeTab === 'url' && !urlInput.trim()) ||
          (activeTab === 'upload' && !uploadedFile)
        }
        className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isParsingRoadmap ? 'hsl(222, 30%, 18%)' : 'hsl(160, 84%, 39%)',
          color: 'white',
          border: '2px solid hsl(160, 84%, 39%)',
        }}
      >
        {isParsingRoadmap ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Parsing Roadmap...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Parse Roadmap
          </>
        )}
      </button>

      {/* Extraction Results */}
      {roadmapData && (
        <div className="space-y-3 pt-4 border-t border-border/30">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Extraction Complete
            </h4>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Products */}
          {roadmapData.products.length > 0 && (
            <div className="border border-border/30 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('products')}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  Products Found ({roadmapData.products.length})
                </span>
                {expandedSections.has('products') ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has('products') && (
                <div className="px-3 pb-3 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {roadmapData.products.map((product, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs rounded-md"
                        style={{
                          backgroundColor: 'hsla(217, 91%, 60%, 0.2)',
                          color: 'hsl(217, 91%, 60%)',
                          border: '1px solid hsla(217, 91%, 60%, 0.3)',
                        }}
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Motivators */}
          {roadmapData.motivators.length > 0 && (
            <div className="border border-border/30 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('motivators')}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  Motivators/RTBs ({roadmapData.motivators.length})
                </span>
                {expandedSections.has('motivators') ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has('motivators') && (
                <div className="px-3 pb-3 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {roadmapData.motivators.map((m, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs rounded-md"
                        style={{
                          backgroundColor: 'hsla(270, 70%, 60%, 0.2)',
                          color: 'hsl(270, 70%, 60%)',
                          border: m.isGap
                            ? '2px solid hsl(47, 100%, 50%)'
                            : '1px solid hsla(270, 70%, 60%, 0.3)',
                        }}
                      >
                        {m.name}
                        {m.spendPercentage !== undefined && (
                          <span className="ml-1 opacity-70">({m.spendPercentage}%)</span>
                        )}
                        {m.isGap && <span className="ml-1">*</span>}
                      </span>
                    ))}
                  </div>
                  {roadmapData.motivators.some((m) => m.isGap) && (
                    <p className="text-[10px] text-yellow-500 mt-1.5">* = Gap / Underexplored</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Visual Formats */}
          {roadmapData.visualFormats.length > 0 && (
            <div className="border border-border/30 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('visualFormats')}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  Visual Formats ({roadmapData.visualFormats.length})
                </span>
                {expandedSections.has('visualFormats') ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has('visualFormats') && (
                <div className="px-3 pb-3 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {roadmapData.visualFormats.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs rounded-md"
                        style={{
                          backgroundColor: f.isWinning
                            ? 'hsla(160, 84%, 39%, 0.2)'
                            : 'hsla(222, 30%, 25%, 0.5)',
                          color: f.isWinning ? 'hsl(160, 84%, 39%)' : 'hsl(215, 20%, 55%)',
                          border: f.isGap
                            ? '2px solid hsl(47, 100%, 50%)'
                            : f.isWinning
                              ? '1px solid hsla(160, 84%, 39%, 0.3)'
                              : '1px solid hsla(222, 30%, 25%, 0.5)',
                        }}
                      >
                        {f.name}
                        {f.isWinning && <span className="ml-1 text-green-400">+</span>}
                        {f.isGap && <span className="ml-1">*</span>}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    <span className="text-green-400">+</span> = Winning |{' '}
                    <span className="text-yellow-500">*</span> = Gap
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Key Gaps */}
          {roadmapData.gaps.length > 0 && (
            <div className="border border-border/30 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('gaps')}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  Key Gaps ({roadmapData.gaps.length})
                </span>
                {expandedSections.has('gaps') ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has('gaps') && (
                <div className="px-3 pb-3 pt-1 space-y-1.5">
                  {roadmapData.gaps.map((gap, i) => (
                    <div
                      key={i}
                      className="px-2 py-1.5 text-xs rounded-md"
                      style={{
                        backgroundColor: 'hsla(47, 100%, 50%, 0.1)',
                        border: '1px solid hsla(47, 100%, 50%, 0.3)',
                      }}
                    >
                      <span
                        className="inline-block px-1 py-0.5 rounded text-[10px] font-medium mr-1.5"
                        style={{
                          backgroundColor: 'hsla(47, 100%, 50%, 0.2)',
                          color: 'hsl(47, 100%, 50%)',
                        }}
                      >
                        {gap.category.toUpperCase()}
                      </span>
                      <span className="text-foreground">{gap.issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggested Context (Collapsible) */}
          {roadmapData.suggestedContext && (
            <div className="border border-border/30 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('context')}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground">Suggested Context</span>
                {expandedSections.has('context') ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has('context') && (
                <div className="px-3 pb-3 pt-1">
                  <p className="text-xs text-foreground/80">{roadmapData.suggestedContext}</p>
                </div>
              )}
            </div>
          )}

          {/* Apply / Applied status */}
          {applied ? (
            <p className="text-xs text-green-500 text-center">
              ✓ Auto-applied to sprint. Fields below have been populated — review and adjust as needed before generating.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'hsl(217, 91%, 60%)',
                color: 'white',
                border: '2px solid hsl(217, 91%, 60%)',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
              }}
            >
              <FileText className="w-4 h-4" />
              Apply to Sprint
            </button>
          )}
        </div>
      )}
    </div>
  );
}
