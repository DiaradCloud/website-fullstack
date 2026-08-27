import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const input = z.object({
  filename: z.string().trim().min(1).max(160),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
  body: z.string().min(1),
});

export const uploadReceiptToBlob = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => input.parse(value))
  .handler(async ({ data }) => {
    try {
      const raw = data.body.includes(",") ? data.body.split(",", 2)[1] : data.body;

      const bytes = Buffer.from(raw, "base64");

      if (bytes.byteLength > 6 * 1024 * 1024) {
        return {
          ok: false as const,
          error: "حجم رسید باید کمتر از ۶ مگابایت باشد.",
        };
      }

      const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "-");

      const path = `receipts/${crypto.randomUUID()}-${safeName}`;

      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      const { error } = await supabase.storage.from("receipts").upload(path, bytes, {
        contentType: data.contentType,
        upsert: false,
      });

      if (error) {
        console.error("[supabase] Receipt upload failed:", error);

        return {
          ok: false as const,
          error: `آپلود رسید انجام نشد: ${error.message}`,
        };
      }

      return {
        ok: true as const,
        path,
      };
    } catch (error) {
      console.error("[supabase] Receipt upload failed:", error);

      const message = error instanceof Error ? error.message : String(error);

      return {
        ok: false as const,
        error: `آپلود رسید انجام نشد: ${message}`,
      };
    }
  });
