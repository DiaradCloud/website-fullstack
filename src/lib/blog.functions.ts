import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export type PublicPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_url: string | null;
  tag: string;
  read_minutes: number;
  created_at: string;
};

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(120) }).parse(input))
  .handler(async ({ data }): Promise<PublicPost | null> => {
    const { data: post } = await publicClient()
      .from("blog_posts")
      .select("slug, title, excerpt, body, cover_url, tag, read_minutes, created_at")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    return post ?? null;
  });
