"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { getSupabaseConfig } from "./config";

/**
 * Returns a Supabase client bound to the current browser session.
 */
export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });
}
