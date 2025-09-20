import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales, type Locale } from "./routing";

type MessageModule = { default: Record<string, unknown> };

type LoadMessages = (locale: Locale) => Promise<MessageModule>;

const loadMessages: LoadMessages = async (locale) => {
  switch (locale) {
    case "zh":
      return import("../messages/zh.json");
    case "en":
      return import("../messages/en.json");
    case "ja":
      return import("../messages/ja.json");
    case "fr":
      return import("../messages/fr.json");
    case "ko":
      return import("../messages/ko.json");
    case "de":
      return import("../messages/de.json");
    default:
      return import("../messages/zh.json");
  }
};

export default getRequestConfig(async ({ locale }) => {
  const normalizedLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  const messages = await loadMessages(normalizedLocale);

  return {
    locale: normalizedLocale,
    messages: messages.default,
  };
});
