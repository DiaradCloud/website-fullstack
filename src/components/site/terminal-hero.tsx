import { useEffect, useState } from "react";
import { HOST } from "@/lib/constants";

type Line = { text: string; tone?: "prompt" | "ok" | "muted" | "warn" };

const SCRIPT: Line[] = [
  { text: `ssh diarad@$diarad.2bd.net -p 2020`, tone: "prompt" },
  { text: "Welcome to Diarad Cloud — Ubuntu 24.04 LTS", tone: "muted" },
  { text: "diarad@diarad:~$ diarad status", tone: "prompt" },
  { text: "● cloudlet   active      31 days left", tone: "ok" },
  { text: "● bandwidth  412 / 2000 GB", tone: "ok" },
  { text: "● network    net1.diarad.2bd.net", tone: "muted" },
  { text: "diarad@diarad:~$ diarad intl --status", tone: "prompt" },
  { text: "✓ international route enabled — no content filter", tone: "ok" },
  { text: "diarad@diarad:~$ _", tone: "prompt" },
];

const TONE: Record<string, string> = {
  prompt: "text-primary",
  ok: "text-success",
  warn: "text-warning",
  muted: "text-muted-foreground",
};

export function TerminalHero({ latencyMs }: { latencyMs?: number | null }) {
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (shown >= SCRIPT.length) {
      const reset = setTimeout(() => setShown(1), 6000);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(() => setShown((n) => n + 1), 620);
    return () => clearTimeout(timer);
  }, [shown]);

  return (
    <div className="glow-primary overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-background/60 px-3 py-2">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-warning/70" />
        <span className="size-2.5 rounded-full bg-success/70" />
        <span className="ltr-mono mx-auto text-[10px] text-faint">
          diarad — ssh diarad.2bd.net
        </span>
      </div>
      <div className="terminal-surface min-h-[290px] space-y-1.5 p-4 text-[11.5px] leading-6 sm:text-xs">
        {SCRIPT.slice(0, shown).map((line, index) => (
          <div key={index} className={TONE[line.tone ?? "muted"]}>
            {line.tone === "prompt" && index === 0 ? "$ " : ""}
            {line.text}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-faint">
        <span>ترمینال نمونه — تجربه واقعی پنل دیاراد</span>
        <span className="ltr-mono">
          {latencyMs != null ? `${latencyMs} ms` : "live"}
        </span>
      </div>
    </div>
  );
}
