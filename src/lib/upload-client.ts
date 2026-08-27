import { supabase } from "@/integrations/supabase/client";
import { createUploadUrl } from "@/lib/uploads.functions";
import { uploadReceiptToBlob } from "@/lib/blob-upload.functions";
import { clearStaleSession, isStaleSessionError } from "@/lib/auth-recovery";

const ALLOWED = ["jpg", "jpeg", "png", "webp", "gif"] as const;
type Ext = (typeof ALLOWED)[number];

const SESSION_EXPIRED_ERROR = "نشست شما منقضی شده است. صفحه را ببندید و دوباره وارد حساب شوید.";

/** Uploads an image to a private bucket through a server-issued signed URL. */
export async function uploadImage(
  bucket: "ticket-attachments" | "blog",
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (file.size > 6 * 1024 * 1024)
    return { ok: false, error: "حجم فایل باید کمتر از ۶ مگابایت باشد." };
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED.includes(ext as Ext))
    return { ok: false, error: "فقط تصویر jpg/png/webp مجاز است." };

  try {
    // Receipt uploads use the independent Blob endpoint and do not depend on
    // the broken Supabase bearer-token bridge.
    if (bucket === "ticket-attachments") {
      const body = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const result = await uploadReceiptToBlob({
        data: { filename: file.name, contentType: file.type, body },
      });
      if (!result.ok) return result;
      return { ok: true, path: result.path };
    }

    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) {
      return { ok: false, error: "جلسه ورود معتبر نیست. ابتدا خارج شوید و دوباره وارد حساب شوید." };
    }
    const { data: current } = await supabase.auth.getSession();
    if (!current.session) return { ok: false, error: "ابتدا وارد حساب خود شوید." };

    if (bucket === "blog") {
      const signed = await createUploadUrl({ data: { bucket, ext: ext as Ext } });
      if (!signed.ok) return { ok: false, error: signed.error };
      const { error } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(signed.path, signed.token, file);
      if (error) return { ok: false, error: "آپلود فایل انجام نشد. دوباره تلاش کنید." };
      return { ok: true, path: signed.path };
    }

    const signed = await createUploadUrl({ data: { bucket, ext: ext as Ext } });
    if (!signed.ok) return { ok: false, error: signed.error };
    const { error } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(signed.path, signed.token, file);
    if (error) {
      console.error("[v0] Receipt signed upload failed:", error.message, error.name);
      if (isStaleSessionError(error)) {
        await clearStaleSession();
        return { ok: false, error: SESSION_EXPIRED_ERROR };
      }
      return { ok: false, error: `آپلود رسید انجام نشد: ${error.message}` };
    }
    return { ok: true, path: signed.path };
  } catch (error) {
    console.error("[v0] Upload request failed:", error);
    if (isStaleSessionError(error)) {
      await clearStaleSession();
      return { ok: false, error: SESSION_EXPIRED_ERROR };
    }
    const message = error instanceof Error ? error.message : String(error ?? "");
    if (/unauthorized|no authorization header/i.test(message)) {
      return {
        ok: false,
        error: "مجوز بارگذاری صادر نشد. صفحه را یک‌بار تازه‌سازی کنید و دوباره تلاش کنید.",
      };
    }
    return {
      ok: false,
      error: "آپلود فایل انجام نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.",
    };
  }
}
