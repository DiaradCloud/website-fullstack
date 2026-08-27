import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/blog")({ component: AdminBlog });

type Draft = { title: string; slug: string; tag: string; excerpt: string; body: string; published: boolean };
const emptyDraft: Draft = { title: "", slug: "", tag: "عمومی", excerpt: "", body: "", published: false };

function AdminBlog() {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-blog"], queryFn: async () => {
    const { data, error } = await supabase.from("blog_posts").select("id, title, slug, tag, published, updated_at").order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } });

  function update(field: keyof Draft, value: string | boolean) { setDraft((current) => ({ ...current, [field]: value })); }
  function insertImageMarkdown() {
    const url = imageUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) { toast.error("آدرس معتبر تصویر را وارد کنید."); return; }
    const markdown = `![تصویر مقاله](${url})`;
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? draft.body.length;
    const end = textarea?.selectionEnd ?? draft.body.length;
    update("body", `${draft.body.slice(0, start)}${markdown}${draft.body.slice(end)}`);
    setImageUrl("");
    requestAnimationFrame(() => textarea?.focus());
  }
  function markdownPreview(value: string) {
    return value.split("\\n").map((line) => line.replace(/^###\\s+/, "").replace(/^##\\s+/, "").replace(/^#\\s+/, "").replace(/\\*\\*(.*?)\\*\\*/g, "$1").replace(/\\*(.*?)\\*/g, "$1").replace(/`(.*?)`/g, "$1")).join("\\n");
  }
  async function createPost() {
    if (!draft.title.trim() || !draft.slug.trim() || !draft.body.trim()) { toast.error("عنوان، مسیر و متن مقاله الزامی است."); return; }
    setSaving(true);
    const { error } = await supabase.from("blog_posts").insert({ ...draft, read_minutes: Math.max(1, Math.ceil(draft.body.trim().split(/\\s+/).length / 180)) });
    setSaving(false);
    if (error) { toast.error("ثبت مقاله انجام نشد."); return; }
    toast.success("مقاله با موفقیت ثبت شد.");
    setOpen(false); setDraft(emptyDraft);
    await client.invalidateQueries({ queryKey: ["admin-blog"] });
  }

  return <section className="surface">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">ادیتور بلاگ</h2><p className="mt-1 text-xs text-muted-foreground">مدیریت مقاله‌ها، پیش‌نویس‌ها و انتشار</p></div><button type="button" onClick={() => setOpen(true)} className="cursor-pointer rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">مقاله جدید</button></div>
    {open && <div className="mt-5 rounded-lg border border-border bg-background p-4"><div className="grid gap-3 md:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs"><span>عنوان</span><input value={draft.title} onChange={(e) => update("title", e.target.value)} className="rounded-md border border-border bg-background px-3 py-2" /></label>
      <label className="flex flex-col gap-1 text-xs"><span>مسیر انگلیسی</span><input value={draft.slug} onChange={(e) => update("slug", e.target.value)} dir="ltr" className="rounded-md border border-border bg-background px-3 py-2" /></label>
      <label className="flex flex-col gap-1 text-xs"><span>دسته‌بندی</span><input value={draft.tag} onChange={(e) => update("tag", e.target.value)} className="rounded-md border border-border bg-background px-3 py-2" /></label>
      <label className="flex flex-col gap-1 text-xs"><span>خلاصه</span><input value={draft.excerpt} onChange={(e) => update("excerpt", e.target.value)} className="rounded-md border border-border bg-background px-3 py-2" /></label>
    </div><div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs">متن مقاله با پشتیبانی Markdown</span><button type="button" onClick={() => setPreview((value) => !value)} className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs">{preview ? "ویرایش Markdown" : "پیش‌نمایش"}</button></div>{preview ? <div className="mt-2 min-h-48 whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm leading-7">{markdownPreview(draft.body) || "پیش‌نمایش مقاله اینجا نمایش داده می‌شود."}</div> : <textarea ref={bodyRef} value={draft.body} onChange={(e) => update("body", e.target.value)} rows={8} dir="auto" placeholder="# عنوان\n\n**متن برجسته** و `کد`" className="mt-2 min-h-48 w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-sm leading-7" />}<div className="mt-2 flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3 sm:flex-row sm:items-end"><label className="flex min-w-0 flex-1 flex-col gap-1 text-xs"><span>افزودن تصویر با Markdown</span><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} dir="ltr" placeholder="https://example.com/image.webp" className="rounded-md border border-border bg-background px-3 py-2 text-sm" /></label><button type="button" onClick={insertImageMarkdown} className="cursor-pointer rounded-md border border-border px-3 py-2 text-xs">درج تصویر</button></div><label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.published} onChange={(e) => update("published", e.target.checked)} /> انتشار فوری</label><div className="mt-4 flex gap-2"><button type="button" disabled={saving} onClick={() => void createPost()} className="cursor-pointer rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">{saving ? "در حال ذخیره…" : "ذخیره مقاله"}</button><button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-md border border-border px-4 py-2 text-xs">انصراف</button></div></div>}
    <div className="mt-5 overflow-x-auto"><table className="w-full text-right text-xs"><thead className="text-muted-foreground"><tr><th className="pb-3">عنوان</th><th className="pb-3">دسته‌بندی</th><th className="pb-3">وضعیت</th><th className="pb-3">آخرین ویرایش</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={4} className="py-5 text-muted-foreground">در حال بارگذاری…</td></tr> : data.map((post) => <tr key={post.id} className="border-t border-border"><td className="py-3 font-medium">{post.title}</td><td className="py-3 text-muted-foreground">{post.tag || "عمومی"}</td><td className="py-3">{post.published ? "منتشر شده" : "پیش‌نویس"}</td><td className="py-3 text-muted-foreground">{new Date(post.updated_at).toLocaleDateString("fa-IR")}</td></tr>)}</tbody></table></div>
  </section>;
}
