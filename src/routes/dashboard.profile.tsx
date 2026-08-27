import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage });

function ProfilePage() {
  const { data: session } = useSession();
  const profile = session?.profile;
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!session?.user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ phone: phone.trim() || null, city: city.trim() || null }).eq("id", session.user.id);
    setBusy(false);
    if (error) return toast.error("ذخیره اطلاعات انجام نشد.");
    toast.success("اطلاعات پروفایل به‌روزرسانی شد.");
  }

  return <section className="surface"><div className="flex flex-col gap-1"><h2 className="text-sm font-semibold">پروفایل کاربری</h2><p className="text-xs text-muted-foreground">اطلاعات حساب خود را مدیریت کنید.</p></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="flex flex-col gap-2 text-xs"><span>نام و نام خانوادگی</span><input readOnly value={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`} className="rounded-md border border-border bg-accent/30 px-3 py-2 text-xs text-muted-foreground" /></label><label className="flex flex-col gap-2 text-xs"><span>ایمیل</span><input readOnly value={profile?.email ?? session?.user?.email ?? ""} className="rounded-md border border-border bg-accent/30 px-3 py-2 text-xs text-muted-foreground" /></label><label className="flex flex-col gap-2 text-xs"><span>شماره تماس</span><input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary" /></label><label className="flex flex-col gap-2 text-xs"><span>شهر</span><input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary" /></label></div><button onClick={save} disabled={busy} className="mt-5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">{busy ? "در حال ذخیره…" : "ذخیره تغییرات"}</button></section>;
}
