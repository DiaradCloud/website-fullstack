import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/page-shell";
import { BANK_CARD, BRAND } from "@/lib/constants";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تماس با دیاراد کلود — پشتیبانی و تیکت" },
      {
        name: "description",
        content: "راه‌های ارتباط با پشتیبانی دیاراد کلود، بخش‌های تیکت و اطلاعات پرداخت.",
      },
      { property: "og:title", content: "تماس با دیاراد کلود" },
      { property: "og:description", content: "پشتیبانی فارسی، پاسخ‌دهی سریع در تیکت." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageShell title="تماس با ما" subtitle="پشتیبانی از طریق سیستم تیکت انجام می‌شود." narrow>
      <div className="space-y-4">
        <section className="surface text-xs leading-8 text-muted-foreground">
          برای هر درخواست، از پنل کاربری بخش «تیکت‌ها» استفاده کنید. چهار بخش در دسترس است: فراموشی
          رمز عبور، تیکت فنی، پرداختی، و رسیدگی به مشکلات و قانون‌شکنی.
        </section>
        <section className="surface">
          <h2 className="text-sm font-semibold">پرداخت</h2>
          <p className="mt-2 text-xs leading-7 text-muted-foreground">
            واریز به شماره کارت زیر و ارسال تصویر رسید در بخش «پرداختی» با اهمیت «مهم».
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="ltr-mono rounded-md border border-border px-3 py-2 text-sm">
              {BANK_CARD.number}
            </span>
            <span className="text-xs text-muted-foreground">به نام {BANK_CARD.holder}</span>
          </div>
        </section>
        <section className="surface text-xs leading-8 text-muted-foreground">
          دامنه سرویس‌ها: <span className="ltr-mono">{BRAND.domain}</span>
        </section>
      </div>
    </PageShell>
  );
}
