import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/site/panel-shell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { checkHost } from "@/lib/monitor.functions";
import { faNumber, faDate, toman } from "@/lib/format";
import { bandwidthRatio, daysLeft, sshCommand, type ServiceLike } from "@/lib/service-utils";
import { labelOf, SERVICE_STATUSES, TICKET_STATUSES } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: host } = useQuery({
    queryKey: ["host-status"],
    queryFn: () => checkHost({ data: {} }),
    refetchInterval: 30_000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["my-services", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as ServiceLike[];
    },
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["my-tickets", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("id, code, subject, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, code, amount, status, created_at, service_name")
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("id, title, body, level, link, read_at, created_at").or(`user_id.eq.${userId},user_id.is.null`).order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const active = services.filter((s) => s.status === "active");

  return (
    <div className="space-y-8">
      {notifications.length > 0 && <section><h2 className="mb-3 text-sm font-semibold">اعلان‌ها</h2><div className="flex flex-col gap-2">{notifications.map((notification) => <div key={notification.id} className={`surface ${notification.read_at ? "opacity-70" : "border-primary/40"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold">{notification.title}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{notification.body}</p></div><span className="badge">{notification.level}</span></div></div>)}</div></section>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="وضعیت دیانا ابر"
          value={host?.online ? "برخط" : "بدون پاسخ"}
          hint={host?.latencyMs != null ? `${faNumber(host.latencyMs)} میلی‌ثانیه` : undefined}
          tone={host?.online ? "success" : "warning"}
        />
        <StatCard label="سیستم عامل هاست" value={host?.os ?? "Ubuntu"} hint={host?.stable ? "پایدار" : "در حال بررسی"} />
        <StatCard label="ابرک‌های فعال" value={faNumber(active.length)} hint={`از ${faNumber(services.length)} سرویس`} />
        <StatCard
          label="شبکه اختصاصی"
          value={<span className="ltr-mono">{session?.profile?.network_name ?? "—"}</span>}
          hint="زیر دامنه diarad.2bd.net"
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">ابرک‌های من</h2>
        {services.length === 0 ? (
          <div className="surface text-xs text-muted-foreground">
            هنوز سرویسی ندارید.{" "}
            <Link to="/dashboard/order" className="text-primary">
              خرید ابرک
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {services.slice(0, 3).map((service) => {
              const left = daysLeft(service.expires_at);
              const ratio = bandwidthRatio(service.bandwidth_used_gb, service.bandwidth_gb);
              return (
                <div key={service.id} className="surface">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{service.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="badge">{labelOf(SERVICE_STATUSES, service.status)}</span>
                      <span className={`badge ${left <= 5 ? "text-warning" : ""}`}>
                        {faNumber(left)} روز باقی‌مانده
                      </span>
                    </div>
                  </div>
                  <pre className="terminal-surface mt-3 overflow-x-auto rounded-lg p-3 text-xs">
                    {`${sshCommand(service)}   # ${service.ssh_username}`}
                  </pre>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] text-faint">
                      <span>
                        ترافیک: {faNumber(service.bandwidth_used_gb)} از {faNumber(service.bandwidth_gb)} گیگابایت
                      </span>
                      <span>{faNumber(Math.round(ratio * 100))}٪</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-accent">
                      <div
                        className={`h-full ${ratio >= 0.85 ? "bg-warning" : "bg-primary"}`}
                        style={{ width: `${Math.round(ratio * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <Link to="/dashboard/services" className="inline-block text-xs text-primary">
              مشاهده همه سرویس‌ها
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold">آخرین تیکت‌ها</h2>
          <div className="space-y-2">
            {tickets.length === 0 && (
              <div className="surface text-xs text-muted-foreground">تیکتی ثبت نشده است.</div>
            )}
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to="/dashboard/tickets/$id"
                params={{ id: ticket.id }}
                className="surface block transition-colors hover:border-border-strong"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{ticket.subject}</span>
                  <span className="badge">{labelOf(TICKET_STATUSES, ticket.status)}</span>
                </div>
                <p className="ltr-mono mt-1 text-[10px] text-faint">{ticket.code}</p>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">آخرین سفارش‌ها</h2>
          <div className="space-y-2">
            {orders.length === 0 && (
              <div className="surface text-xs text-muted-foreground">سفارشی ثبت نشده است.</div>
            )}
            {orders.map((order) => (
              <div key={order.id} className="surface">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{order.service_name}</span>
                  <span className="text-xs">{toman(order.amount)}</span>
                </div>
                <p className="mt-1 text-[10px] text-faint">
                  {faDate(order.created_at)} — <span className="ltr-mono">{order.code}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
