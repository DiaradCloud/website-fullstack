import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/site/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { faDate, faNumber } from "@/lib/format";
import { getPost } from "@/lib/blog.functions";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "مطلب یافت نشد — دیاراد کلود" }, { name: "robots", content: "noindex" }],
      };
    }
    const { post } = loaderData;
    return {
      meta: [
        { title: `${post.title} — بلاگ دیاراد کلود` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        ...(post.cover_url?.startsWith("https://")
          ? [
              { property: "og:image", content: post.cover_url },
              { name: "twitter:image", content: post.cover_url },
            ]
          : []),
      ],
    };
  },
  component: BlogPost,
  notFoundComponent: () => (
    <PageShell title="مطلب یافت نشد" narrow>
      <Link to="/blog" className="text-xs text-primary">
        بازگشت به بلاگ
      </Link>
    </PageShell>
  ),
  errorComponent: () => (
    <PageShell title="خطا در بارگذاری مطلب" narrow>
      <Link to="/blog" className="text-xs text-primary">
        بازگشت به بلاگ
      </Link>
    </PageShell>
  ),
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { post: initial } = Route.useLoaderData();
  const { data: post = initial } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      return data ?? initial;
    },
    initialData: initial,
  });

  return (
    <PageShell title={post.title} narrow>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] text-faint">
        <span className="badge">{post.tag}</span>
        <span>{faDate(post.created_at)}</span>
        <span>{faNumber(post.read_minutes)} دقیقه مطالعه</span>
      </div>
      {post.cover_url && (
        <img
          src={post.cover_url}
          alt={post.title}
          className="mb-6 aspect-video w-full rounded-xl object-cover"
        />
      )}
      <article className="space-y-4 text-sm leading-8 text-muted-foreground">
        {post.body.split(/\n{2,}/).map((paragraph, index) =>
          paragraph.startsWith("## ") ? (
            <h2 key={index} className="pt-2 text-base font-semibold text-foreground">
              {paragraph.slice(3)}
            </h2>
          ) : (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ),
        )}
      </article>
      <Link to="/blog" className="mt-8 inline-block text-xs text-primary">
        ← همه نوشته‌ها
      </Link>
    </PageShell>
  );
}
