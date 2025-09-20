import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { locales, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale as Locale;

  if (!locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <SupabaseProvider initialSession={session}>{children}</SupabaseProvider>
    </NextIntlClientProvider>
  );
}
