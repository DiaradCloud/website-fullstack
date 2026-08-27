import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/sponsors")({ component: AdminSponsors });

type Draft = { name: string; logo_url: string; website_url: string; sort: string };
const emptyDraft: Draft = { name: "", logo_url: "", website_url: "", sort: "0" };

function AdminSponsors() {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-sponsors"], queryFn: async () => {
    const { data, error } = await supabase.from("sponsors").select("id, name, logo_url, website_url, is_active, sort").order("sort");
    if (error) throw error;
    return data ?? [];
  } });

  async function addSponsor() {
    if (!draft.name.trim() || !draft.logo_url.trim()) { toast.error("نام و آدرس لوگو الزامی است."); return; }
    setSaving(true);
    const { error } = await supabase.from("sponsors").insert({ name: draft.name.trim(), logo_url: draft.logo_url.trim(), website_url: draft.website_url.trim() || null, sort: Number(draft.sort) || 0 });
    setSaving(false);
    if (error) { toast.error("ثبت اسپانسر انجام نشد."); return; }
    toast.success("اسپانسر اضافه شد.");
    setDraft(emptyDraft); setOpen(false);
    await client.invalidateQueries({ queryKey: ["admin-sponsors"] });
  }

  return <section className="surface"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">مدیریت اسپانسرها</h2><p className="mt-1 text-xs text-muted-foreground">لوگو و لینک اسپانسرهای فوتر سایت</p></div><button type="button" onClick={() => setOpen((value) => !value)} className="cursor-pointer rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">{open ? "بستن فرم" : "افزودن اسپانسر"}</button></div>
    {open && <div className="mt-5 grid gap-3 rounded-lg border border-border bg-background p-4 md:grid-cols-2"><label className="flex flex-col gap-1 text-xs"><span>نام اسپانسر</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2" /></label><label className="flex flex-col gap-1 text-xs"><span>آدرس لوگو</span><input dir="ltr" value={draft.logo_url} onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2" placeholder="https://..." /></label><label className="flex flex-col gap-1 text-xs"><span>لینک وب‌سایت</span><input dir="ltr" value={draft.website_url} onChange={(e) => setDraft({ ...draft, website_url: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2" placeholder="https://..." /></label><label className="flex flex-col gap-1 text-xs"><span>ترتیب نمایش</span><input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2" /></label><div className="flex gap-2 md:col-span-2"><button type="button" disabled={saving} onClick={() => void addSponsor()} className="cursor-pointer rounded-md bg-primary px-4 py-2 text-xs text-primary-foreground disabled:opacity-50">{saving ? "در حال ذخیره…" : "ذخیره اسپانسر"}</button></div></div>}
    <div className="mt-5 flex flex-col gap-2">{isLoading ? <p className="text-xs text-muted-foreground">در حال بارگذاری…</p> : error ? <p className="text-xs text-destructive">بارگذاری اسپانسرها انجام نشد. فرم افزودن همچنان قابل استفاده است.</p> : data.map((sponsor) => <div key={sponsor.id} className="flex items-center justify-between rounded-lg border border-border p-3"><div className="flex items-center gap-3"><img src={sponsor.logo_url} alt={sponsor.name} className="size-8 rounded object-contain" /><div><p className="text-sm">{sponsor.name}</p><p className="text-[11px] text-muted-foreground">{sponsor.website_url || "بدون لینک"}</p></div></div><span className="text-[11px] text-muted-foreground">{sponsor.is_active ? "فعال" : "غیرفعال"}</span></div>)}</div></section>;
}
