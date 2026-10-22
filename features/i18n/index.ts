import { en, gb, ko, type Locale, type Messages } from "./messages";

export type { Locale } from "./messages";

export const LOCALE_COOKIE = "presignal-locale";
export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English (US)" },
  { value: "ko", label: "한국어" },
  { value: "gb", label: "English (UK)" },
];

const BCP47: Record<Locale, string> = { en: "en-US", ko: "ko-KR", gb: "en-GB" };
const TABLE: Record<Locale, Messages> = {
  en,
  ko,
  gb: { ...en, ...gb },
};

/** 쿠키 등에서 읽은 값을 지원하는 언어로 바꾼다. 모르는 값은 미국 영어. */
export function parseLocale(value: string | undefined | null): Locale {
  return value === "ko" || value === "gb" || value === "en" ? value : "en";
}

export type I18n = ReturnType<typeof createI18n>;

export function createI18n(locale: Locale) {
  const tag = BCP47[locale];
  const table = TABLE[locale];

  const t = (key: string, vars?: Record<string, string | number>) => {
    let text = table[key] ?? en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };

  /** YYYY-MM-DD 또는 ms 시각을 UTC 기준 날짜로 쓴다. */
  const date = (value: string | number, style: "short" | "long" | "full" = "long") => {
    const at = typeof value === "number" ? new Date(value) : new Date(`${value.slice(0, 10)}T12:00:00Z`);
    const options: Intl.DateTimeFormatOptions =
      style === "short"
        ? { month: "short", day: "numeric" }
        : style === "full"
          ? { weekday: "short", day: "numeric", month: "short", year: "numeric" }
          : { day: "numeric", month: "short", year: "numeric" };
    return new Intl.DateTimeFormat(tag, { timeZone: "UTC", ...options }).format(at);
  };

  const money = (amount: number) =>
    new Intl.NumberFormat(tag, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
      amount,
    );

  const number = (n: number) => new Intl.NumberFormat(tag).format(n);

  /** 경과 시간(ms)을 "5분 전"처럼 쓴다. 1분 안은 "방금"이다. */
  const ago = (elapsedMs: number) => {
    const minutes = Math.floor(elapsedMs / 60_000);
    if (minutes < 1) return t("just_now");
    const formatter = new Intl.RelativeTimeFormat(tag, { numeric: "always" });
    if (minutes < 60) return formatter.format(-minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return formatter.format(-hours, "hour");
    return formatter.format(-Math.floor(hours / 24), "day");
  };

  return { locale, tag, t, date, money, number, ago };
}
