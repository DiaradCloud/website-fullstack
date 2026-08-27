import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/site/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { faDate, faNumber } from "@/lib/format";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "بلاگ دیاراد کلود — آموزش و اخبار زیرساخت" },
      {
        name: "description",
        content: "مقالات تیم دیاراد کلود درباره سرورهای ابری، امنیت، شبکه و بهینه‌سازی سرویس‌ها.",
      },
      { property: "og:title", content: "بلاگ دیاراد کلود" },
      { property: "og:description", content: "آموزش و اخبار زیرساخت ابری." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, cover_url, created_at, tag, read_minutes")
        .eq("published", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <PageShell title="بلاگ" subtitle="نوشته‌های تیم دیاراد کلود">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
      ) : posts.length === 0 ? (
        <div className="surface text-xs text-muted-foreground">هنوز مطلبی منتشر نشده است.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="surface surface-hover"
            >
              {post.cover_url && (
                <img
                  src={post.cover_url}
                  alt={post.title}
                  loading="lazy"
                  className="mb-3 aspect-video w-full rounded-lg object-cover"
                />
              )}
              <span className="badge">{post.tag}</span>
              <h2 className="mt-3 text-sm font-semibold">{post.title}</h2>
              <p className="mt-2 line-clamp-3 text-xs leading-7 text-muted-foreground">
                {post.excerpt}
              </p>
              <span className="mt-3 block text-[11px] text-faint">
                {faDate(post.created_at)} — {faNumber(post.read_minutes)} دقیقه مطالعه
              </span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
