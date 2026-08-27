import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guestTicketSchema = z.object({
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(2000),
  attachmentPath: z.string().trim().max(300).optional(),
});

/**
 * Public "forgot password" ticket. Guests cannot write to the tickets table
 * directly; this endpoint validates the payload server-side and stores it.
 */
export const createGuestTicket = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => guestTicketSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const { data: ticket, error } = await supabaseAdmin
      .from("tickets")
      .insert({
        user_id: profile?.id ?? null,
        guest_email: email,
        subject: `فراموشی رمز عبور — ${data.fullName}`,
        department: "password",
        priority: "high",
        status: "open",
      })
      .select("id, code")
      .single();

    if (error || !ticket) return { ok: false as const, error: "ارسال تیکت انجام نشد." };

    await supabaseAdmin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: profile?.id ?? null,
      sender_name: data.fullName,
      body: data.body,
      attachment_path: data.attachmentPath ?? null,
      is_staff: false,
    });

    await supabaseAdmin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_name: "سیستم هوشمند دیارا",
      is_staff: true,
      body:
        "درود. من سیستم هوشمند دیارا هستم. درخواست بازیابی رمز شما ثبت شد و پس از بررسی مدارک، رمز جدید به ایمیل شما ارسال می‌شود. باتشکر. تیم پشتیبانی دیارا",
    });

    return { ok: true as const, code: ticket.code };
  });

/** Signed upload target for guest attachments (receipts / bank card photo). */
export const guestUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ ext: z.enum(["jpg", "jpeg", "png", "webp"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `guest/${crypto.randomUUID()}.${data.ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("ticket-attachments")
      .createSignedUploadUrl(path);
    if (error || !signed) return { ok: false as const, error: "آپلود در دسترس نیست." };
    return { ok: true as const, path, token: signed.token };
  });
