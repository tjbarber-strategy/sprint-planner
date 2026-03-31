'use client';

import { useSprintStore } from '@/store/sprint-store';
import { JobSlot, BreakdownTypes, JOB_TYPE_CONFIG, JobTypeCode } from '@/lib/types';
import { getExportableBreakdowns } from '@/lib/export';

const JOB_TYPE_OPTIONS: JobTypeCode[] = ['MORE', 'UPGRADE', 'ADAPT', 'NEW', 'FIX'];

interface JobsTableProps {
  jobs: JobSlot[];
  editable?: boolean;
}

export function JobsTable({ jobs, editable = false }: JobsTableProps) {
  const { inputs, updateJobInOutput } = useSprintStore();

  const activeBreakdownKeys = getExportableBreakdowns(inputs.breakdowns).filter(
    (key) => key !== 'jobType'
  );

  const totalJobs = jobs.length;
  const exploreJobs = jobs.filter((job) => job.jobCategory === 'Explore').length;
  const exploitJobs = jobs.filter((job) => job.jobCategory === 'Exploit').length;

  const cellStyle =
    'w-full bg-secondary/40 border border-border/50 rounded px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer';

  return (
    <div className="space-y-4">
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Job Type</th>
                <th>Category</th>
                {activeBreakdownKeys.map((key) => (
                  <th key={key}>
                    {inputs.breakdowns[key as keyof BreakdownTypes]?.displayName || key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const isExplore = job.jobCategory === 'Explore';
                const jobTypeConfig = JOB_TYPE_CONFIG[job.jobType];

                return (
                  <tr key={job.slotNumber}>
                    <td>
                      <span className="font-mono text-muted-foreground">
                        {job.slotNumber}
                      </span>
                    </td>

                    {/* Job Type cell */}
                    <td>
                      {editable ? (
                        <select
                          value={job.jobType}
                          onChange={(e) =>
                            updateJobInOutput(job.slotNumber, {
                              jobType: e.target.value as JobTypeCode,
                              jobCategory:
                                JOB_TYPE_CONFIG[e.target.value as JobTypeCode]?.category ??
                                job.jobCategory,
                            })
                          }
                          style={{
                            width: '100%',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.875rem',
                            outline: 'none',
                            cursor: 'pointer',
                            background: isExplore
                              ? 'hsla(270,70%,60%,0.15)'
                              : 'hsla(160,84%,39%,0.15)',
                            border: `1px solid ${isExplore ? 'hsla(270,70%,60%,0.4)' : 'hsla(160,84%,39%,0.4)'}`,
                            color: isExplore ? 'hsl(270,70%,72%)' : 'hsl(160,84%,55%)',
                          }}
                        >
                          {JOB_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} style={{ background: 'hsl(222,30%,14%)', color: 'inherit' }}>
                              {JOB_TYPE_CONFIG[opt].label} ({opt})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={isExplore ? 'badge-explore' : 'badge-exploit'}>
                          {jobTypeConfig?.label || job.jobType}
                        </span>
                      )}
                    </td>

                    {/* Category (derived — read-only) */}
                    <td>
                      <span
                        className={`text-sm ${isExplore ? 'text-purple-400' : 'text-green-400'}`}
                      >
                        {job.jobCategory}
                      </span>
                    </td>

                    {/* Breakdown cells */}
                    {activeBreakdownKeys.map((key) => {
                      const value = job[key];
                      const options =
                        inputs.breakdowns[key as keyof BreakdownTypes]?.options ?? [];

                      if (editable) {
                        return (
                          <td key={key}>
                            {options.length > 0 ? (
                              <select
                                className={cellStyle}
                                value={String(value ?? '')}
                                onChange={(e) =>
                                  updateJobInOutput(job.slotNumber, {
                                    [key]: e.target.value,
                                  })
                                }
                              >
                                <option value="">—</option>
                                {options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className={cellStyle}
                                value={String(value ?? '')}
                                onChange={(e) =>
                                  updateJobInOutput(job.slotNumber, {
                                    [key]: e.target.value,
                                  })
                                }
                              />
                            )}
                          </td>
                        );
                      }

                      return (
                        <td key={key}>
                          <span className="text-sm text-muted-foreground">
                            {value !== undefined && value !== null ? String(value) : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-foreground">{totalJobs} jobs</span>
        </div>
        <div className="w-px h-4 bg-border/50" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-purple-400">Explore:</span>
          <span className="font-semibold text-foreground">{exploreJobs}</span>
        </div>
        <div className="w-px h-4 bg-border/50" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-400">Exploit:</span>
          <span className="font-semibold text-foreground">{exploitJobs}</span>
        </div>
      </div>
    </div>
  );
}
