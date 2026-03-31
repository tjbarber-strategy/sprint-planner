'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSprintStore } from '@/store/sprint-store';
import { ChevronDownIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const CLIENTS = [
  "Awara",
  "BarkBox",
  "BetterHelp",
  "Bill Doctor",
  "Blissy",
  "Clean People",
  "CookUnity",
  "DreamCloud",
  "Dr. Squatch",
  "EveryPlate US",
  "Factor INTL",
  "Factor US",
  "Freedom Debt Relief",
  "Gen Digital",
  "Good Chop",
  "Greenlight",
  "HelloFresh INTL",
  "HelloFresh US",
  "Hers Weight Loss",
  "Hims & Hers Hair Loss",
  "Hims ED",
  "Hims Weight Loss",
  "Home Chef",
  "Honeylove",
  "Il Makiage",
  "Instant Hydration",
  "Javvy Coffee",
  "Kitsch",
  "L'Ange",
  "MoonBrew",
  "Muddy Mats",
  "Nectar",
  "Noom International",
  "Noom US",
  "Novig",
  "Pair Eyewear",
  "Paleovalley",
  "Perplexity",
  "Pets Table",
  "Pretty Litter",
  "Prose",
  "Reframe",
  "Rocket Money",
  "Scentbird",
  "Siena",
  "Sofi",
  "The Farmer's Dog",
  "Thrive Market",
  "Uber Eats",
  "Uber Ride",
  "Wag",
  "Wild Pastures",
  "WW",
  "Youfoodz INTL",
];

export function ClientInput() {
  const { inputs, setClient } = useSprintStore();
  const { clientName } = inputs.client;

  const [query, setQuery] = useState(clientName);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isInList = CLIENTS.includes(clientName);
  const isRoadmapOverride = clientName.trim() !== '' && !isInList;

  const filtered = query.trim() === ''
    ? CLIENTS
    : CLIENTS.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  function updateDropdownPosition() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }

  function select(name: string) {
    setClient({ clientName: name });
    setQuery(name);
    setOpen(false);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setQuery(clientName);
  }, [clientName]);

  const showRoadmapOption = open && isRoadmapOverride && !CLIENTS.some(
    (c) => c.toLowerCase() === query.toLowerCase()
  );

  const dropdown = open && (filtered.length > 0 || showRoadmapOption) ? (
    <ul
      style={dropdownStyle}
      className={cn(
        "max-h-60 overflow-y-auto rounded-md border shadow-2xl",
        "bg-[hsl(222,40%,12%)] border-[hsl(222,30%,25%)]"
      )}
    >
      {/* Roadmap override option pinned at top */}
      {showRoadmapOption && (
        <li
          onMouseDown={() => select(clientName)}
          className="px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 border-b border-[hsl(222,30%,22%)]"
          style={{ background: 'hsla(160,84%,39%,0.08)' }}
        >
          <FileText className="w-3 h-3 flex-shrink-0" style={{ color: 'hsl(160,84%,50%)' }} />
          <span className="text-foreground">{clientName}</span>
          <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: 'hsl(160,84%,50%)' }}>
            from roadmap
          </span>
        </li>
      )}
      {filtered.map((client) => (
        <li
          key={client}
          onMouseDown={() => select(client)}
          className={cn(
            "px-3 py-1.5 text-sm cursor-pointer text-foreground",
            "hover:bg-[hsl(222,30%,18%)]",
            client === clientName && "bg-[hsl(222,30%,20%)]"
          )}
        >
          {client}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Select or search client..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setClient({ clientName: e.target.value });
            setOpen(true);
            updateDropdownPosition();
          }}
          onFocus={() => {
            updateDropdownPosition();
            setOpen(true);
          }}
          className={cn(
            "w-full h-10 px-3 pr-8 rounded-md border text-sm bg-secondary/50 border-border/50",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
            "transition-[color,box-shadow]"
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            updateDropdownPosition();
            setOpen((o) => !o);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <ChevronDownIcon className="size-4" />
        </button>
      </div>

      {mounted && createPortal(dropdown, document.body)}

      {isRoadmapOverride && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px]" style={{ color: 'hsl(160,84%,50%)' }}>
          <FileText className="w-3 h-3" />
          From roadmap — not in client list, but will be used as-is
        </p>
      )}
    </div>
  );
}
