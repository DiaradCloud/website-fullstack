import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand/logo";
import { BRAND, ENAMAD } from "@/lib/constants";

const COLUMNS = [
  {
    title: "محصولات",
    links: [
      { to: "/pricing", label: "ابرک‌ها" },
      { to: "/internet", label: "اینترنت بین‌الملل" },
      { to: "/docs", label: "مستندات" },
    ],
  },
  {
    title: "شرکت",
    links: [
      { to: "/about", label: "درباره ما" },
      { to: "/blog", label: "بلاگ" },
    ],
  },
  {
    title: "پشتیبانی",
    links: [
      { to: "/status", label: "وضعیت سرویس" },
      { to: "/contact", label: "تماس با ما" },
      { to: "/forgot-password", label: "فراموشی رمز" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border py-10">
      <div className="shell">
        <div className="mb-8 grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link to="/">
              <BrandMark />
            </Link>
            <p className="mt-3 max-w-56 text-xs leading-7 text-faint">
              زیرساخت ابری هوشمند برای توسعه‌دهندگان ایرانی. دامنه سرویس: {BRAND.domain}
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <div className="mb-2.5 text-[11px] font-medium text-faint">{column.title}</div>
              {column.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block py-1 text-xs text-faint transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <span className="text-[11px] text-faint">
            © ۱۴۰۴ {BRAND.name} — دیتاسنترهای دیانا ابر و لیاسنتر
          </span>
          <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
            <img
              src={ENAMAD.image}
              alt="نماد اعتماد الکترونیکی"
              width={34}
              height={34}
              loading="lazy"
              className="size-[34px] rounded-md object-contain opacity-80"
            />
            <span className="text-[10px] leading-4 text-faint">
              نماد اعتماد
              <br />
              {ENAMAD.note}
            </span>
          </div>
          <span className="text-[11px] text-faint">{BRAND.tagline}</span>
        </div>

      </div>
    </footer>
  );
}
