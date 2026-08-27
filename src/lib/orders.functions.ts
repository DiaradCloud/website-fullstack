import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { AUTO_PAYMENT_MESSAGE, DAYS_PER_MONTH } from "@/lib/constants";

const orderSchema = z.object({
  planId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  kind: z.enum(["new", "renew", "upgrade", "intl"]),
  durationMonths: z.number().int().min(1).max(12),
  os: z.string().trim().min(2).max(40).default("Ubuntu 24.04"),
  addons: z.array(z.string().uuid()).max(10).default([]),
  serviceName: z.string().trim().min(2).max(40),
  receiptPath: z.string().trim().max(300).optional(),
  note: z.string().trim().max(1000).optional(),
});

/**
 * Creates a purchase/renewal order, opens the payment ticket, and posts the
 * automated "سیستم هوشمند دیارا" reply. Amount is computed server-side from the
 * database so the client cannot influence the price.
 */
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, network_name, email")
      .eq("id", userId)
      .maybeSingle();

    let amount = 0;
    let datacenterId: string | null = null;
    let bandwidth = 0;

    if (data.kind === "intl") {
      const { data: settings } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "payment")
        .maybeSingle();
      const value = (settings?.value ?? {}) as Record<string, unknown>;
      amount =
        (typeof value["intl_price"] === "number" ? (value["intl_price"] as number) : 180000) *
        data.durationMonths;
    } else {
      if (!data.planId) return { ok: false as const, error: "پلن انتخاب نشده است." };
      const { data: plan } = await supabaseAdmin
        .from("plans")
        .select("*, datacenters(is_active, coming_soon)")
        .eq("id", data.planId)
        .maybeSingle();
      if (!plan || !plan.is_active || plan.is_locked) {
        return { ok: false as const, error: "این پلن در حال حاضر قابل سفارش نیست." };
      }
      const dc = plan.datacenters as { is_active: boolean; coming_soon: boolean } | null;
      if (dc && (!dc.is_active || dc.coming_soon)) {
        return { ok: false as const, error: "این دیتاسنتر فعلا فعال نیست." };
      }
      amount = plan.price * data.durationMonths;
      datacenterId = plan.datacenter_id;
      bandwidth = plan.bandwidth_gb;

      if (data.addons.length > 0) {
        const { data: addons } = await supabaseAdmin
          .from("addons")
          .select("price, is_active, is_locked")
          .in("id", data.addons);
        for (const addon of addons ?? []) {
          if (addon.is_active && !addon.is_locked) amount += addon.price * data.durationMonths;
        }
      }
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        plan_id: data.planId ?? null,
        service_id: data.serviceId ?? null,
        datacenter_id: datacenterId,
        kind: data.kind,
        duration_months: data.durationMonths,
        os: data.os,
        addons: data.addons,
        amount,
        service_name: data.serviceName,
        status: "pending",
      })
      .select("id, code")
      .single();
    if (orderError || !order) return { ok: false as const, error: "ثبت سفارش انجام نشد." };

    const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "کاربر";
    const kindLabel =
      data.kind === "renew"
        ? "تمدید سرویس"
        : data.kind === "intl"
          ? "اینترنت بین‌الملل"
          : data.kind === "upgrade"
            ? "ارتقای سرویس"
            : "خرید ابرک";

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .insert({
        user_id: userId,
        order_id: order.id,
        service_id: data.serviceId ?? null,
        subject: `${kindLabel} — ${data.serviceName} (${order.code})`,
        department: "payment",
        priority: "high",
        status: "open",
      })
      .select("id, code")
      .single();

    if (ticketError || !ticket) {
      console.error("[v0] Payment ticket creation failed:", ticketError?.message, ticketError?.details);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return { ok: false as const, error: "تیکت پرداخت ساخته نشد؛ سفارش ثبت نشد. دوباره تلاش کنید." };
    }
    const { error: messageError } = await supabaseAdmin.from("ticket_messages").insert([
        {
          ticket_id: ticket.id,
          sender_id: userId,
          sender_name: fullName,
          is_staff: false,
          body:
            `${kindLabel}\nنام سرویس: ${data.serviceName}\nمدت: ${data.durationMonths} ماه (${
              data.durationMonths * DAYS_PER_MONTH
            } روز)\nسیستم عامل: ${data.os}\nمبلغ: ${amount} تومان\nشبکه: ${
              profile?.network_name ?? "-"
            }` + (data.note ? `\nتوضیح: ${data.note}` : ""),
          attachment_path: data.receiptPath ?? null,
        },
        {
          ticket_id: ticket.id,
          sender_name: "سیستم هوشمند دیارا",
          is_staff: true,
          body: AUTO_PAYMENT_MESSAGE,
        },
      ]);
    if (messageError) {
      console.error("[v0] Payment ticket message creation failed:", messageError.message, messageError.details);
      return { ok: false as const, error: "تیکت ساخته شد اما اطلاعات پرداخت ذخیره نشد. با پشتیبانی تماس بگیرید." };
    }
    await supabaseAdmin.from("orders").update({ ticket_id: ticket.id }).eq("id", order.id);

    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: `سفارش ${order.code} ثبت شد`,
      body: AUTO_PAYMENT_MESSAGE,
      level: "info",
      link: "/dashboard/tickets",
    });

    return { ok: true as const, code: order.code, ticketCode: ticket?.code ?? null, amount };
  });

