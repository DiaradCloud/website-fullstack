import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Globe, ShieldCheck, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { placeOrder, requestIntl } from "@/lib/orders.functions";
import { uploadImage } from "@/lib/upload-client";
import { faDate, toman } from "@/lib/format";
import { INTL_PRICE, labelOf, REQUEST_STATUSES } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/internet")({
  component: InternetPage,
});

function InternetPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const [serviceId, setServiceId] = useState("");
  const [kycNote, setKycNote] = useState("");
  const [path, setPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [months, setMonths] = useState(1);
  const [receipt, setReceipt] = useState<string | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["my-services", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name, intl_enabled, os");
      return data ?? [];
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["my-intl-requests", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("intl_requests")
        .select("id, status, created_at, admin_note, service_id")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function upload(file: File | undefined, target: "kyc" | "receipt") {
    if (!file) return;
    const result = await uploadImage("ticket-attachments", file);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (target === "kyc") setPath(result.path);
    else setReceipt(result.path);
    toast.success("فایل بارگذاری شد.");
  }

  async function submitKyc() {
    if (!serviceId) {
      toast.error("سرویس را انتخاب کنید.");
      return;
    }
    if (kycNote.trim().length < 10) {
      toast.error("توضیح احراز هویت را کامل بنویسید.");
      return;
    }
    setBusy(true);
    const result = await requestIntl({
      data: { serviceId, kycNote: kycNote.trim(), attachmentPath: path ?? undefined },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("درخواست فعال‌سازی ثبت شد و در تیکت‌ها پیگیری می‌شود.");
    setKycNote("");
    setPath(null);
    queryClient.invalidateQueries({ queryKey: ["my-intl-requests", userId] });
    queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
  }

  async function buyIntl() {
    if (!serviceId) {
      toast.error("سرویس را انتخاب کنید.");
      return;
    }
    if (!receipt) {
      toast.error("عکس رسید پرداخت الزامی است.");
      return;
    }
    const service = services.find((s) => s.id === serviceId);
    setBusy(true);
    const result = await placeOrder({
      data: {
        kind: "intl",
        serviceId,
        durationMonths: months,
        os: service?.os ?? "Ubuntu 24.04",
        addons: [],
        serviceName: `اینترنت بین‌الملل — ${service?.name ?? ""}`,
        receiptPath: receipt,
      },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`سفارش ${result.code} ثبت شد.`);
    setReceipt(null);
    queryClient.invalidateQueries({ queryKey: ["my-orders"] });
  }

  return (
    <div className="space-y-4">
      <div className="surface">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Globe className="size-4 text-primary" /> اینترنت بین‌الملل
        </h2>
        <p className="mt-2 text-[11px] leading-7 text-muted-foreground">
          این سرویس به صورت بخش خصوصی ارائه می‌شود، زیر نظر دولت نیست و هیچ محدودیت محتوایی ندارد.
          تنها برای جلوگیری از جرائم، پورت‌های خطرناک پایش می‌شوند و هیچ دسترسی به داخل سیستم شما
          انجام نمی‌شود. پس از احراز هویت، درخواست شما برای تیم پشتیبانی تیکت می‌شود و نتیجه در همان
          تیکت اعلام می‌گردد. آی‌پی سرویس شما تغییر نمی‌کند.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="badge">
            <ShieldCheck className="size-3" /> نظارت امنیتی روی پورت‌های خطرناک
          </span>
          <span className="badge">قیمت پایه: {toman(INTL_PRICE)} / ماه</span>
        </div>
      </div>

      <div className="surface space-y-3">
        <h3 className="text-sm font-semibold">۱) انتخاب سرویس و احراز هویت</h3>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="input">
          <option value="">— انتخاب سرویس —</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} {service.intl_enabled ? "(فعال)" : ""}
            </option>
          ))}
        </select>
        <textarea
          value={kycNote}
          onChange={(e) => setKycNote(e.target.value)}
          rows={4}
          placeholder="نام و نام خانوادگی، کد ملی، هدف استفاده و تعهد عدم استفاده مجرمانه را بنویسید."
          className="input"
        />
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
          <Upload className="size-3.5" /> {path ? "مدرک بارگذاری شد ✓" : "بارگذاری مدرک (اختیاری)"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void upload(e.target.files?.[0], "kyc")}
          />
        </label>
        <button
          onClick={() => void submitKyc()}
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          ارسال درخواست فعال‌سازی
        </button>
      </div>

      <div className="surface space-y-3">
        <h3 className="text-sm font-semibold">۲) خرید یا تمدید اینترنت بین‌الملل</h3>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                months === m ? "border-primary bg-accent" : "border-border"
              }`}
            >
              {m} ماه
            </button>
          ))}
          <span className="text-xs font-semibold">مبلغ: {toman(INTL_PRICE * months)}</span>
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
          <Upload className="size-3.5" /> {receipt ? "رسید بارگذاری شد ✓" : "بارگذاری رسید پرداخت"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void upload(e.target.files?.[0], "receipt")}
          />
        </label>
        <button
          onClick={() => void buyIntl()}
          disabled={busy}
          className="rounded-md border border-border px-4 py-2 text-xs disabled:opacity-50"
        >
          ثبت سفارش اینترنت بین‌الملل
        </button>
      </div>

      <div className="surface">
        <h3 className="mb-3 text-sm font-semibold">درخواست‌های من</h3>
        {requests.length === 0 ? (
          <p className="text-xs text-muted-foreground">درخواستی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs"
              >
                <span>{services.find((s) => s.id === request.service_id)?.name ?? "—"}</span>
                <span className="text-faint">{faDate(request.created_at)}</span>
                <span className="badge">{labelOf(REQUEST_STATUSES, request.status)}</span>
                {request.admin_note && (
                  <span className="w-full text-[10px] text-faint">{request.admin_note}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
