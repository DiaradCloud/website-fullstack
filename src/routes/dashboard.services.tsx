import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { requestVpsPassword } from "@/lib/orders.functions";
import { bandwidthRatio, daysLeft, sshCommand, type ServiceLike } from "@/lib/service-utils";
import { faDate, faNumber } from "@/lib/format";
import { labelOf, SERVICE_STATUSES } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["my-services", session?.user?.id],
    enabled: Boolean(session?.user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as ServiceLike[];
    },
  });

  async function askPassword(serviceId: string) {
    setBusy(serviceId);
    const result = await requestVpsPassword({
      data: { serviceId, note: "رمز سرویس خود را فراموش کرده‌ام، لطفا رمز جدید صادر شود." },
    });
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success("درخواست رمز جدید ثبت شد و در تیکت‌ها پیگیری می‌شود.");
    queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
  }

  if (services.length === 0) {
    return (
      <div className="surface text-xs text-muted-foreground">
        هنوز ابرکی ندارید.{" "}
        <Link to="/dashboard/order" className="text-primary">
          خرید ابرک
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service) => {
        const left = daysLeft(service.expires_at);
        const ratio = bandwidthRatio(service.bandwidth_used_gb, service.bandwidth_gb);
        return (
          <div key={service.id} className="surface">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{service.name}</p>
                <p className="mt-1 text-[10px] text-faint">
                  {service.os} — تحویل: {service.starts_at ? faDate(service.starts_at) : "—"} — انقضا:{" "}
                  {service.expires_at ? faDate(service.expires_at) : "—"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge">{labelOf(SERVICE_STATUSES, service.status)}</span>
                <span className={`badge ${left <= 5 ? "text-warning" : "text-success"}`}>
                  {faNumber(left)} روز باقی‌مانده
                </span>
                {service.intl_enabled && <span className="badge text-primary">اینترنت بین‌الملل فعال</span>}
              </div>
            </div>

            <pre className="terminal-surface mt-3 overflow-x-auto rounded-lg p-3 text-xs">
              {`${sshCommand(service)}   # ${service.ssh_username}`}
            </pre>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-faint">
                <span>
                  ترافیک ماه جاری: {faNumber(service.bandwidth_used_gb)} از{" "}
                  {faNumber(service.bandwidth_gb)} گیگابایت
                </span>
                <span>{faNumber(Math.round(ratio * 100))}٪</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-accent">
                <div
                  className={`h-full ${ratio >= 0.85 ? "bg-warning" : "bg-primary"}`}
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
              {ratio >= 0.85 && (
                <p className="mt-2 text-[10px] text-warning">
                  هشدار: بیش از ۸۵٪ پهنای باند مصرف شده است. در صورت اتمام، سرویس محدود می‌شود.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/dashboard/order"
                search={{ renew: service.id }}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                تمدید سرویس
              </Link>
              <button
                onClick={() => askPassword(service.id)}
                disabled={busy === service.id}
                className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:border-border-strong disabled:opacity-50"
              >
                {busy === service.id ? "در حال ارسال…" : "فراموشی رمز سرویس"}
              </button>
              {!service.intl_enabled && (
                <Link
                  to="/dashboard/internet"
                  className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:border-border-strong"
                >
                  فعال‌سازی اینترنت بین‌الملل
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
