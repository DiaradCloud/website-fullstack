import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand/logo";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "ورود به پنل — دیاراد کلود" },
      { name: "description", content: "ورود به پنل کاربری دیاراد کلود با ایمیل و رمز عبور." },
      { property: "og:title", content: "ورود به پنل — دیاراد کلود" },
      { property: "og:description", content: "مدیریت ابرک‌ها، تیکت‌ها و سرویس‌های شما." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session?.user) navigate({ to: "/dashboard", replace: true });
  }, [session?.user, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("ایمیل یا رمز عبور اشتباه است.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    toast.success("خوش آمدید");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <BrandMark />
        </Link>
        <div className="surface">
          <h1 className="text-lg font-semibold">ورود به پنل</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            با ایمیل و رمز عبوری که هنگام ثبت‌نام انتخاب کردید وارد شوید.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <Field label="ایمیل">
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="رمز عبور">
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="••••••••"
              />
            </Field>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "در حال ورود…" : "ورود"}
            </button>
          </form>
          <div className="mt-5 flex items-center justify-between text-[11px]">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">
              رمز عبور را فراموش کرده‌ام
            </Link>
            <Link to="/register" className="text-primary">
              ساخت حساب جدید
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-faint">{hint}</span>}
    </label>
  );
}
