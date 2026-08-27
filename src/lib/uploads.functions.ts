import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const uploadSchema = z.object({
  bucket: z.enum(["ticket-attachments", "blog"]),
  ext: z.enum(["jpg", "jpeg", "png", "webp", "gif"]),
});

/** Signed upload target for an authenticated user (receipts, KYC docs, blog covers). */
export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => uploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.bucket === "blog") {
      const { data: staff } = await context.supabase.rpc("is_staff", {
        _user_id: context.userId,
      });
      if (!staff) throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Self-heal deployments where the Storage bucket was not provisioned.
    // This is idempotent and runs only when an upload authorization is requested.
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    if (!bucketsError && !buckets?.some((bucket) => bucket.name === data.bucket)) {
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(data.bucket, { public: false, fileSizeLimit: "6MB" });
      if (createBucketError && !/already exists/i.test(createBucketError.message)) {
        console.error("[v0] Storage bucket provisioning failed:", createBucketError.message);
        return { ok: false as const, error: "فضای بارگذاری هنوز آماده نیست. دوباره تلاش کنید." };
      }
    }
    const path = `${context.userId}/${crypto.randomUUID()}.${data.ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUploadUrl(path);
    if (error || !signed) return { ok: false as const, error: "آپلود در دسترس نیست." };
    return { ok: true as const, path, token: signed.token };
  });

/** Time-limited read URL. Owners may read their own files; staff may read any. */
export const signedFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ bucket: z.enum(["ticket-attachments", "blog"]), path: z.string().min(3).max(300) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    const owned = data.path.startsWith(`${context.userId}/`);
    if (!staff && !owned) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUrl(data.path, 60 * 15);
    return { url: signed?.signedUrl ?? null };
  });

/** Public read URL for published blog covers (used by SSR/public pages). */
export const publicBlogUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ path: z.string().min(3).max(300) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("blog")
      .createSignedUrl(data.path, 60 * 60 * 24 * 7);
    return { url: signed?.signedUrl ?? null };
  });
