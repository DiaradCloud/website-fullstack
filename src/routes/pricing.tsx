import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { toman } from "@/lib/format";
import { BANK_CARD } from "@/lib/constants";
import { PLANS, ADDONS } from "@/lib/pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "قیمت ابرک‌ها — دیاراد کلود" },
      {
        name: "description",
        content: "لیست پلن‌های ابرک دیاراد کلود، منابع اختصاصی، ترافیک و افزودنی‌ها با قیمت شفاف.",
      },
      { property: "og:title", content: "قیمت ابرک‌ها — دیاراد کلود" },
      { property: "og:description", content: "پلن‌های ابری با منابع اختصاصی و قیمت شفاف." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  // دیتاسنترها (به صورت دستی)
  const datacenters = [
    {
      id: "dc-diana",
      name: "دیانا ابر",
      location: "ایران",
      coming_soon: false,
      is_active: true,
      plans: PLANS,
    },
    {
      id: "dc-lias",
      name: "لیاسنتر",
      location: "خارج از کشور",
      coming_soon: true,
      is_active: false,
      plans: PLANS.map((plan) => ({ ...plan, is_locked: true })),
    },
  ];

  return (
    <PageShell title="قیمت‌ها" subtitle="پلن‌ها بر اساس دیتاسنتر دسته‌بندی شده‌اند.">
      <div className="space-y-10">
        {datacenters.map((dc) => (
          <section key={dc.id}>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-base font-semibold">{dc.name}</h2>
              <span className={dc.coming_soon ? "badge text-warning" : "badge text-success"}>
                {dc.coming_soon ? "به زودی" : "فعال"}
              </span>
              <span className="text-[11px] text-faint">{dc.location}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {dc.plans
                .filter((plan) => plan.is_active)
                .sort((a, b) => a.sort - b.sort)
                .map((plan) => {
                  const locked = plan.is_locked || dc.coming_soon;
                  return (
                    <div key={plan.id} className={`surface ${locked ? "opacity-70" : ""}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">{plan.name}</h3>
                        {locked && (
                          <span className="badge text-warning">
                            <Lock className="size-3" /> قفل
                          </span>
                        )}
                      </div>
                      <div className="mt-3 text-xl font-bold">
                        {toman(plan.price)}
                        <span className="text-xs font-normal text-faint"> / ماهانه</span>
                      </div>
                      <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                        <li>پردازنده: {plan.cpu}</li>
                        <li>رم: {plan.ram}</li>
                        <li>دیسک: {plan.disk}</li>
                        <li>ترافیک: {plan.bandwidth_gb} GB</li>
                      </ul>
                      {locked ? (
                        <p className="mt-5 rounded-md border border-border px-3 py-2 text-center text-[11px] text-warning">
                          {plan.lock_note || "فعلا فروش نمی‌رود"}
                        </p>
                      ) : (
                        <Link
                          to="/register"
                          className="mt-5 block rounded-md bg-primary py-2 text-center text-xs font-medium text-primary-foreground"
                        >
                          سفارش
                        </Link>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}

        {ADDONS.length > 0 && (
          <section>
            <h2 className="mb-4 text-base font-semibold">افزودنی‌ها</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {ADDONS.map((addon) => (
                <div key={addon.id} className="surface">
                  <div className="text-xs font-medium">{addon.name}</div>
                  <div className="mt-2 text-sm font-semibold">{toman(addon.price)}</div>
                  {addon.is_locked && (
                    <span className="mt-2 block text-[10px] text-warning">فعلا فروش نمی‌رود</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="surface">
          <h2 className="text-sm font-semibold">روش پرداخت</h2>
          <p className="mt-2 text-xs leading-7 text-muted-foreground">
            مبلغ سفارش را به شماره کارت زیر واریز کنید و تصویر رسید را از طریق تیکت بخش «پرداختی»
            ارسال کنید. سفارش شما حداکثر طی ۲۴ تا ۴۸ ساعت بررسی و تحویل می‌شود.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="ltr-mono rounded-md border border-border px-3 py-2 text-sm">
              {BANK_CARD.number}
            </span>
            <span className="text-xs text-muted-foreground">به نام {BANK_CARD.holder}</span>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
