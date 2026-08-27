import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/admin/tickets")({ component: AdminTickets });
function AdminTickets() { const { data = [] } = useQuery({ queryKey: ["admin-tickets"], queryFn: async () => { const { data, error } = await supabase.from("tickets").select("id, code, subject, status, priority, created_at").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } }); return <section className="surface"><h2 className="text-sm font-semibold">صف تیکت‌ها</h2><div className="mt-4 flex flex-col gap-2">{data.map((ticket) => <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-xs"><span>{ticket.code} — {ticket.subject}</span><span className="badge">{ticket.status}</span></div>)}</div></section>; }
