import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/page-shell";
import { BRAND } from "@/lib/constants";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "درباره دیاراد کلود — تیم و دیتاسنترها" },
      {
        name: "description",
        content: "دیاراد کلود ارائه‌دهنده زیرساخت ابری با دیتاسنتر دیانا ابر در ایران و لیاسنتر در راه.",
      },
      { property: "og:title", content: "درباره دیاراد کلود" },
      { property: "og:description", content: "تیم دیاراد کلود و مسیر توسعه زیرساخت." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell title="درباره ما" subtitle={BRAND.tagline} narrow>
      <div className="space-y-4">
        <section className="surface text-xs leading-8 text-muted-foreground">
          دیاراد کلود با هدف ساده‌کردن دسترسی به زیرساخت ابری برای توسعه‌دهندگان و کسب‌وکارهای
          ایرانی ساخته شده است. ما روی سه چیز تمرکز داریم: پایداری شبکه، شفافیت قیمت و پشتیبانی
          واقعی انسانی.
        </section>
        <section className="surface">
          <h2 className="text-sm font-semibold">دیتاسنترها</h2>
          <ul className="mt-3 space-y-2 text-xs leading-7 text-muted-foreground">
            <li>
              <span className="text-foreground">دیانا ابر</span> — دیتاسنتر داخلی، فعال، مناسب
              سرویس‌های ایرانی با کمترین تاخیر.
            </li>
            <li>
              <span className="text-foreground">لیاسنتر</span> — دیتاسنتر خارج از کشور، به زودی.
            </li>
          </ul>
        </section>
        <section className="surface">
          <h2 className="text-sm font-semibold">تعهد ما</h2>
          <p className="mt-2 text-xs leading-8 text-muted-foreground">
            اطلاعات هویتی کاربران رمزنگاری‌شده و با دسترسی محدود نگهداری می‌شود، رمزهای عبور فقط به
            صورت هش ذخیره می‌شوند و هیچ‌گاه به صورت متن ساده در دسترس نیست.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
