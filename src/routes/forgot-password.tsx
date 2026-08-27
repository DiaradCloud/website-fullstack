import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { createGuestTicket, guestUploadUrl } from "@/lib/guest.functions";
import { supabase } from "@/integrations/supabase/client";
import { FORGOT_PASSWORD_TEMPLATE } from "@/lib/constants";
import { Field } from "@/routes/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "بازیابی رمز عبور — دیاراد کلود" },
      {
        name: "description",
        content: "درخواست بازیابی رمز عبور حساب دیاراد کلود با ارسال مدارک هویتی به پشتیبانی.",
      },
      { property: "og:title", content: "بازیابی رمز عبور — دیاراد کلود" },
      { property: "og:description", content: "ثبت تیکت بازیابی رمز عبور برای تیم پشتیبانی." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState(FORGOT_PASSWORD_TEMPLATE);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      let attachmentPath: string | undefined;
      if (file) {
        const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
        if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
          toast.error("فرمت تصویر باید jpg یا png باشد.");
          return;
        }
        const target = await guestUploadUrl({ data: { ext: ext as "jpg" } });
        if (!target.ok) {
          toast.error(target.error);
          return;
        }
        const { error } = await supabase.storage
          .from("ticket-attachments")
          .uploadToSignedUrl(target.path, target.token, file);
        if (error) {
          toast.error("آپلود تصویر انجام نشد.");
          return;
        }
        attachmentPath = target.path;
      }

      const result = await createGuestTicket({
        data: { email, fullName, body: note, attachmentPath },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCode(result.code);
      toast.success("تیکت شما ثبت شد");
    } catch (error) {
      console.error(error);
      toast.error("ارسال انجام نشد. اطلاعات را بازبینی کنید.");
    } finally {
      setBusy(false);
    }
  }

  if (code) {
    return (
      <PageShell title="درخواست ثبت شد" narrow>
        <div className="surface">
          <p className="text-sm leading-8">
            تیکت شما با کد <span className="ltr-mono text-primary">{code}</span> ثبت شد. پس از بررسی
            مدارک، رمز جدید به ایمیل شما ارسال می‌شود.
          </p>
          <Link to="/auth" className="mt-5 inline-block text-xs text-primary">
            بازگشت به صفحه ورود
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="بازیابی رمز عبور"
      subtitle="به صورت موقت بازیابی رمز از طریق تیکت و احراز هویت دستی انجام می‌شود."
      narrow
    >
      <div className="surface mb-4 text-xs leading-7 text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">مراحل:</p>
        ۱. یک برگه کاغذ بردارید و روی آن بنویسید: «من رمز ورود خود را گم کرده ام لطفا ان را ایمیل
        کنید»، همراه با نام و نام خانوادگی و ایمیل خود.
        <br />
        ۲. کارت بانکی خود را (فقط چهار رقم آخر خوانا، بقیه ارقام و CVV2 را بپوشانید) کنار کاغذ
        بگذارید و یک عکس بگیرید.
        <br />
        ۳. تصویر را در فرم زیر بارگذاری و ارسال کنید.
      </div>

      <form onSubmit={submit} className="surface space-y-3">
        <Field label="نام و نام خانوادگی">
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="field" />
        </Field>
        <Field label="ایمیل حساب">
          <input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
        </Field>
        <Field label="متن درخواست">
          <textarea
            required
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field resize-y"
          />
        </Field>
        <Field label="تصویر مدارک">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
            <Upload className="size-4" />
            {file ? file.name : "انتخاب تصویر (jpg / png)"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "در حال ارسال…" : "ارسال تیکت"}
        </button>
      </form>
    </PageShell>
  );
}
