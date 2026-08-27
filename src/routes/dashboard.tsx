import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Globe, LayoutDashboard, LifeBuoy, Server, ShoppingCart, User } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PanelLayout } from "@/components/site/panel-shell";
import { useSession } from "@/hooks/use-session";
import { syncMyServices } from "@/lib/orders.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "پنل کاربری — دیاراد کلود" },
      {
        name: "description",
        content: "مدیریت ابرک‌ها، ترافیک، تیکت‌ها و سرویس اینترنت بین‌الملل دیاراد کلود.",
      },
      { property: "og:title", content: "پنل کاربری — دیاراد کلود" },
      { property: "og:description", content: "مدیریت سرویس‌های ابری شما." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "نمای کلی", icon: <LayoutDashboard className="size-4" />, exact: true },
  { to: "/dashboard/services", label: "ابرک‌های من", icon: <Server className="size-4" /> },
  { to: "/dashboard/order", label: "خرید ابرک", icon: <ShoppingCart className="size-4" /> },
  { to: "/dashboard/internet", label: "اینترنت بین‌الملل", icon: <Globe className="size-4" /> },
  { to: "/dashboard/tickets", label: "تیکت‌ها", icon: <LifeBuoy className="size-4" /> },
  { to: "/dashboard/profile", label: "پروفایل", icon: <User className="size-4" /> },
];

function DashboardLayout() {
  const { data: session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) void syncMyServices({ data: undefined }).catch(() => undefined);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isLoading && !session?.user) void router.navigate({ to: "/auth", replace: true });
  }, [isLoading, session?.user, router]);

  const profile = session?.profile;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pt-14">
        {isLoading ? (
          <div className="shell py-16 text-sm text-muted-foreground">در حال بارگذاری…</div>
        ) : !session?.user ? (
          <div className="shell py-16">
            <p className="text-sm text-muted-foreground">برای مشاهده پنل وارد شوید.</p>
            <Link
              to="/auth"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
            >
              ورود به حساب
            </Link>
          </div>
        ) : (
          <PanelLayout
            title={`پنل ${profile ? `${profile.first_name} ${profile.last_name}` : "کاربری"}`}
            subtitle={
              profile?.network_name
                ? `شبکه اختصاصی: ${profile.network_name}.diarad.2bd.net`
                : "مدیریت سرویس‌های ابری شما"
            }
            nav={NAV}
          >
            <Outlet />
          </PanelLayout>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
