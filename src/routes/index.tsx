import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Gauge, Globe, Lock, ShieldCheck, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TerminalHero } from "@/components/site/terminal-hero";
import { supabase } from "@/integrations/supabase/client";
import { checkHost } from "@/lib/monitor.functions";
import { faDate, faNumber, toman } from "@/lib/format";
import { BRAND } from "@/lib/constants";
import { PLANS } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "دیاراد کلود — زیرساخت ابری ساده و سریع" },
      {
        name: "description",
        content:
          "ابرک (VPS) با منابع اختصاصی، تحویل سریع، اینترنت بین‌الملل و پشتیبانی فارسی. دیتاسنتر دیانا ابر در ایران.",
      },
      { property: "og:title", content: "دیاراد کلود — زیرساخت ابری ساده و سریع" },
      {
        property: "og:description",
        content: "ابرک با منابع اختصاصی، تحویل سریع و پنل مدیریت فارسی.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { data: host } = useQuery({
    queryKey: ["host-status"],
    queryFn: () => checkHost({ data: {} }),
    refetchInterval: 30_000,
  });

  const plans = PLANS;

  const { data: datacenters = [] } = useQuery({
    queryKey: ["public-datacenters"],
    queryFn: async () => {
      const { data } = await supabase.from("datacenters").select("*").order("sort");
      return data ?? [];
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["public-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, cover_url, created_at, tag")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pt-14">
        {/* Hero */}
        <section className="shell grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="badge">
              <span className={`size-1.5 rounded-full ${host?.online ? "bg-success" : "bg-warning"}`} />
              دیتاسنتر دیانا ابر — {host?.online ? "برخط" : "در حال بررسی"}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.35] tracking-tight md:text-5xl">
              زیرساخت ابری <span className="text-gradient">ساده و سریع</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-8 text-muted-foreground">
              ابرک‌های دیاراد کلود روی سرورهای پرسرعت با منابع اختصاصی، دیسک NVMe و اینترنت پایدار
              اجرا می‌شوند. تحویل سریع، پنل فارسی و پشتیبانی واقعی.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                ساخت ابرک <ArrowLeft className="size-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-border-strong"
              >
                مشاهده قیمت‌ها
              </Link>
            </div>

            <dl className="mt-9 grid grid-cols-3 gap-3 text-center">
              <Stat label="پینگ سرور" value={host?.latencyMs != null ? `${faNumber(host.latencyMs)} ms` : "…"} />
              <Stat label="سیستم عامل" value={host?.os ?? "Ubuntu"} />
              <Stat label="پایداری" value={host?.stable ? "پایدار" : host?.online ? "پرنوسان" : "…"} />
            </dl>
          </div>

          <div className="order-first md:order-none">
            <TerminalHero latencyMs={host?.latencyMs} />
          </div>
        </section>

        {/* Features */}
        <section className="shell grid gap-4 py-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "تحویل سریع", body: "پس از تایید پرداخت، ابرک شما حداکثر طی ۲۴ تا ۴۸ ساعت آماده می‌شود." },
            { icon: ShieldCheck, title: "امنیت واقعی", body: "رمزها به صورت هش ذخیره می‌شوند و دسترسی‌ها روی سطح دیتابیس محدود شده است." },
            { icon: Globe, title: "اینترنت بین‌الملل", body: "بخش خصوصی، بدون محدودیت محتوایی، تنها با نظارت امنیتی روی پورت‌های خطرناک." },
          ].map((item) => (
            <div key={item.title} className="surface">
              <item.icon className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs leading-7 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>

        {/* Datacenters */}
        <section className="shell py-14">
          <SectionTitle title="دیتاسنترها" subtitle="زیرساخت داخلی فعال و توسعه بین‌المللی در راه" />
          <div className="grid gap-4 md:grid-cols-2">
            {datacenters.map((dc) => (
              <div key={dc.id} className="surface">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{dc.name}</h3>
                  <span className={dc.is_active && !dc.coming_soon ? "badge text-success" : "badge text-warning"}>
                    {dc.is_active && !dc.coming_soon ? "فعال" : "به زودی"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-7 text-muted-foreground">
                  {dc.location} — {dc.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section className="shell py-6">
          <SectionTitle title="ابرک‌ها" subtitle="منابع اختصاصی با قیمت شفاف" />
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const locked = plan.is_locked || plan.datacenters?.is_active === false;
              return (
                <div key={plan.id} className={`surface ${locked ? "opacity-70" : ""}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{plan.name}</h3>
                    {locked && (
                      <span className="badge text-warning">
                        <Lock className="size-3" /> ناموجود
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-2xl font-bold">
                    {toman(plan.price)}
                    <span className="text-xs font-normal text-faint"> / ماهانه</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <li>{plan.cpu} پردازنده</li>
                    <li>{plan.ram} رم</li>
                    <li>{plan.disk} دیسک NVMe</li>
                    <li>{faNumber(plan.bandwidth_gb)} گیگابایت ترافیک</li>
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

        {/* Blog */}
        {posts.length > 0 && (
          <section className="shell py-14">
            <SectionTitle title="آخرین نوشته‌ها" subtitle="اخبار و آموزش‌های تیم دیاراد" />
            <div className="grid gap-4 md:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="surface transition-colors hover:border-border-strong"
                >
                  {post.cover_url && (
                    <img
                      src={post.cover_url}
                      alt={post.title}
                      loading="lazy"
                      className="mb-3 aspect-video w-full rounded-lg object-cover"
                    />
                  )}
                  <h3 className="text-sm font-semibold">{post.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-7 text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <span className="mt-3 block text-[11px] text-faint">
                    {faDate(post.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="shell py-10">
          <div className="surface flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">آماده شروع هستید؟</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                شبکه اختصاصی خود را زیر دامنه {BRAND.domain} بسازید.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Gauge className="size-4" /> ثبت‌نام
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-3">
      <dt className="text-[10px] text-faint">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
