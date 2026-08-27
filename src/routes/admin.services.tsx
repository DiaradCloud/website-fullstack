import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/admin/services")({ component: AdminServices });
function AdminServices() { const { data = [] } = useQuery({ queryKey: ["admin-services"], queryFn: async () => { const { data, error } = await supabase.from("services").select("id, name, status, ip, expires_at").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } }); return <section className="surface"><h2 className="text-sm font-semibold">سرویس‌ها</h2><div className="mt-4 flex flex-col gap-2">{data.map((service) => <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-xs"><span>{service.name} {service.ip ? `· ${service.ip}` : ""}</span><span className="badge">{service.status}</span></div>)}</div></section>; }
