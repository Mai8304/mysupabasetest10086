"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LogIn, RefreshCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";

import { TopNavigation } from "@/components/top-navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fetchDiagnostics = async (): Promise<ApiResponse> => {
  const response = await fetch("/api/check", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch diagnostics");
  }

  const data = (await response.json()) as ApiResponse;
  return data;
};

type ToolResult = {
  id: string;
  label: string;
  installed: boolean;
  version: string | null;
  output: string | null;
  error: string | null;
};

type ApiResponse = {
  results: ToolResult[];
  system: SystemInfo;
};

const EXPECTED_TOOLS = 7;

type SystemInfo = {
  hostname: string;
  platform: string;
  release: string;
  arch: string;
  cpuModel: string | null;
  cpuCores: number;
  cpuSpeedGHz: number | null;
  totalMemBytes: number;
  freeMemBytes: number;
  uptimeSeconds: number;
  loadAverage: number[];
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { session, isLoading: authLoading } = useSessionContext();
  const supabaseClient = useSupabaseClient();
  const authRedirectTo = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const redirectPath = `/${locale}`;
    return `${window.location.origin}/api/auth/callback?redirect=${redirectPath}`;
  }, [locale]);

  const [results, setResults] = useState<ToolResult[] | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDiagnostics();
      setResults(data.results);
      setSystemInfo(data.system);
    } catch (err) {
      console.error(err);
      setError(t("notices.fetchError"));
      setResults(null);
      setSystemInfo(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      setError(null);
      setResults(null);
      setSystemInfo(null);
      return;
    }

    void load();
  }, [load, session]);

  const installedCount = useMemo(
    () => results?.filter((tool) => tool.installed).length ?? 0,
    [results],
  );

  const totalCount = results?.length ?? EXPECTED_TOOLS;
  const allReady = !loading && results?.every((tool) => tool.installed);

  const statusBadgeLabel = loading
    ? t("status.checking")
    : t("status.summary", { count: installedCount, total: totalCount });

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );
  const integerFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const fallbackValue = t("system.values.notAvailable");

  const formatBytes = useCallback(
    (bytes: number | undefined | null) => {
      if (!bytes) {
        return fallbackValue;
      }
      const gigabytes = bytes / 1024 / 1024 / 1024;
      return `${numberFormatter.format(gigabytes)} GB`;
    },
    [fallbackValue, numberFormatter],
  );

  const formatCpuSpeed = useCallback(
    (ghz: number | null) => {
      if (ghz == null) {
        return fallbackValue;
      }
      return `${numberFormatter.format(ghz)} GHz`;
    },
    [fallbackValue, numberFormatter],
  );

  const formatLoadAverage = useCallback(
    (values: number[] | undefined | null) => {
      if (!values || values.length === 0) {
        return fallbackValue;
      }

      return values
        .map((value) => numberFormatter.format(value))
        .join(" / ");
    },
    [fallbackValue, numberFormatter],
  );

  const formatUptime = useCallback(
    (seconds: number | undefined | null) => {
      if (seconds == null) {
        return fallbackValue;
      }

      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      const parts: string[] = [];

      if (days > 0) {
        parts.push(`${integerFormatter.format(days)}${t("system.units.day")}`);
      }

      if (hours > 0) {
        parts.push(`${integerFormatter.format(hours)}${t("system.units.hour")}`);
      }

      if (minutes > 0 || parts.length === 0) {
        parts.push(`${integerFormatter.format(minutes)}${t("system.units.minute")}`);
      }

      return parts.join(" ");
    },
    [fallbackValue, integerFormatter, t],
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/40">
        <TopNavigation />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 pt-24 pb-10 sm:pt-28 sm:pb-14">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("auth.loading")}</p>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/40">
        <TopNavigation />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 pt-24 pb-10 sm:pt-28 sm:pb-14">
          <Card className="border-border/60 bg-card/80 shadow-lg shadow-black/5 backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <LogIn className="size-4" aria-hidden />
                <span className="text-xs uppercase tracking-wide">
                  {t("auth.title")}
                </span>
              </div>
              <CardTitle className="text-lg">{t("auth.headline")}</CardTitle>
              <CardDescription>{t("auth.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>{t("auth.requirement.title")}</AlertTitle>
                <AlertDescription>
                  {t("auth.requirement.description")}
                </AlertDescription>
              </Alert>
              <Auth
                supabaseClient={supabaseClient}
                providers={["google"]}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: "hsl(var(--primary))",
                        brandAccent: "hsl(var(--primary))",
                      },
                    },
                  },
                }}
                redirectTo={authRedirectTo}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/40">
      <TopNavigation />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 pt-24 pb-10 sm:pt-28 sm:pb-14">
        <Card className="border-0 bg-card/80 shadow-lg shadow-black/5 backdrop-blur">
          <CardHeader className="gap-4 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle>{t("header.title")}</CardTitle>
                <CardDescription>{t("header.description")}</CardDescription>
              </div>
              <Badge
                variant={allReady ? "default" : "secondary"}
                className="h-fit"
              >
                {statusBadgeLabel}
              </Badge>
            </div>
          </CardHeader>
          <Separator className="mx-6" />
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {t.rich("footer.tip", {
                  command: (chunks) => (
                    <code className="rounded-md bg-muted px-1.5 py-0.5">{chunks}</code>
                  ),
                })}
              </div>
              <Button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    {t("actions.refreshing")}
                  </>
                ) : (
                  <>
                    <RefreshCcw className="size-4" aria-hidden />
                    {t("actions.refresh")}
                  </>
                )}
              </Button>
            </div>
            {loading && (
              <p className="text-xs text-muted-foreground">
                {t("notices.loadingHint")}
              </p>
            )}

            {error && (
              <Alert className="border-destructive/60 bg-destructive/10 text-destructive-foreground">
                <AlertTitle>{t("notices.errorTitle")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {systemInfo && (
              <Card className="border-border/60 bg-background/40">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{t("system.title")}</CardTitle>
                  <CardDescription>{t("system.description")}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.hostname")}
                    </p>
                    <p className="font-mono text-sm">{systemInfo.hostname}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.platform")}
                    </p>
                    <p className="font-mono text-sm">{systemInfo.platform}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.release")}
                    </p>
                    <p className="font-mono text-sm">{systemInfo.release}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.arch")}
                    </p>
                    <p className="font-mono text-sm">{systemInfo.arch}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.cpuModel")}
                    </p>
                    <p className="font-mono text-sm">
                      {systemInfo.cpuModel ?? fallbackValue}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.cpuCores")}
                    </p>
                    <p className="font-mono text-sm">
                      {integerFormatter.format(systemInfo.cpuCores)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.cpuSpeed")}
                    </p>
                    <p className="font-mono text-sm">
                      {formatCpuSpeed(systemInfo.cpuSpeedGHz)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.totalMemory")}
                    </p>
                    <p className="font-mono text-sm">
                      {formatBytes(systemInfo.totalMemBytes)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.freeMemory")}
                    </p>
                    <p className="font-mono text-sm">
                      {formatBytes(systemInfo.freeMemBytes)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.uptime")}
                    </p>
                    <p className="font-mono text-sm">
                      {formatUptime(systemInfo.uptimeSeconds)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("system.fields.loadAverage")}
                    </p>
                    <p className="font-mono text-sm">
                      {formatLoadAverage(systemInfo.loadAverage)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/60 bg-background/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{t("table.title")}</CardTitle>
                <CardDescription>{t("table.description")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">{t("table.columns.tool")}</TableHead>
                      <TableHead className="w-[120px]">{t("table.columns.status")}</TableHead>
                      <TableHead className="w-[140px]">{t("table.columns.version")}</TableHead>
                      <TableHead>{t("table.columns.output")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                          <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden />
                          {t("table.loading")}
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading &&
                      results?.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell className="font-medium">
                            {t(`tools.${tool.id}`, { defaultValue: tool.label })}
                          </TableCell>
                          <TableCell>
                            {tool.installed ? (
                              <Badge variant="default">{t("badge.installed")}</Badge>
                            ) : (
                              <Badge variant="destructive">{t("badge.missing")}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {tool.version ?? "--"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {tool.output ?? tool.error ?? "--"}
                          </TableCell>
                        </TableRow>
                      ))}
                    {!loading && !results?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          {t("table.empty")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
