import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/admin/catalog")({ component: AdminCatalog });
function AdminCatalog() { const { data = [] } = useQuery({ queryKey: ["admin-plans"], queryFn: async () => { const { data, error } = await supabase.from("plans").select("id, name, price, is_locked, is_active").order("sort"); if (error) throw error; return data ?? []; } }); return <section className="surface"><h2 className="text-sm font-semibold">کاتالوگ و قفل فروش</h2><div className="mt-4 flex flex-col gap-2">{data.map((plan) => <div key={plan.id} className="flex items-center justify-between rounded-md border border-border p-3 text-xs"><span>{plan.name} · {plan.price.toLocaleString("fa-IR")} تومان</span><span className="badge">{plan.is_locked ? "قفل شده" : "فعال"}</span></div>)}</div></section>; }
