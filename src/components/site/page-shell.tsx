import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export function PageShell({
  title,
  subtitle,
  children,
  narrow = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pt-14">
        <div className={`shell py-12 ${narrow ? "max-w-2xl" : ""}`}>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
