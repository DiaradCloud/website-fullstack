import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/page-shell";
import { BRAND, HOST } from "@/lib/constants";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "مستندات — دیاراد کلود" },
      {
        name: "description",
        content: "راهنمای اتصال SSH، مدیریت ابرک، ترافیک، اینترنت بین‌الملل و بازیابی رمز سرویس.",
      },
      { property: "og:title", content: "مستندات — دیاراد کلود" },
      { property: "og:description", content: "راهنمای گام‌به‌گام استفاده از سرویس‌های دیاراد." },
    ],
  }),
  component: DocsPage,
});

const SECTIONS = [
  {
    title: "اتصال به ابرک",
    body: `دستور اتصال شما با نام کاربری اختصاصی خودتان است، نه root. نمونه:`,
    code: `ssh <username>@${HOST.ip} -p <port>`,
  },
  {
    title: "تغییر رمز سرویس",
    body: "اگر رمز ابرک را فراموش کردید، از پنل کاربری بخش «ابرک‌ها» گزینه «درخواست رمز جدید» را بزنید. تیم فنی رمز تازه را در تیکت برای شما ارسال می‌کند.",
  },
  {
    title: "ترافیک و تمدید",
    body: "هر دوره سرویس ۳۱ روز است و سیستم به صورت خودکار روزهای باقی‌مانده را محاسبه می‌کند. با رسیدن مصرف ترافیک به ۸۰ درصد هشدار دریافت می‌کنید و در صورت اتمام، سرویس تا تمدید محدود می‌شود.",
  },
  {
    title: "اینترنت بین‌الملل",
    body: "این بخش خصوصی است و محدودیت محتوایی ندارد؛ تنها پورت‌های پرخطر برای پیشگیری از سوءاستفاده پایش می‌شوند و ورودی به سیستم شما انجام نمی‌شود. فعال‌سازی پس از احراز هویت و تایید پشتیبانی انجام می‌شود و آی‌پی شما تغییر نمی‌کند.",
  },
  {
    title: "نام شبکه",
    body: `هر حساب یک نام شبکه دارد که زیر دامنه ${BRAND.domain} ساخته می‌شود؛ مثال: net1.${BRAND.domain}`,
  },
];

function DocsPage() {
  return (
    <PageShell title="مستندات" subtitle="هر چیزی که برای شروع لازم دارید" narrow>
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="surface">
            <h2 className="text-sm font-semibold">{section.title}</h2>
            <p className="mt-2 text-xs leading-7 text-muted-foreground">{section.body}</p>
            {section.code && (
              <pre className="terminal-surface mt-3 overflow-x-auto rounded-lg p-3 text-xs">
                {section.code}
              </pre>
            )}
          </section>
        ))}
      </div>
    </PageShell>
  );
}