/** Opens a support ticket from the user panel (any department). */
export const openTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().trim().min(3).max(150),
        body: z.string().trim().min(5).max(4000),
        department: z.enum(["password", "technical", "payment", "abuse"]),
        priority: z.enum(["low", "normal", "high"]),
        serviceId: z.string().uuid().optional(),
        attachmentPath: z.string().trim().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: ticket, error } = await supabaseAdmin
      .from("tickets")
      .insert({
        user_id: context.userId,
        service_id: data.serviceId ?? null,
        subject: data.subject,
        department: data.department,
        priority: data.priority,
        status: "open",
      })
      .select("id, code")
      .single();
    if (error || !ticket) return { ok: false as const, error: "ارسال تیکت انجام نشد." };

    const { error: messageError } = await supabaseAdmin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: context.userId,
      sender_name: profile ? `${profile.first_name} ${profile.last_name}` : "کاربر",
      is_staff: false,
      body: data.body,
      attachment_path: data.attachmentPath ?? null,
    });
    if (messageError) {
      console.error("[v0] Standalone ticket message failed:", messageError.message, messageError.details);
      await supabaseAdmin.from("tickets").delete().eq("id", ticket.id);
      return { ok: false as const, error: "پیام تیکت ذخیره نشد؛ تیکت ثبت نشد." };
    }

    return { ok: true as const, code: ticket.code, id: ticket.id };
  });

/** Requests a fresh VPS root/user password for a service the caller owns. */
export const requestVpsPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ serviceId: z.string().uuid(), note: z.string().trim().max(600).default("") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: service } = await supabaseAdmin
      .from("services")
      .select("id, name, user_id")
      .eq("id", data.serviceId)
      .maybeSingle();
    if (!service || service.user_id !== context.userId) {
      return { ok: false as const, error: "سرویس یافت نشد." };
    }

    await supabaseAdmin.from("vps_password_requests").insert({
      user_id: context.userId,
      service_id: service.id,
      note: data.note,
      status: "pending",
    });

    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .insert({
        user_id: context.userId,
        service_id: service.id,
        subject: `درخواست رمز جدید سرویس — ${service.name}`,
        department: "technical",
        priority: "high",
      })
      .select("id")
      .single();

    if (ticket) {
      await supabaseAdmin.from("ticket_messages").insert([
        {
          ticket_id: ticket.id,
          sender_id: context.userId,
          sender_name: "کاربر",
          body: data.note || "رمز سرویس خود را فراموش کرده‌ام، لطفا رمز جدید صادر شود.",
        },
        {
          ticket_id: ticket.id,
          sender_name: "سیستم هوشمند دیارا",
          is_staff: true,
          body:
            "درود. من سیستم هوشمند دیارا هستم. درخواست رمز جدید سرویس شما ثبت شد و پس از بررسی، رمز تازه در همین تیکت ارسال می‌شود. باتشکر. تیم پشتیبانی دیارا",
        },
      ]);
    }

    return { ok: true as const };
  });

