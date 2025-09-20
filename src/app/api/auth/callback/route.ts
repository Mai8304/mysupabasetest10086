import { NextResponse } from "next/server";

import type { Session } from "@supabase/supabase-js";

import { defaultLocale } from "@/i18n/routing";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

type AuthHookEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_DELETED";

type AuthHookPayload = {
  event: AuthHookEvent;
  session: Session | null;
};

const DEFAULT_REDIRECT = `/${defaultLocale}`;

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectParam = requestUrl.searchParams.get("redirect");
  const redirect =
    redirectParam && redirectParam.startsWith("/")
      ? redirectParam
      : DEFAULT_REDIRECT;

  if (code) {
    const supabase = createSupabaseRouteHandlerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirect, requestUrl.origin));
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = createSupabaseRouteHandlerClient();
  const payload = (await request.json()) as AuthHookPayload;

  switch (payload.event) {
    case "SIGNED_IN":
    case "TOKEN_REFRESHED":
      if (payload.session) {
        await supabase.auth.setSession(payload.session);
      }
      break;
    case "SIGNED_OUT":
    case "USER_DELETED":
      await supabase.auth.signOut();
      break;
    default:
      break;
  }

  return NextResponse.json({ status: "synced" });
}
