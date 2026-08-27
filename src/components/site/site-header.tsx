import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { NotificationBell } from "@/components/site/notification-bell";
import { useSession, useSignOut } from "@/hooks/use-session";

const LINKS = [
  { to: "/", label: "خانه" },
  { to: "/pricing", label: "قیمت‌ها" },
  { to: "/blog", label: "بلاگ" },
  { to: "/docs", label: "مستندات" },
  { to: "/status", label: "وضعیت" },
  { to: "/about", label: "درباره ما" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const signOut = useSignOut();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const signedIn = Boolean(session?.user);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-14 border-b transition-colors ${
          scrolled ? "border-border bg-background/95 backdrop-blur" : "border-transparent"
        }`}
      >
        <div className="shell flex h-full items-center justify-between">
          <Link to="/" className="shrink-0">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "text-foreground" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {signedIn ? (
              <>
                <NotificationBell />
                <Link
                  to="/dashboard"
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-border-strong"
                >
                  داشبورد
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    router.navigate({ to: "/", replace: true });
                  }}
                  className="hidden rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:block"
                >
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-border-strong"
                >
                  ورود
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  شروع کنید
                </Link>
              </>
            )}
            <button
              className="p-1 text-foreground md:hidden"
              onClick={() => setOpen(true)}
              aria-label="منو"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-1 bg-background md:hidden">
          <button
            className="absolute left-4 top-4 p-1"
            onClick={() => setOpen(false)}
            aria-label="بستن"
          >
            <X className="size-5" />
          </button>
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-6 py-2.5 text-[15px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={signedIn ? "/dashboard" : "/auth"}
            onClick={() => setOpen(false)}
            className="rounded-md px-6 py-2.5 text-[15px] text-primary"
          >
            {signedIn ? "داشبورد" : "ورود / ثبت‌نام"}
          </Link>
        </div>
      )}
    </>
  );
}
