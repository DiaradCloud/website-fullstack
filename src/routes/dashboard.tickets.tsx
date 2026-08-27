import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { replyTicket } from "@/lib/tickets.functions";
import { clearStaleSession, isStaleSessionError } from "@/lib/auth-recovery";

export const Route = createFileRoute("/dashboard/tickets")({ component: TicketsPage });

function TicketsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function recoverExpiredSession() {
    await clearStaleSession();
    queryClient.clear();
    toast.error("نشست شما منقضی شده است. دوباره وارد حساب خود شوید.");
    await router.navigate({ to: "/auth", replace: true });
  }
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["my-tickets", session?.user?.id],
    enabled: Boolean(session?.user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function createTicket() {
    if (!session?.user || subject.trim().length < 3 || body.trim().length < 2) return;
    setBusy(true);
    const { data: ticket, error } = await supabase.from("tickets").insert({ user_id: session.user.id, subject: subject.trim(), department: "technical", priority: "normal" }).select("id").single();
    if (error || !ticket) {
      console.error("[v0] Ticket creation failed:", error?.message, error?.code, error?.details);
      if (isStaleSessionError(error)) {
        setBusy(false);
        return void recoverExpiredSession();
      }
      setBusy(false);
      return toast.error("ثبت تیکت انجام نشد. لطفاً دوباره تلاش کنید.");
    }
    let reply: { ok: true } | { ok: false; error: string } | undefined;
    try {
      reply = await replyTicket({ data: { ticketId: ticket.id, body: body.trim() } });
    } catch (replyError) {
      console.error("[v0] Ticket first message request failed:", replyError);
      if (isStaleSessionError(replyError)) {
        setBusy(false);
        return void recoverExpiredSession();
      }
      setBusy(false);
      return toast.error("تیکت ساخته شد اما متن پیام ذخیره نشد. لطفاً از بخش تیکت‌ها دوباره ارسال کنید.");
    }
    setBusy(false);
    if (!reply?.ok) {
      console.error("[v0] Ticket first message failed:", reply);
      return toast.error("تیکت ساخته شد اما متن پیام ذخیره نشد. لطفاً از بخش تیکت‌ها دوباره ارسال کنید.");
    }
    setSubject(""); setBody("");
    toast.success("تیکت شما ثبت شد.");
    await queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="surface">
        <div className="flex flex-col gap-1"><h2 className="text-sm font-semibold">ارسال تیکت جدید</h2><p className="text-xs text-muted-foreground">پشتیبانی دیاراد کلود در کنار شماست.</p></div>
        <div className="mt-4 flex flex-col gap-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="موضوع تیکت" className="rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="شرح درخواست خود را بنویسید" rows={4} className="resize-y rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary" />
          <button disabled={busy} onClick={createTicket} className="self-start rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">{busy ? "در حال ثبت…" : "ثبت تیکت"}</button>
        </div>
      </section>
      <section className="surface"><h2 className="text-sm font-semibold">تیکت‌های من</h2>{isLoading ? <p className="mt-4 text-xs text-muted-foreground">در حال بارگذاری…</p> : tickets.length === 0 ? <p className="mt-4 text-xs text-muted-foreground">هنوز تیکتی ثبت نکرده‌اید.</p> : <div className="mt-4 flex flex-col gap-2">{tickets.map((ticket) => <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"><div><p className="text-xs font-medium">{ticket.subject}</p><p className="mt-1 text-[10px] text-muted-foreground">{ticket.code}</p></div><span className="badge">{ticket.status === "open" ? "باز" : ticket.status === "answered" ? "پاسخ داده شد" : "بسته"}</span></div>)}</div>}</section>
    </div>
  );
}
