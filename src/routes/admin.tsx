import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BookOpenText, Coins, Handshake, LayoutDashboard, LifeBuoy, LockKeyhole, Package, Server, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PanelLayout } from "@/components/site/panel-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "مدیریت — دیاراد کلود" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "داشبورد", icon: <LayoutDashboard className="size-4" />, exact: true },
  { to: "/admin/tickets", label: "تیکت‌ها", icon: <LifeBuoy className="size-4" /> },
  { to: "/admin/users", label: "کاربران", icon: <Users className="size-4" /> },
  { to: "/admin/services", label: "سرویس‌ها", icon: <Server className="size-4" /> },
  { to: "/admin/catalog", label: "کاتالوگ و قفل‌ها", icon: <Package className="size-4" /> },
  { to: "/admin/security", label: "امنیت حساب‌ها", icon: <LockKeyhole className="size-4" /> },
  { to: "/admin/blog", label: "ادیتور بلاگ", icon: <BookOpenText className="size-4" /> },
  { to: "/admin/finance", label: "مدیریت مالی", icon: <Coins className="size-4" /> },
  { to: "/admin/sponsors", label: "اسپانسرها", icon: <Handshake className="size-4" /> },
];

function AdminLayout() {
  return <div className="min-h-screen"><SiteHeader /><main className="pt-14"><PanelLayout title="کنسول مدیریت" subtitle="مدیریت کاربران، پشتیبانی، سرویس‌ها و قفل‌های فروش" nav={NAV}><Outlet /></PanelLayout></main><SiteFooter /></div>;
}
