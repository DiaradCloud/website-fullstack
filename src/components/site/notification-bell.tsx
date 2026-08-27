import { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { relativeFa } from "@/lib/format";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const unread = items.filter((n) => !n.read_at).length;

  async function markAll() {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="اعلان‌ها"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-primary" />
        )}
      </button>

      {open && (
        <div className="surface absolute left-0 top-11 z-50 w-80 max-w-[85vw] overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium">اعلان‌ها</span>
            <button onClick={markAll} className="text-[11px] text-primary">
              خواندن همه
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">اعلانی وجود ندارد</p>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                className={`border-b border-border px-3 py-2.5 last:border-0 ${
                  n.read_at ? "opacity-60" : ""
                }`}
              >
                <div className="text-xs font-medium">{n.title}</div>
                {n.body && (
                  <p className="mt-1 text-[11px] leading-6 text-muted-foreground">{n.body}</p>
                )}
                <span className="mt-1 block text-[10px] text-faint">
                  {relativeFa(n.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
