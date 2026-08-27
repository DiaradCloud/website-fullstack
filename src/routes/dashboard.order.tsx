import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { placeOrder } from "@/lib/orders.functions";
import { uploadImage } from "@/lib/upload-client";
import { clearStaleSession, isStaleSessionError } from "@/lib/auth-recovery";
import { faNumber, toman } from "@/lib/format";
import { BANK_CARD, DAYS_PER_MONTH, DURATIONS, OS_OPTIONS } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/order")({
  validateSearch: (search: Record<string, unknown>): { renew?: string } =>
    typeof search["renew"] === "string" ? { renew: search["renew"] as string } : {},

  component: OrderPage,
});

function OrderPage() {
  const { renew } = Route.useSearch();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  async function recoverExpiredSession() {
    await clearStaleSession();
    queryClient.clear();
    toast.error("نشست شما منقضی شده است. دوباره وارد حساب خود شوید.");
    await router.navigate({ to: "/auth", replace: true });
  }

  const [planId, setPlanId] = useState<string>("");
  const [months, setMonths] = useState(1);
  const [os, setOs] = useState(OS_OPTIONS[1]!);
  const [serviceName, setServiceName] = useState("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["order-plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plans")
        .select("*, datacenters(name, is_active, coming_soon)")
        .eq("is_active", true)
        .order("sort");
      return data ?? [];
    },
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["order-addons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("addons")
        .select("*")
        .eq("is_active", true)
        .order("sort");
      return data ?? [];
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["my-services", session?.user?.id],
    enabled: Boolean(session?.user?.id),
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name, plan_id, os");
      return data ?? [];
    },
  });

  const renewService = services.find((s) => s.id === renew) ?? null;
  const selectedPlan = plans.find((p) => p.id === (planId || renewService?.plan_id)) ?? null;

  const total = useMemo(() => {
    const base = selectedPlan ? selectedPlan.price : 0;
    const extra = addons
      .filter((a) => addonIds.includes(a.id) && !a.is_locked)
      .reduce((sum, a) => sum + a.price, 0);
    return (base + extra) * months;
  }, [selectedPlan, addons, addonIds, months]);

  async function onReceipt(file: File | undefined) {
    if (!file) return;
    setUploadError("");
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!file.type.startsWith("image/") || !["jpg", "jpeg", "png", "webp", "gif"].includes(extension ?? "")) {
      setUploadError("فقط تصویر JPG، PNG، WEBP یا GIF قابل قبول است.");
      toast.error("فقط تصویر JPG، PNG، WEBP یا GIF قابل قبول است.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setUploadError("حجم تصویر باید کمتر از ۶ مگابایت باشد.");
      toast.error("حجم تصویر باید کمتر از ۶ مگابایت باشد.");
      return;
    }
    setUploading(true);
    try {
      const result = await Promise.race([
        uploadImage("ticket-attachments", file),
        new Promise<{ ok: false; error: string }>((resolve) => setTimeout(() => resolve({ ok: false, error: "بارگذاری بیش از حد طول کشید. دوباره تلاش کنید." }), 30000)),
      ]);
      if (!result.ok) {
        if (isStaleSessionError(result.error)) {
          setUploading(false);
          void recoverExpiredSession();
          return;
        }
        setUploadError(result.error);
        toast.error(result.error);
        return;
      }
      setReceiptPath(result.path);
      toast.success("رسید بارگذاری شد.");
    } catch (error) {
      console.error("[v0] Receipt upload failed:", error);
      setUploadError("بارگذاری رسید انجام نشد. اتصال اینترنت و دسترسی فایل را بررسی کنید.");
      toast.error("بارگذاری رسید انجام نشد.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const chosenPlan = selectedPlan;
    if (!chosenPlan) {
      toast.error("یک پلن انتخاب کنید.");
      return;
    }
    const name = renewService ? renewService.name : serviceName.trim();
    if (name.length < 2) {
      toast.error("نام سرویس را وارد کنید.");
      return;
    }
    if (!receiptPath) {
      toast.error("عکس رسید پرداخت الزامی است.");
      return;
    }
    setBusy(true);
    let result: Awaited<ReturnType<typeof placeOrder>>;
    try {
      result = await placeOrder({
        data: {
          planId: chosenPlan.id,
          serviceId: renewService?.id,
          kind: renewService ? "renew" : "new",
          durationMonths: months,
          os: renewService?.os ?? os,
          addons: addonIds,
          serviceName: name,
          receiptPath,
          note: note.trim() || undefined,
        },
      });
    } catch (error) {
      setBusy(false);
      console.error("[v0] Order submission request failed:", error);
      if (isStaleSessionError(error)) {
        void recoverExpiredSession();
        return;
      }
      toast.error("ثبت سفارش انجام نشد. دوباره تلاش کنید.");
      return;
    }
    setBusy(false);
    if (!result.ok) {
      if (isStaleSessionError(result.error)) {
        void recoverExpiredSession();
        return;
      }
      toast.error(result.error);
      return;
    }
    toast.success(`سفارش ${result.code} ثبت شد. پیگیری در تیکت ${result.ticketCode ?? "پرداخت"}.`);
    setReceiptPath(null);
    setNote("");
    setServiceName("");
    queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
  }

  return (
    <div className="space-y-4">
      <div className="surface">
        <h2 className="text-sm font-semibold">
          {renewService ? `تمدید سرویس ${renewService.name}` : "خرید ابرک جدید"}
        </h2>
        <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
          هر ماه سرویس {faNumber(DAYS_PER_MONTH)} روز محاسبه می‌شود. پس از پرداخت و ارسال رسید،
          سرویس شما حداکثر طی ۲۴ تا ۴۸ ساعت تحویل داده می‌شود.
        </p>
      </div>

      <div className="surface space-y-4">
        <div>
          <label className="mb-2 block text-[11px] text-faint">انتخاب پلن</label>
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => {
              const dc = plan.datacenters as { is_active: boolean; coming_soon: boolean } | null;
              const locked = plan.is_locked || (dc ? !dc.is_active || dc.coming_soon : false);
              const active = (planId || renewService?.plan_id) === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setPlanId(plan.id)}
                  className={`rounded-lg border p-3 text-right transition-colors disabled:opacity-50 ${
                    active ? "border-primary bg-accent" : "border-border hover:border-border-strong"
                  }`}
                >
                  <span className="block text-xs font-semibold">{plan.name}</span>
                  <span className="mt-1 block text-[10px] text-faint">
                    {plan.cpu} • {plan.ram} • {plan.disk}
                  </span>
                  <span className="mt-2 block text-xs">{toman(plan.price)} / ماه</span>
                  {locked && (
                    <span className="mt-1 block text-[10px] text-warning">
                      {plan.lock_note || "فعلا فروش نمی‌رود"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {!renewService && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="نام سرویس (دلخواه)">
              <input
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="my-cloudlet"
                className="input"
              />
            </Field>
            <Field label="سیستم عامل">
              <select value={os} onChange={(e) => setOs(e.target.value)} className="input">
                {OS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <Field label="مدت سرویس">
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((duration) => (
              <button
                key={duration.months}
                type="button"
                onClick={() => setMonths(duration.months)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  months === duration.months
                    ? "border-primary bg-accent"
                    : "border-border hover:border-border-strong"
                }`}
              >
                {duration.label}
                {duration.bonusDays > 0 && (
                  <span className="text-success"> +{faNumber(duration.bonusDays)} روز</span>
                )}
              </button>
            ))}
          </div>
        </Field>

        {addons.length > 0 && (
          <Field label="افزودنی‌ها">
            <div className="flex flex-wrap gap-2">
              {addons.map((addon) => (
                <button
                  key={addon.id}
                  type="button"
                  disabled={addon.is_locked}
                  onClick={() =>
                    setAddonIds((current) =>
                      current.includes(addon.id)
                        ? current.filter((id) => id !== addon.id)
                        : [...current, addon.id],
                    )
                  }
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                    addonIds.includes(addon.id)
                      ? "border-primary bg-accent"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  {addon.name} — {toman(addon.price)}
                </button>
              ))}
            </div>
          </Field>
        )}
      </div>

      <div className="surface space-y-3">
        <h3 className="text-sm font-semibold">پرداخت</h3>
        <p className="text-[11px] leading-6 text-muted-foreground">
          مبلغ قابل پرداخت را به شماره کارت زیر به نام {BANK_CARD.holder} واریز کنید و سپس عکس رسید
          را بارگذاری کنید. تیکت پرداخت با اهمیت «مهم» به صورت خودکار ساخته می‌شود.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="ltr-mono rounded-md border border-border px-3 py-2 text-sm tracking-widest">
            {BANK_CARD.number}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(BANK_CARD.number);
              toast.success("شماره کارت کپی شد.");
            }}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs"
          >
            <Copy className="size-3.5" /> کپی
          </button>
          <span className="text-xs font-semibold">مبلغ: {toman(total)}</span>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
          <Upload className="size-3.5" />
          {uploading ? "در حال بارگذاری…" : receiptPath ? "رسید بارگذاری شد ✓" : "بارگذاری عکس رسید"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onReceipt(e.target.files?.[0])}
          />
        </label>
        {uploadError && <p className="text-xs text-destructive" role="alert">{uploadError}</p>}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="توضیح اختیاری برای تیم پشتیبانی"
          className="input"
        />

        <button
          onClick={() => void submit()}
          disabled={busy || uploading}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "در حال ثبت…" : "ثبت سفارش و ارسال رسید"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] text-faint">{label}</label>
      {children}
    </div>
  );
}
