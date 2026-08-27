import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export type PanelNavItem = { to: string; label: string; icon: ReactNode; exact?: boolean };

export function PanelLayout({
  title,
  subtitle,
  nav,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: PanelNavItem[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shell py-8">
      <div className="grid gap-6 md:grid-cols-[210px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <nav className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                activeProps={{ className: "bg-accent text-foreground" }}
                className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string | undefined;
  tone?: "success" | "warning" | "default" | undefined;
}) {
  const color =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="surface">
      <p className="text-[10px] text-faint">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-[10px] text-faint">{hint}</p>}
    </div>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="surface text-xs text-muted-foreground">
      {text} {action}
    </div>
  );
}
