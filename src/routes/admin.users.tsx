import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/admin/users")({ component: AdminUsers });
function AdminUsers() { const { data = [] } = useQuery({ queryKey: ["admin-users"], queryFn: async () => { const { data, error } = await supabase.from("profiles").select("id, email, first_name, last_name, city, created_at").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } }); return <section className="surface"><h2 className="text-sm font-semibold">کاربران</h2><div className="mt-4 flex flex-col gap-2">{data.map((user) => <div key={user.id} className="rounded-md border border-border p-3 text-xs"><p>{user.first_name} {user.last_name}</p><p className="mt-1 text-muted-foreground">{user.email} · {user.city ?? "بدون شهر"}</p></div>)}</div></section>; }
