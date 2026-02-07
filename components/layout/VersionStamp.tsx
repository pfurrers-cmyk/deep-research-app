'use client';

import { BUILD_INFO } from '@/lib/buildInfo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function formatTimestampBRT(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function VersionStamp() {
  const { version, buildTimestamp, changelog, previousVersion } = BUILD_INFO;
  const formattedDate = formatTimestampBRT(buildTimestamp);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="hidden cursor-default select-none items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono text-muted-foreground/60 transition-colors hover:text-muted-foreground sm:flex">
            <span className="font-semibold">v{version}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{formattedDate}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold">v{version}</span>
              {previousVersion && (
                <span className="text-muted-foreground">anterior: v{previousVersion}</span>
              )}
            </div>
            {changelog && changelog.length > 0 && (
              <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                {changelog.map((item, i) => (
                  <li key={i} className="flex gap-1">
                    <span className="shrink-0 text-primary">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-muted-foreground/50">
              {formattedDate} (GMT-3)
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