/** International-internet activation request (KYC reviewed by support). */
export const requestIntl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        serviceId: z.string().uuid(),
        kycNote: z.string().trim().min(10).max(1500),
        attachmentPath: z.string().trim().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: service } = await supabaseAdmin
      .from("services")
      .select("id, name, user_id, intl_enabled")
      .eq("id", data.serviceId)
      .maybeSingle();
    if (!service || service.user_id !== context.userId) {
      return { ok: false as const, error: "سرویس یافت نشد." };
    }
    if (service.intl_enabled) return { ok: false as const, error: "این سرویس از قبل فعال است." };

    const { data: pending } = await supabaseAdmin
      .from("intl_requests")
      .select("id")
      .eq("service_id", service.id)
      .eq("status", "pending")
      .maybeSingle();
    if (pending) return { ok: false as const, error: "درخواست قبلی شما در حال بررسی است." };

    await supabaseAdmin.from("intl_requests").insert({
      user_id: context.userId,
      service_id: service.id,
      kyc_note: data.kycNote,
      status: "pending",
    });

    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .insert({
        user_id: context.userId,
        service_id: service.id,
        subject: `احراز هویت اینترنت بین‌الملل — ${service.name}`,
        department: "technical",
        priority: "normal",
      })
      .select("id")
      .single();

    if (ticket) {
      await supabaseAdmin.from("ticket_messages").insert([
        {
          ticket_id: ticket.id,
          sender_id: context.userId,
          sender_name: "کاربر",
          body: data.kycNote,
          attachment_path: data.attachmentPath ?? null,
        },
        {
          ticket_id: ticket.id,
          sender_name: "سیستم هوشمند دیارا",
          is_staff: true,
          body:
            "درود. من سیستم هوشمند دیارا هستم. مدارک احراز هویت شما برای تیم پشتیبانی ارسال شد. پس از بررسی، نتیجه فعال‌سازی اینترنت بین‌الملل در همین تیکت اعلام می‌شود و آی‌پی سرویس شما تغییری نخواهد کرد. باتشکر. تیم پشتیبانی دیارا",
        },
      ]);
    }

    return { ok: true as const };
  });

/**
 * Housekeeping for the caller's services: expires overdue ones and raises a
 * bandwidth warning notification once per service.
 */
export const syncMyServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: services } = await supabaseAdmin
      .from("services")
      .select("id, name, status, expires_at, bandwidth_gb, bandwidth_used_gb")
      .eq("user_id", context.userId);

    let expired = 0;
    let warned = 0;
    for (const service of services ?? []) {
      if (
        service.status === "active" &&
        service.expires_at &&
        new Date(service.expires_at).getTime() < Date.now()
      ) {
        await supabaseAdmin.from("services").update({ status: "expired" }).eq("id", service.id);
        await supabaseAdmin.from("notifications").insert({
          user_id: context.userId,
          title: `سرویس ${service.name} منقضی شد`,
          body: "برای ادامه استفاده، سرویس خود را از بخش سرویس‌ها تمدید کنید.",
          level: "warning",
          link: "/dashboard/services",
        });
        expired += 1;
      }

      if (
        service.bandwidth_gb > 0 &&
        service.bandwidth_used_gb / service.bandwidth_gb >= 0.85 &&
        service.status === "active"
      ) {
        const { data: existing } = await supabaseAdmin
          .from("notifications")
          .select("id")
          .eq("user_id", context.userId)
          .eq("title", `هشدار ترافیک ${service.name}`)
          .gte("created_at", new Date(Date.now() - 86_400_000 * 3).toISOString())
          .maybeSingle();
        if (!existing) {
          await supabaseAdmin.from("notifications").insert({
            user_id: context.userId,
            title: `هشدار ترافیک ${service.name}`,
            body: "بیش از ۸۵٪ پهنای باند این ماه مصرف شده است. در صورت اتمام، سرویس محدود می‌شود.",
            level: "warning",
            link: "/dashboard/services",
          });
          warned += 1;
        }
      }
    }
    return { expired, warned };
  });
