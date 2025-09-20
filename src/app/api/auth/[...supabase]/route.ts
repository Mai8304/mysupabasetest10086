import { NextResponse } from "next/server";

import type { Session } from "@supabase/supabase-js";

import { defaultLocale } from "@/i18n/routing";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = `/${defaultLocale}`;

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectParam = requestUrl.searchParams.get("redirect");

  if (code) {
    const supabase = createSupabaseRouteHandlerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectPath =
    redirectParam && redirectParam.startsWith("/")
      ? redirectParam
      : DEFAULT_REDIRECT_PATH;

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}

type AuthChangeEvent = "SIGNED_IN" | "TOKEN_REFRESHED" | "SIGNED_OUT";

type AuthHookPayload = {
  event: AuthChangeEvent;
  session: Session | null;
};

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = createSupabaseRouteHandlerClient();
  const payload = (await request.json()) as AuthHookPayload;

  if (payload.event === "SIGNED_OUT") {
    await supabase.auth.signOut();
    return NextResponse.json({ status: "signed_out" });
  }

  if (payload.session) {
    await supabase.auth.setSession(payload.session);
  }

  return NextResponse.json({ status: "signed_in" });
}
