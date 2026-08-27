import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/site/page-shell";
import { checkHost } from "@/lib/monitor.functions";
import { faDateTime, faNumber } from "@/lib/format";
import { HOST } from "@/lib/constants";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "وضعیت سرویس — دیاراد کلود" },
      {
        name: "description",
        content: "پایش زنده دیتاسنتر دیانا ابر: پینگ واقعی، سیستم عامل و پایداری سرور.",
      },
      { property: "og:title", content: "وضعیت سرویس — دیاراد کلود" },
      { property: "og:description", content: "پایش زنده زیرساخت دیاراد کلود." },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const { data: host, isFetching } = useQuery({
    queryKey: ["host-status"],
    queryFn: () => checkHost({ data: {} }),
    refetchInterval: 20_000,
  });

  return (
    <PageShell title="وضعیت سرویس" subtitle="پایش لحظه‌ای زیرساخت (بدون داده ساختگی)" narrow>
      <div className="surface">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">دیانا ابر</h2>
          <span className={host?.online ? "badge text-success" : "badge text-warning"}>
            {host?.online ? "برخط" : isFetching ? "در حال بررسی" : "بدون پاسخ"}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <Row label="آی‌پی" value={<span className="ltr-mono">diarad.2bd.net</span>} />
          <Row
            label="پینگ (TCP)"
            value={host?.latencyMs != null ? `${faNumber(host.latencyMs)} ms` : "—"}
          />
          <Row label="سیستم عامل" value={host?.os ?? "—"} />
          <Row label="پایداری" value={host?.stable ? "پایدار" : host?.online ? "پرنوسان" : "—"} />
        </dl>
        {host?.sshBanner && (
          <pre className="terminal-surface mt-4 overflow-x-auto rounded-lg p-3 text-[11px]">
            {host.sshBanner}
          </pre>
        )}
        <p className="mt-4 text-[11px] text-faint">
          آخرین بررسی: {faDateTime(host?.checkedAt)}
        </p>
      </div>
      <div className="surface mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">لیاسنتر</h2>
          <span className="badge text-warning">به زودی</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          دیتاسنتر خارج از کشور، در حال آماده‌سازی.
        </p>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <dt className="text-[10px] text-faint">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
