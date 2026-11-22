import { CheckCircle2, Loader2 } from 'lucide-react';

export type PublishPhase = 'idle' | 'saving-draft' | 'publishing' | 'syncing' | 'complete';

interface PublishProgressBarProps {
  phase: PublishPhase;
  label?: string;
}

const PHASE_CONFIG: Record<
  Exclude<PublishPhase, 'idle'>,
  { widthClass: string; defaultLabel: string; percentLabel: string }
> = {
  'saving-draft': {
    widthClass: 'w-1/4',
    defaultLabel: 'Saving latest draft snapshot…',
    percentLabel: '25%',
  },
  publishing: {
    widthClass: 'w-2/3',
    defaultLabel: 'Publishing immutable live revision…',
    percentLabel: '65%',
  },
  syncing: {
    widthClass: 'w-11/12',
    defaultLabel: 'Syncing live page index & cache…',
    percentLabel: '90%',
  },
  complete: {
    widthClass: 'w-full',
    defaultLabel: 'Published live',
    percentLabel: '100%',
  },
};

export function PublishProgressBar({ phase, label }: PublishProgressBarProps) {
  if (phase === 'idle') return null;

  const cfg = PHASE_CONFIG[phase];
  const isDone = phase === 'complete';

  return (
    <div
      className="rounded-md border border-zinc-200 bg-[#FAF9F6] px-3.5 py-2.5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-medium text-[#111111]">
          {isDone ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#111111]" />
          )}
          <span>{label || cfg.defaultLabel}</span>
        </div>
        <span className="font-mono text-[11px] font-medium text-zinc-600 tabular-nums">
          {cfg.percentLabel}
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isDone ? 'bg-emerald-600' : 'bg-[#111111]'
          } ${cfg.widthClass}`}
        />
      </div>
    </div>
  );
}
