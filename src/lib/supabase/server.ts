import { cookies } from "next/headers";

import {
  createRouteHandlerClient,
  createServerActionClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { getSupabaseConfig } from "./config";

export function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createServerComponentClient(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey },
  );
}

export function createSupabaseServerActionClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createServerActionClient(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey },
  );
}

export function createSupabaseRouteHandlerClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createRouteHandlerClient(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey },
  );
}
