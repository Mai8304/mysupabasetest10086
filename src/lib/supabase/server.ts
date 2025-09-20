import { cookies } from "next/headers";

import {
  createRouteHandlerClient,
  createServerActionClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./config";

export function createSupabaseServerClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createServerComponentClient(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey },
  );
}

export function createSupabaseServerActionClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createServerActionClient(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey },
  );
}

export function createSupabaseRouteHandlerClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createRouteHandlerClient(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey },
  );
}
