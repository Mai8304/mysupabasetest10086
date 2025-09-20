export const locales = ["zh", "en", "ja", "fr", "ko", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";
export const localePrefix = "always";

export const localeLabels: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  fr: "Français",
  ko: "한국어",
  de: "Deutsch",
};
