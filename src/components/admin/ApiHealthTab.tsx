import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Activity, CheckCircle, XCircle, RefreshCw, Clock, AlertTriangle } from "lucide-react";

type HealthStatus = "ok" | "warn" | "error";

type HealthResult = {
  id: string;
  name: string;
  status: HealthStatus;
  latencyMs: number | null;
  message?: string;
};

type HealthCheck = {
  id: string;
  name: string;
  description: string;
  run: () => Promise<HealthResult>;
};

function formatLatency(latencyMs: number | null): string {
  if (latencyMs == null) return "-";
  if (latencyMs < 1000) return `${Math.round(latencyMs)} ms`;
  return `${(latencyMs / 1000).toFixed(2)} s`;
}

function isMissingRpcError(error: any): boolean {
  const code = (error?.code || '').toString();
  const message = (error?.message || '').toString();
  const details = (error?.details || '').toString();
  return (
    code === 'PGRST202' ||
    /could not find the function/i.test(message) ||
    /schema cache/i.test(details)
  );
}

function isNonCriticalTableError(error: any): boolean {
  const code = (error?.code || '').toString().toUpperCase();
  const message = (error?.message || '').toString();
  const details = (error?.details || '').toString();
  const combined = `${message} ${details}`;
  return (
    code === '42P01' || // undefined_table
    code === '42501' || // insufficient_privilege
    /permission denied/i.test(combined) ||
    /row[- ]level security/i.test(combined) ||
    /relation .* does not exist/i.test(combined) ||
    /table .* does not exist/i.test(combined)
  );
}

const DEFAULT_INTERVAL_MS = 30000;

