'use client';

import { ReactNode } from 'react';
import { Settings, Layers, Lightbulb, MessageSquare, Building2, FileText, LucideIcon } from 'lucide-react';
import { ClientInput } from './ClientInput';
import { VolumeInput } from './VolumeInput';
import { BreakdownSelector } from './BreakdownSelector';
import { NewIdeasInput } from './NewIdeasInput';
import { RoadmapImport } from './RoadmapImport';
import { ContextInput } from './ContextInput';

interface SectionProps {
  icon: LucideIcon;
  iconColor: 'yellow' | 'purple' | 'blue' | 'green';
  title: string;
  description: string;
  stepNumber: number;
  children: ReactNode;
}

function Section({ icon: Icon, iconColor, title, description, stepNumber, children }: SectionProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div className={`icon-container ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span
            className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: 'hsl(215, 20%, 40%)' }}
          >
            {stepNumber}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="section-header mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function InputPanel() {
  return (
    <div className="p-4 space-y-4">
      <Section
        stepNumber={1}
        icon={FileText}
        iconColor="green"
        title="ROADMAP IMPORT"
        description="Start here — parse a Google Docs URL or paste content to auto-populate fields below. You can still edit any field after applying."
      >
        <RoadmapImport />
      </Section>

      <Section
        stepNumber={2}
        icon={Building2}
        iconColor="blue"
        title="CLIENT"
        description="Auto-filled from roadmap, or select manually"
      >
        <ClientInput />
      </Section>

      <Section
        stepNumber={3}
        icon={Settings}
        iconColor="yellow"
        title="VOLUME"
        description="Set total jobs and explore/exploit ratio — adjust roadmap suggestions or configure manually"
      >
        <VolumeInput />
      </Section>

      <Section
        stepNumber={4}
        icon={Layers}
        iconColor="purple"
        title="BREAKDOWNS"
        description="Add sprint rules per breakdown category — auto-filled from roadmap or configure manually"
      >
        <BreakdownSelector />
      </Section>

      <Section
        stepNumber={5}
        icon={Lightbulb}
        iconColor="green"
        title="NEW IDEAS"
        description="Add specific creative ideas that must appear in the sprint"
      >
        <NewIdeasInput />
      </Section>

      <Section
        stepNumber={6}
        icon={MessageSquare}
        iconColor="blue"
        title="ADDITIONAL CONTEXT"
        description="Any extra notes to guide the AI generation"
      >
        <ContextInput />
      </Section>
    </div>
  );
}
