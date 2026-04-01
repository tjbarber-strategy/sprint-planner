'use client';

import { useSprintStore } from '@/store/sprint-store';
import { Input } from '@/components/ui/input';
import { JOB_TYPE_CONFIG, JobTypeCode, TimelineType } from '@/lib/types';

const TIMELINE_OPTIONS: { value: TimelineType; label: string; multiplier: number }[] = [
  { value: 'weekly', label: 'Weekly', multiplier: 1 },
  { value: 'monthly', label: 'Monthly', multiplier: 4 },
  { value: 'quarterly', label: 'Quarterly', multiplier: 12 },
];

export function VolumeInput() {
  const { inputs, setVolume } = useSprintStore();
  const { totalJobs, explorePercentage, netNewPercentage, timeline, timelineCount = 1 } = inputs.volume;

  // Main category calculations
  const exploitPercentage = 100 - explorePercentage;
  const exploreJobs = Math.round((totalJobs * explorePercentage) / 100);
  const exploitJobs = totalJobs - exploreJobs;

  // Explore subdivision calculations
  const horizontalScalingPercentage = 100 - netNewPercentage;
  const netNewJobs = Math.round((exploreJobs * netNewPercentage) / 100);
  const horizontalScalingJobs = exploreJobs - netNewJobs;

  // Get types by category
  const netNewTypes = Object.entries(JOB_TYPE_CONFIG)
    .filter(([_, config]) => config.category === 'Explore' && config.exploreSubcategory === 'Net New')
    .map(([code]) => code as JobTypeCode);

  const horizontalScalingTypes = Object.entries(JOB_TYPE_CONFIG)
    .filter(([_, config]) => config.category === 'Explore' && config.exploreSubcategory === 'Horizontal Scaling')
    .map(([code]) => code as JobTypeCode);

  const exploitTypes = Object.entries(JOB_TYPE_CONFIG)
    .filter(([_, config]) => config.category === 'Exploit')
    .map(([code]) => code as JobTypeCode);

  const handleTimelineChange = (newTimeline: TimelineType) => {
    const currentOption = TIMELINE_OPTIONS.find((t) => t.value === timeline);
    const newOption = TIMELINE_OPTIONS.find((t) => t.value === newTimeline);

    if (!currentOption || !newOption) return;

    const conversionFactor = newOption.multiplier / currentOption.multiplier;
    const newTotalJobs = Math.round(totalJobs * conversionFactor);

    setVolume({
      ...inputs.volume,
      totalJobs: Math.max(1, newTotalJobs),
      timeline: newTimeline,
    });
  };

  return (
    <div className="space-y-4">
      {/* Timeline Toggle */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">
          Planning Period
        </label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min={1}
            max={52}
            value={timelineCount}
            onChange={(e) =>
              setVolume({ ...inputs.volume, timelineCount: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="w-16 h-10 bg-secondary/50 border-border/50 text-center font-semibold"
          />
          {TIMELINE_OPTIONS.map((option) => {
            const isSelected = timeline === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleTimelineChange(option.value)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 border-2"
                style={
                  isSelected
                    ? {
                        backgroundColor: 'hsl(217, 91%, 60%)',
                        color: 'white',
                        borderColor: 'hsl(217, 91%, 60%)',
                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                        transform: 'scale(1.02)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: 'hsl(215, 20%, 40%)',
                        borderColor: 'hsl(222, 30%, 20%)',
                      }
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Total Jobs Input */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Total Jobs (per {timelineCount > 1 ? `${timelineCount} ` : ''}{timeline === 'weekly' ? timelineCount === 1 ? 'week' : 'weeks' : timeline === 'monthly' ? timelineCount === 1 ? 'month' : 'months' : timelineCount === 1 ? 'quarter' : 'quarters'})
        </label>
        <Input
          type="number"
          min={1}
          max={500}
          value={totalJobs}
          onChange={(e) =>
            setVolume({ ...inputs.volume, totalJobs: parseInt(e.target.value) || 1 })
          }
          className="bg-secondary/50 border-border/50 h-9"
        />
      </div>

      {/* Explore/Exploit Slider */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Explore / Exploit Ratio
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={explorePercentage}
          onChange={(e) =>
            setVolume({ ...inputs.volume, explorePercentage: parseInt(e.target.value) })
          }
          className="w-full h-2 bg-secondary/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs">
              <span className="text-purple-400 font-medium">Explore:</span>{' '}
              <span className="text-muted-foreground">
                {explorePercentage}% ({exploreJobs} jobs)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs">
              <span className="text-green-400 font-medium">Exploit:</span>{' '}
              <span className="text-muted-foreground">
                {exploitPercentage}% ({exploitJobs} jobs)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Net New / Horizontal Scaling Slider (within Explore) */}
      {exploreJobs > 0 && (
        <div className="pl-4 border-l-2 border-purple-500/30">
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Explore Breakdown: Net New / Horizontal Scaling
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={netNewPercentage}
            onChange={(e) =>
              setVolume({ ...inputs.volume, netNewPercentage: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-secondary/50 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <div className="flex justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-xs">
                <span className="text-violet-400 font-medium">Net New:</span>{' '}
                <span className="text-muted-foreground">
                  {netNewPercentage}% ({netNewJobs} jobs)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs">
                <span className="text-indigo-400 font-medium">Horizontal:</span>{' '}
                <span className="text-muted-foreground">
                  {horizontalScalingPercentage}% ({horizontalScalingJobs} jobs)
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Breakdown Bar */}
      <div className="pt-3 border-t border-border/30">
        <label className="text-xs text-muted-foreground mb-2 block">
          Job Distribution Preview
        </label>
        <div className="h-8 rounded-lg overflow-hidden flex">
          {/* Net New (Adapt/New) */}
          {netNewJobs > 0 && (
            <div
              className="bg-violet-500 flex items-center justify-center text-[10px] font-medium text-white"
              style={{ width: `${(netNewJobs / totalJobs) * 100}%` }}
              title={`Net New: ${netNewJobs} jobs`}
            >
              {netNewJobs > 1 && `${netNewJobs}`}
            </div>
          )}
          {/* Horizontal Scaling (Upgrade) */}
          {horizontalScalingJobs > 0 && (
            <div
              className="bg-indigo-500 flex items-center justify-center text-[10px] font-medium text-white"
              style={{ width: `${(horizontalScalingJobs / totalJobs) * 100}%` }}
              title={`Horizontal Scaling: ${horizontalScalingJobs} jobs`}
            >
              {horizontalScalingJobs > 1 && `${horizontalScalingJobs}`}
            </div>
          )}
          {/* Exploit (More/Upgrade) */}
          {exploitJobs > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center text-[10px] font-medium text-white"
              style={{ width: `${(exploitJobs / totalJobs) * 100}%` }}
              title={`Exploit: ${exploitJobs} jobs`}
            >
              {exploitJobs > 1 && `${exploitJobs}`}
            </div>
          )}
        </div>
        {/* Legend for bar */}
        <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-violet-500" />
            <span className="text-muted-foreground">Net New (Adapt/New)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-indigo-500" />
            <span className="text-muted-foreground">Horizontal (Upgrade)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">Exploit (More/Upgrade)</span>
          </div>
        </div>
      </div>

      {/* Type Legend */}
      <div className="pt-3 border-t border-border/30">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-violet-400 font-medium mb-1">Net New</p>
            <div className="flex flex-wrap gap-1">
              {netNewTypes.map((type) => (
                <span
                  key={type}
                  className="px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded text-[10px]"
                >
                  {JOB_TYPE_CONFIG[type].label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-indigo-400 font-medium mb-1">Horizontal</p>
            <div className="flex flex-wrap gap-1">
              {horizontalScalingTypes.map((type) => (
                <span
                  key={type}
                  className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[10px]"
                >
                  {JOB_TYPE_CONFIG[type].label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-green-400 font-medium mb-1">Exploit</p>
            <div className="flex flex-wrap gap-1">
              {exploitTypes.map((type) => (
                <span
                  key={type}
                  className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[10px]"
                >
                  {JOB_TYPE_CONFIG[type].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
