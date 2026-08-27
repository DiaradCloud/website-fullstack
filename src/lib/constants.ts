export const BRAND = {
  name: "دیاراد کلود",
  latin: "Diarad Cloud",
  domain: "diarad.2bd.net",
  tagline: "«نوری که با خرد پیوند می‌خورد»",
};

export const TICKET_DEPARTMENTS = [
  { value: "password", label: "فراموشی رمز عبور" },
  { value: "technical", label: "تیکت فنی" },
  { value: "payment", label: "پرداختی" },
  { value: "abuse", label: "رسیدگی به مشکلات و قانون‌شکنی" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "low", label: "کم" },
  { value: "normal", label: "معمولی" },
  { value: "high", label: "مهم" },
] as const;

export const TICKET_STATUSES = [
  { value: "open", label: "باز" },
  { value: "answered", label: "پاسخ داده شده" },
  { value: "closed", label: "بسته" },
] as const;

export const SERVICE_STATUSES = [
  { value: "pending", label: "در انتظار تحویل" },
  { value: "active", label: "فعال" },
  { value: "suspended", label: "معلق" },
  { value: "expired", label: "منقضی" },
  { value: "cancelled", label: "لغو شده" },
] as const;

export const OS_OPTIONS = [
  "Ubuntu 22.04",
  "Ubuntu 24.04",
  "Debian 12",
  "Debian 11",
  "Alpine 3.19",
  "CentOS 9",
];

export const DURATIONS = [
  { months: 1, label: "۱ ماه", bonusDays: 0 },
  { months: 2, label: "۲ ماه", bonusDays: 0 },
  { months: 3, label: "۳ ماه", bonusDays: 3 },
  { months: 6, label: "۶ ماه", bonusDays: 7 },
  { months: 12, label: "۱۲ ماه", bonusDays: 15 },
];

/** Every service period is 31 days per month, decided automatically by the system. */
export const DAYS_PER_MONTH = 31;

export const AUTO_PAYMENT_MESSAGE =
  "درود. من سیستم هوشمند دیارا هستم. پرداخت شما در حال بررسی است و طی حداکثر ۲۴ ساعت یا ۴۸ ساعت پرداخت شما تایید و سرویس شما آماده خواهد شد. باتشکر. تیم پشتیبانی دیارا";

export const FORGOT_PASSWORD_TEMPLATE =
  "من رمز ورود خود را گم کرده ام لطفا ان را ایمیل کنید";

export const ADMIN_USERNAME = "mehrad";
export const ADMIN_EMAIL = "mehrad@diarad.local";

export const BANK_CARD = {
  number: "6037697677881945",
  holder: "مهراد طراوتی",
};

export const HOST = {
  ip: "194.60.231.49",
  port: 22,
};


export function labelOf<T extends readonly { value: string; label: string }[]>(
  list: T,
  value: string,
): string {
  return list.find((item) => item.value === value)?.label ?? value;
}

export const ENAMAD = {
  image:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwXYuF74_jaDfWiVXG9jb_0mcjpcSK5JE6p6815sQZOQ&s",
  note: "در حال دریافت (فعلا رسمی نشده)",
};

export const ADMIN_PATH = "/diarad-admin-panel";

export const REQUEST_STATUSES = [
  { value: "pending", label: "در انتظار بررسی" },
  { value: "approved", label: "تایید شده" },
  { value: "rejected", label: "رد شده" },
  { value: "done", label: "انجام شد" },
] as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "در انتظار تایید پرداخت" },
  { value: "approved", label: "تایید شده" },
  { value: "rejected", label: "رد شده" },
] as const;

export const ORDER_KINDS = [
  { value: "new", label: "ابرک جدید" },
  { value: "renew", label: "تمدید" },
  { value: "upgrade", label: "ارتقا" },
  { value: "intl", label: "اینترنت بین‌الملل" },
] as const;

export const INTL_PRICE = 180000;

export const BANDWIDTH_WARN_RATIO = 0.85;
