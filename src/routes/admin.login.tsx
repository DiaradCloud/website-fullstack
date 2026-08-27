import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand/logo";
import { hasStandaloneAdminSession, setStandaloneAdminSession } from "@/lib/admin-session";
import { authenticateStandaloneAdmin } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "ورود مدیریت — دیاراد کلود" }, { name: "robots", content: "noindex" }] }),
  component: AdminLoginPage,
});

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasStandaloneAdminSession()) void navigate({ to: "/admin", replace: true });
  }, [navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const normalizedUsername = username.trim().toLowerCase();
    let result: { authenticated?: boolean } | null = null;
    try {
      result = await authenticateStandaloneAdmin({ data: { username: normalizedUsername, password } });
    } catch (error) {
      console.error("[v0] Admin server authentication failed:", error);
      setBusy(false);
      toast.error("ورود مدیریت موقتاً در دسترس نیست. دوباره تلاش کنید.");
      return;
    }
    setBusy(false);
    if (!result?.authenticated) {
      toast.error("نام کاربری یا رمز عبور اشتباه است.");
      return;
    }
    setStandaloneAdminSession(normalizedUsername);
    toast.success("ورود مدیریت انجام شد.");
    void navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center"><BrandMark /></Link>
        <div className="surface border-primary/30">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary">Private console</p>
          <h1 className="mt-2 text-lg font-semibold">ورود به مدیریت</h1>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">این بخش جدا از پنل کاربران است و فقط برای حساب مدیریت فعال‌شده قابل دسترسی است.</p>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
            <label className="block"><span className="mb-1.5 block text-[11px] text-muted-foreground">نام کاربری</span><input required dir="ltr" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="field" placeholder="mehrad" /></label>
            <label className="block"><span className="mb-1.5 block text-[11px] text-muted-foreground">رمز عبور</span><input required type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="field" /></label>
            <button type="submit" disabled={busy} className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">{busy ? "در حال ورود…" : "ورود امن"}</button>
          </form>
          <Link to="/auth" className="mt-5 block text-center text-[11px] text-muted-foreground hover:text-foreground">ورود به پنل کاربران</Link>
        </div>
      </div>
    </div>
  );
}
