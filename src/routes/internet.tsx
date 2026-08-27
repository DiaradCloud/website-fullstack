import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/page-shell";

export const Route = createFileRoute("/internet")({
  head: () => ({
    meta: [
      { title: "اینترنت بین‌الملل — دیاراد کلود" },
      {
        name: "description",
        content:
          "اینترنت بین‌الملل بخش خصوصی دیاراد کلود، بدون محدودیت محتوایی و تنها با پایش امنیتی پورت‌های پرخطر.",
      },
      { property: "og:title", content: "اینترنت بین‌الملل — دیاراد کلود" },
      { property: "og:description", content: "اتصال بدون محدودیت با نظارت امنیتی." },
    ],
  }),
  component: InternetPage,
});

function InternetPage() {
  return (
    <PageShell
      title="اینترنت بین‌الملل"
      subtitle="سرویس بخش خصوصی، با نظارت امنیتی و بدون محدودیت محتوایی"
      narrow
    >
      <div className="space-y-4">
        <section className="surface text-xs leading-8 text-muted-foreground">
          این سرویس زیر نظر دولت نیست و به عنوان بخش خصوصی ارائه می‌شود؛ اما برای پیشگیری از جرائم،
          پورت‌های پرخطر پایش می‌شوند. هیچ ورودی به سیستم شما انجام نمی‌شود و آی‌پی سرویس شما پس از
          فعال‌سازی تغییر نمی‌کند.
        </section>
        <section className="surface">
          <h2 className="text-sm font-semibold">مراحل فعال‌سازی</h2>
          <ol className="mt-3 space-y-2 text-xs leading-7 text-muted-foreground">
            <li>۱. از پنل کاربری، بخش «اینترنت بین‌الملل» درخواست خود را ثبت کنید.</li>
            <li>۲. اطلاعات احراز هویت بررسی و برای تیم پشتیبانی تیکت می‌شود.</li>
            <li>۳. پس از تایید، سرویس فعال و به شما اطلاع داده می‌شود.</li>
          </ol>
          <Link
            to="/dashboard"
            className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
          >
            ثبت درخواست در پنل
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
