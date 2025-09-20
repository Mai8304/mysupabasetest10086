"use client";

import { useEffect, useState } from "react";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SupabaseProviderProps = {
  children: React.ReactNode;
  initialSession: Session | null;
};

export function SupabaseProvider({
  children,
  initialSession,
}: SupabaseProviderProps): JSX.Element {
  const router = useRouter();
  const [supabaseClient] = useState<SupabaseClient>(() =>
    createSupabaseBrowserClient(),
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      const syncSession = async () => {
        try {
          await fetch("/api/auth/callback", {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            credentials: "same-origin",
            body: JSON.stringify({ event, session }),
          });
        } catch (error) {
          console.error("Failed to sync auth state", error);
        }
      };

      void syncSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabaseClient]);

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}
