"use client";

import { useState } from "react";

import { Loader2, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";

export function TopNavigation(): JSX.Element {
  const router = useRouter();
  const t = useTranslations("dashboard.auth");
  const { session, isLoading: authLoading } = useSessionContext();
  const supabaseClient = useSupabaseClient();
  const [signingOut, setSigningOut] = useState(false);

  const userName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email ||
    t("userFallback");

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabaseClient.auth.signOut();
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">🔧</span>
            <span className="text-sm font-medium">Tool Checker</span>
          </div>
          <div className="flex items-center gap-3">
            {session && !authLoading && (
              <div className="hidden flex-col text-right text-xs text-muted-foreground sm:flex">
                <span>{t("signedInAs", { email: userName })}</span>
              </div>
            )}
            <LanguageSwitcher />
            {session && !authLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="gap-2"
              >
                {signingOut ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="size-3.5" aria-hidden />
                )}
                <span>{t("signOut")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
