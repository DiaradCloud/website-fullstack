import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Appends a message to a ticket. Owners and staff only; staff replies mark it answered. */
export const replyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        ticketId: z.string().uuid(),
        body: z.string().trim().min(2).max(4000),
        attachmentPath: z.string().trim().max(300).optional(),
        close: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });

    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .select("id, user_id, code, subject")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (!ticket) return { ok: false as const, error: "تیکت یافت نشد." };
    if (!staff && ticket.user_id !== context.userId) throw new Error("Forbidden");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", context.userId)
      .maybeSingle();

    await supabaseAdmin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: context.userId,
      sender_name: staff
        ? "تیم پشتیبانی دیارا"
        : profile
          ? `${profile.first_name} ${profile.last_name}`
          : "کاربر",
      is_staff: Boolean(staff),
      body: data.body,
      attachment_path: data.attachmentPath ?? null,
    });

    await supabaseAdmin
      .from("tickets")
      .update({ status: data.close ? "closed" : staff ? "answered" : "open" })
      .eq("id", ticket.id);

    if (staff && ticket.user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: ticket.user_id,
        title: `پاسخ جدید در تیکت ${ticket.code}`,
        body: ticket.subject,
        level: "info",
        link: `/dashboard/tickets/${ticket.id}`,
      });
    }

    return { ok: true as const };
  });
