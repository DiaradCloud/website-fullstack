import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/finance")({ component: AdminFinance });

function AdminFinance() {
  const { data } = useQuery({ queryKey: ["admin-finance"], queryFn: async () => {
    const [{ data: orders }, { data: expenses }] = await Promise.all([
      supabase.from("orders").select("amount, status, created_at"),
      supabase.from("expenses").select("amount, spent_at"),
    ]);
    const paid = (orders ?? []).filter((order) => String(order.status).toLowerCase() === "paid");
    const revenue = paid.reduce((sum, order) => sum + Number(order.amount ?? 0), 0);
    const costs = (expenses ?? []).reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
    const month = new Date().toISOString().slice(0, 7);
    const monthly = paid.filter((order) => String(order.created_at).slice(0, 7) === month).reduce((sum, order) => sum + Number(order.amount ?? 0), 0);
    return { revenue, costs, monthly, profit: revenue - costs };
  } });
  const money = (value = 0) => `${value.toLocaleString("fa-IR")} تومان`;
  return <section className="surface"><h2 className="text-sm font-semibold">مدیریت مالی</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["درآمد این ماه", data?.monthly], ["درآمد کل", data?.revenue], ["هزینه‌ها", data?.costs], ["سود خالص", data?.profit]].map(([label, value]) => <div key={label} className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg font-semibold">{money(Number(value ?? 0))}</p></div>)}</div><p className="mt-5 text-xs text-muted-foreground">ثبت هزینه‌ها از جدول expenses انجام می‌شود و سود خالص به‌صورت خودکار محاسبه می‌گردد.</p></section>;
}
