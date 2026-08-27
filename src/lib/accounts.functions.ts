import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد"),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{10}$/, "شماره تماس باید ۱۱ رقم و با ۰ شروع شود"),
  birthDate: z.string().trim().min(6).max(20),
  city: z.string().trim().min(2).max(60),
  networkName: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]{1,20}$/, "نام شبکه فقط حروف انگلیسی، عدد و خط تیره"),
});

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: taken } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("network_name", data.networkName)
      .maybeSingle();
    if (taken) return { ok: false as const, error: "این نام شبکه قبلا گرفته شده است." };

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      return {
        ok: false as const,
        error: error?.message?.includes("already")
          ? "این ایمیل قبلا ثبت شده است."
          : "ثبت‌نام انجام نشد. لطفا دوباره تلاش کنید.",
      };
    }

    const userId = created.user.id;
    const username = `${data.networkName}`;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      email: data.email,
      username,
      first_name: data.firstName,
      last_name: data.lastName,
      national_id: data.nationalId,
      phone: data.phone,
      birth_date: data.birthDate,
      city: data.city,
      network_name: data.networkName,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, error: "ثبت اطلاعات انجام نشد. لطفا دوباره تلاش کنید." };
    }

    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "user" });
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "به دیاراد کلود خوش آمدید",
      body: `شبکه شما ${data.networkName}.diarad.2bd.net ثبت شد. برای خرید اولین ابرک به بخش ابرک‌ها بروید.`,
      level: "success",
      link: "/dashboard/order",
    });

    return { ok: true as const, username };
  });

/**
 * Idempotently provisions the default admin account (username: mehrad).
 * Only creates the account when no admin exists yet; the password is stored
 * hashed by the auth service.
 */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("role", "admin")
    .limit(1);
  if (existing && existing.length > 0) return { ok: true as const, created: false };

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: "mehrad@diarad.local",
    password: "dianaandmehrad@123",
    email_confirm: true,
  });
  if (error || !created.user) return { ok: false as const, created: false };

  await supabaseAdmin.from("profiles").insert({
    id: created.user.id,
    email: "mehrad@diarad.local",
    username: "mehrad",
    first_name: "مهراد",
    last_name: "طراوتی",
    city: "تهران",
  });
  await supabaseAdmin.from("user_roles").insert([
    { user_id: created.user.id, role: "admin" },
    { user_id: created.user.id, role: "support" },
  ]);
  return { ok: true as const, created: true };
});

const staffSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/),
  password: z.string().min(8).max(72),
  fullName: z.string().trim().min(2).max(80),
  role: z.enum(["admin", "support"]),
});

export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => staffSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = `${data.username}@diarad.local`;
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      return { ok: false as const, error: "ساخت حساب انجام نشد (نام کاربری تکراری؟)" };
    }
    const [firstName, ...rest] = data.fullName.split(" ");
    await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      email,
      username: data.username,
      first_name: firstName ?? data.fullName,
      last_name: rest.join(" "),
    });
    const roles: { user_id: string; role: "admin" | "support" }[] = [
      { user_id: created.user.id, role: data.role },
    ];
    if (data.role === "admin") roles.push({ user_id: created.user.id, role: "support" });
    await supabaseAdmin.from("user_roles").insert(roles);
    return { ok: true as const, email };
  });

const passwordSchema = z.object({ userId: z.string().uuid(), password: z.string().min(8).max(72) });

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => passwordSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    return error ? { ok: false as const, error: "تغییر رمز انجام نشد" } : { ok: true as const };
  });
