import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function serverClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Supabase server configuration is unavailable");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const authenticateStandaloneAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(256) }).parse(input))
  .handler(async ({ data }) => {
    const { data: result, error } = await serverClient().rpc("authenticate_admin", {
      p_username: data.username,
      p_password: data.password,
    });
    if (error) {
      console.error("[v0] Standalone admin authentication failed:", error.message);
      throw new Error("Admin authentication unavailable");
    }
    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    return { authenticated: Boolean(parsed?.authenticated), username: parsed?.username ?? null };
  });
