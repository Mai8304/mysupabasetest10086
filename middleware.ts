import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import createMiddleware from "next-intl/middleware";

import { defaultLocale, localePrefix, locales } from "./src/i18n/routing";
import { getSupabaseConfig } from "./src/lib/supabase/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  localeDetection: true,
});

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const response = intlMiddleware(request);

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const supabase = createMiddlewareClient(
    { req: request, res: response },
    { supabaseUrl, supabaseKey: supabaseAnonKey },
  );
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\.\w+).*)"],
};