const ApiHealthTab = () => {
  const { user } = useSecureAuth();
  const [results, setResults] = useState<Record<string, HealthResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<HealthStatus | 'all'>('all');
  const timerRef = useRef<number | null>(null);

  const checks: HealthCheck[] = useMemo(() => {
    const authSessionCheck: HealthCheck = {
      id: "auth-session",
      name: "Supabase Auth Session",
      description: "Validate current session availability",
      run: async () => {
        const start = performance.now();
        try {
          const { data, error } = await supabase.auth.getSession();
          const latencyMs = performance.now() - start;
          if (error) {
            return { id: "auth-session", name: "Supabase Auth Session", status: "error", latencyMs, message: error.message };
          }
          const hasSession = Boolean(data?.session);
          return {
            id: "auth-session",
            name: "Supabase Auth Session",
            status: hasSession ? "ok" : "warn",
            latencyMs,
            message: hasSession ? "Session active" : "No active session"
          };
        } catch (e: any) {
          const latencyMs = performance.now() - start;
          return { id: "auth-session", name: "Supabase Auth Session", status: "error", latencyMs, message: String(e?.message || e) };
        }
      }
    };

    // All key tables used across the app (reads are HEAD count to avoid payload)
    const tableNames = [
      "profiles",
      "merchants",
      "virtual_cards",
      "loyalty_transactions",
      "user_loyalty_cards",
      "user_points",
      "user_referrals",
      "user_wallets",
      "merchant_cards",
      "merchant_subscriptions",
      "merchant_subscription_plans",
      "referral_campaigns",
      "transaction_qr_codes",
      "subscribers",
      // DAO System Tables
      "dao_organizations",
      "dao_members",
      "dao_proposals",
      "dao_votes",
      "dao_treasury",
      "dao_transactions",
      "dao_proposal_comments",
      "dao_proposal_attachments",
      "loyalty_change_requests",
      "loyalty_change_approvals"
    ];

    const tableChecks: HealthCheck[] = tableNames.map((table) => ({
      id: `table-${table}`,
      name: `Table ${table}`,
      description: `HEAD count on ${table}`,
      run: async () => {
        const start = performance.now();
        try {
          const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
          const latencyMs = performance.now() - start;
          if (error) {
            const status: HealthStatus = isNonCriticalTableError(error) ? "warn" : "error";
            return { id: `table-${table}`, name: `Table ${table}`, status, latencyMs, message: error.message };
          }
          return { id: `table-${table}`, name: `Table ${table}`, status: "ok", latencyMs, message: `Count accessible (${count ?? 0})` };
        } catch (e: any) {
          const latencyMs = performance.now() - start;
          const status: HealthStatus = isNonCriticalTableError(e) ? "warn" : "error";
          return { id: `table-${table}`, name: `Table ${table}`, status, latencyMs, message: String(e?.message || e) };
        }
      }
    }));

    // Safe RPCs used in the app
    const rpcChecks: HealthCheck[] = [
      {
        id: "rpc-is-admin",
        name: "RPC is_admin",
        description: "Test is_admin RPC accessibility",
        run: async () => {
          const start = performance.now();
          try {
            const { data, error } = await supabase.rpc("is_admin");
            const latencyMs = performance.now() - start;
            if (error) {
              const status: HealthStatus = isMissingRpcError(error) ? "warn" : "error";
              return { id: "rpc-is-admin", name: "RPC is_admin", status, latencyMs, message: error.message };
            }
            const ok = data === true || data === false;
            return { id: "rpc-is-admin", name: "RPC is_admin", status: ok ? "ok" : "warn", latencyMs, message: `Response: ${String(data)}` };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "rpc-is-admin", name: "RPC is_admin", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      },
      {
        id: "rpc-check-admin",
        name: "RPC check_admin_access",
        description: "Test check_admin_access RPC accessibility",
        run: async () => {
          const start = performance.now();
          try {
            const { data, error } = await supabase.rpc("check_admin_access");
            let latencyMs = performance.now() - start;
            if (error) {
              if (isMissingRpcError(error)) {
                // Fallback to is_admin
                const fbStart = performance.now();
                const { data: fb, error: fbErr } = await supabase.rpc("is_admin");
                latencyMs = performance.now() - fbStart;
                if (!fbErr && (fb === true || fb === false)) {
                  return { id: "rpc-check-admin", name: "RPC check_admin_access", status: "warn", latencyMs, message: `Missing RPC; used is_admin fallback: ${String(fb)}` };
                }
                return { id: "rpc-check-admin", name: "RPC check_admin_access", status: "warn", latencyMs, message: "RPC missing; fallback unavailable" };
              }
              return { id: "rpc-check-admin", name: "RPC check_admin_access", status: "error", latencyMs, message: error.message };
            }
            const ok = data === true || data === false;
            return { id: "rpc-check-admin", name: "RPC check_admin_access", status: ok ? "ok" : "warn", latencyMs, message: `Response: ${String(data)}` };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "rpc-check-admin", name: "RPC check_admin_access", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      },
      {
        id: "rpc-can-use-mfa",
        name: "RPC can_use_mfa",
        description: "Validate MFA eligibility RPC",
        run: async () => {
          const start = performance.now();
          try {
            const userId = user?.id || "00000000-0000-0000-0000-000000000000";
            const { data, error } = await supabase.rpc("can_use_mfa", { user_id: userId });
            const latencyMs = performance.now() - start;
            if (error) {
              const status: HealthStatus = isMissingRpcError(error) ? "warn" : "error";
              const msg = isMissingRpcError(error) ? "RPC missing; MFA not configured" : error.message;
              return { id: "rpc-can-use-mfa", name: "RPC can_use_mfa", status, latencyMs, message: msg };
            }
            const ok = data === true || data === false || data == null;
            return { id: "rpc-can-use-mfa", name: "RPC can_use_mfa", status: ok ? "ok" : "warn", latencyMs, message: `Response: ${String(data)}` };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "rpc-can-use-mfa", name: "RPC can_use_mfa", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      },
      {
        id: "rpc-get-current-user-profile",
        name: "RPC get_current_user_profile",
        description: "Fetch current user profile via RPC",
        run: async () => {
          const start = performance.now();
          try {
            const { data, error } = await supabase.rpc("get_current_user_profile");
            let latencyMs = performance.now() - start;
            if (error) {
              if (isMissingRpcError(error)) {
                // Fallback to direct table query
                const userId = user?.id;
                if (!userId) {
                  return { id: "rpc-get-current-user-profile", name: "RPC get_current_user_profile", status: "warn", latencyMs, message: "No user; RPC missing" };
                }
                const fbStart = performance.now();
                const { data: prof, error: profErr } = await supabase
                  .from('profiles')
                  .select('id,email,full_name,role')
                  .or(`id.eq.${userId},user_id.eq.${userId}`)
                  .limit(1);
                latencyMs = performance.now() - fbStart;
                if (!profErr) {
                  const rows = Array.isArray(prof) ? prof.length : 0;
                  return { id: "rpc-get-current-user-profile", name: "RPC get_current_user_profile", status: "warn", latencyMs, message: `RPC missing; direct query rows: ${rows}` };
                }
                return { id: "rpc-get-current-user-profile", name: "RPC get_current_user_profile", status: "warn", latencyMs, message: "RPC missing; direct query failed" };
              }
              return { id: "rpc-get-current-user-profile", name: "RPC get_current_user_profile", status: "error", latencyMs, message: error.message };
            }
            const ok = Array.isArray(data);
            return { id: "rpc-get-current-user-profile", name: "RPC get_current_user_profile", status: ok ? "ok" : "warn", latencyMs, message: `Rows: ${Array.isArray(data) ? data.length : 0}` };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "rpc-get-current-user-profile", name: "RPC get_current_user_profile", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      },
      {
        id: "rpc-generate-loyalty-number",
        name: "RPC generate_loyalty_number",
        description: "Generate a loyalty number (read-only)",
        run: async () => {
          const start = performance.now();
          try {
            const { data, error } = await supabase.rpc("generate_loyalty_number");
            const latencyMs = performance.now() - start;
            if (error) {
              const status: HealthStatus = isMissingRpcError(error) ? "warn" : "error";
              const msg = isMissingRpcError(error) ? "RPC missing; not required for core health" : error.message;
              return { id: "rpc-generate-loyalty-number", name: "RPC generate_loyalty_number", status, latencyMs, message: msg };
            }
            const ok = typeof data === "string" && data.length > 0;
            return { id: "rpc-generate-loyalty-number", name: "RPC generate_loyalty_number", status: ok ? "ok" : "warn", latencyMs, message: ok ? "Generated" : "Empty response" };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "rpc-generate-loyalty-number", name: "RPC generate_loyalty_number", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      },
      {
        id: "rpc-generate-referral-code",
        name: "RPC generate_referral_code",
        description: "Generate a referral code (read-only)",
        run: async () => {
          const start = performance.now();
          try {
            const { data, error } = await supabase.rpc("generate_referral_code");
            const latencyMs = performance.now() - start;
            if (error) {
              const status: HealthStatus = isMissingRpcError(error) ? "warn" : "error";
              const msg = isMissingRpcError(error) ? "RPC missing; not required for core health" : error.message;
              return { id: "rpc-generate-referral-code", name: "RPC generate_referral_code", status, latencyMs, message: msg };
            }
            const ok = typeof data === "string" && data.length > 0;
            return { id: "rpc-generate-referral-code", name: "RPC generate_referral_code", status: ok ? "ok" : "warn", latencyMs, message: ok ? "Generated" : "Empty response" };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "rpc-generate-referral-code", name: "RPC generate_referral_code", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      }
    ];

    // New feature health checks
    const featureChecks: HealthCheck[] = [
      {
        id: "dao-system",
        name: "DAO System",
        description: "Check DAO system accessibility",
        run: async () => {
          const start = performance.now();
          try {
            // Check if DAO tables exist and are accessible
            const { data, error } = await supabase
              .from('dao_organizations')
              .select('id')
              .limit(1);
            const latencyMs = performance.now() - start;
            if (error) {
              return { id: "dao-system", name: "DAO System", status: "error", latencyMs, message: error.message };
            }
            return { id: "dao-system", name: "DAO System", status: "ok", latencyMs, message: "DAO system accessible" };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "dao-system", name: "DAO System", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      },
      {
        id: "rewards-manager",
        name: "Rewards Manager",
        description: "Check RewardsManager component accessibility",
        run: async () => {
          const start = performance.now();
          try {
            // Check if rewards-related tables are accessible
            const { data, error } = await supabase
              .from('loyalty_transactions')
              .select('id')
              .limit(1);
            const latencyMs = performance.now() - start;
            if (error) {
              return { id: "rewards-manager", name: "Rewards Manager", status: "error", latencyMs, message: error.message };
            }
            return { id: "rewards-manager", name: "Rewards Manager", status: "ok", latencyMs, message: "Rewards system accessible" };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "rewards-manager", name: "Rewards Manager", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      },
      {
        id: "user-dao-access",
        name: "User DAO Access",
        description: "Check user DAO page accessibility",
        run: async () => {
          const start = performance.now();
          try {
            // Check if user can access DAO proposals
            const { data, error } = await supabase
              .from('dao_proposals')
              .select('id')
              .limit(1);
            const latencyMs = performance.now() - start;
            if (error) {
              return { id: "user-dao-access", name: "User DAO Access", status: "error", latencyMs, message: error.message };
            }
            return { id: "user-dao-access", name: "User DAO Access", status: "ok", latencyMs, message: "User DAO access working" };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "user-dao-access", name: "User DAO Access", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      },
      {
        id: "merchant-reward-generator",
        name: "Merchant Reward Generator",
        description: "Check manual reward generation functionality",
        run: async () => {
          const start = performance.now();
          try {
            // Check if loyalty_transactions table supports manual entries
            const { data, error } = await supabase
              .from('loyalty_transactions')
              .select('transaction_type')
              .eq('transaction_type', 'manual_entry')
              .limit(1);
            const latencyMs = performance.now() - start;
            if (error) {
              return { id: "merchant-reward-generator", name: "Merchant Reward Generator", status: "error", latencyMs, message: error.message };
            }
            return { id: "merchant-reward-generator", name: "Merchant Reward Generator", status: "ok", latencyMs, message: "Manual reward generation ready" };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "merchant-reward-generator", name: "Merchant Reward Generator", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      }
    ];

    // Storage buckets used in the app
    const storageChecks: HealthCheck[] = [
      {
        id: "storage-public-assets",
        name: "Storage public-assets",
        description: "List objects in public-assets bucket",
        run: async () => {
          const start = performance.now();
          try {
            const { data, error } = await supabase.storage.from("public-assets").list("", { limit: 1 });
            const latencyMs = performance.now() - start;
            if (error) {
              // Treat missing bucket as a warning rather than hard error for health UI
              const status: HealthStatus = /not found|does not exist/i.test(String(error?.message || '')) ? "warn" : "error";
              return { id: "storage-public-assets", name: "Storage public-assets", status, latencyMs, message: error.message };
            }
            return { id: "storage-public-assets", name: "Storage public-assets", status: "ok", latencyMs, message: `${Array.isArray(data) ? data.length : 0} objects visible` };
          } catch (e: any) {
            const latencyMs = performance.now() - start;
            return { id: "storage-public-assets", name: "Storage public-assets", status: "error", latencyMs, message: String(e?.message || e) };
          }
        }
      }
    ];

    return [authSessionCheck, ...tableChecks, ...rpcChecks, ...featureChecks, ...storageChecks];
  }, [user?.id]);

  const runAllChecks = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const settled = await Promise.allSettled(
        checks.map(async (c) => {
          const res = await c.run();
          return [c.id, res] as const;
        })
      );
      const next: Record<string, HealthResult> = {};
      let anyError = false;
      for (const s of settled) {
        if (s.status === "fulfilled") {
          const [id, res] = s.value;
          next[id] = res;
          if (res.status === "error") anyError = true;
        } else {
          anyError = true;
        }
      }
      setResults(next);
      setLastRunAt(Date.now());
    } finally {
      setIsRunning(false);
    }
  }, [checks, isRunning]);

  useEffect(() => {
    // initial run
    runAllChecks();
  }, [runAllChecks]);

  // Smart data refresh - refreshes API health data when returning to app
  const refreshHealthData = async () => {
    console.log('🔄 Refreshing API health data...');
    await runAllChecks();
  };

  useSmartDataRefresh(refreshHealthData, {
    debounceMs: 5000, // 5 second debounce for health checks (they can be expensive)
    enabled: true,
    dependencies: [user?.id] // Refresh when user changes
  });

  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = window.setInterval(() => {
      runAllChecks();
    }, DEFAULT_INTERVAL_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [autoRefresh, runAllChecks]);

  const summary = useMemo(() => {
    const total = checks.length;
    const values = Object.values(results);
    const okCount = values.filter(v => v.status === "ok").length;
    const warnCount = values.filter(v => v.status === "warn").length;
    const errorCount = values.filter(v => v.status === "error").length;
    return { total, okCount, warnCount, errorCount };
  }, [results, checks.length]);

  return (
    <div className="space-y-4">
      <Card className="card-gradient border-0">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Health
            </CardTitle>
            <CardDescription>Live status of core Supabase APIs and tables</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {lastRunAt ? new Date(lastRunAt).toLocaleTimeString() : "-"}
              </span>
            </div>
            <Button onClick={runAllChecks} disabled={isRunning} variant="outline">
              <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant="outline" 
              className={`cursor-pointer transition-colors hover:bg-muted ${statusFilter === 'all' ? 'bg-muted' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All: {summary.total}
            </Badge>
            <Badge 
              className={`bg-green-500/10 text-green-600 border-green-500/30 cursor-pointer transition-colors hover:bg-green-500/20 ${statusFilter === 'ok' ? 'bg-green-500/20' : ''}`}
              onClick={() => setStatusFilter('ok')}
            >
              OK: {summary.okCount}
            </Badge>
            <Badge 
              className={`bg-yellow-500/10 text-yellow-700 border-yellow-500/30 cursor-pointer transition-colors hover:bg-yellow-500/20 ${statusFilter === 'warn' ? 'bg-yellow-500/20' : ''}`}
              onClick={() => setStatusFilter('warn')}
            >
              Warnings: {summary.warnCount}
            </Badge>
            <Badge 
              className={`bg-red-500/10 text-red-600 border-red-500/30 cursor-pointer transition-colors hover:bg-red-500/20 ${statusFilter === 'error' ? 'bg-red-500/20' : ''}`}
              onClick={() => setStatusFilter('error')}
            >
              Errors: {summary.errorCount}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checks</CardTitle>
          <CardDescription>Key endpoints and database resources</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.filter((c) => {
                if (statusFilter === 'all') return true;
                const r = results[c.id];
                return r?.status === statusFilter;
              }).map((c) => {
                const r = results[c.id];
                const status = r?.status;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    </TableCell>
                    <TableCell>
                      {status === "ok" && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Healthy</span>
                        </div>
                      )}
                      {status === "warn" && (
                        <div className="flex items-center gap-1 text-yellow-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Warning</span>
                        </div>
                      )}
                      {status === "error" && (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span>Error</span>
                        </div>
                      )}
                      {!status && <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{formatLatency(r?.latencyMs ?? null)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {r?.message || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiHealthTab;

