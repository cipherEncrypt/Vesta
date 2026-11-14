"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { actionCreators } from "@near-js/transactions";
import { useWallet } from "@/components/WalletProvider";
import { VAULT_CONTRACT_ID } from "@/lib/constants";
import {
  formatDual,
  nearToYocto,
  sumYoctoStrings,
  yoctoToNearString,
} from "@/lib/amounts";
import type {
  PendingAction,
  RunEntry,
  Toast,
  VaultState,
} from "@/lib/vesta-types";
import { nextSaveLabel } from "@/components/vesta/next-save";
import { formatNearForRule, nearToUsd, previewSaveFromUsd } from "@/lib/save-usd";

const TGAS = BigInt("30000000000000");
const ONBOARDING_SKIP_KEY = "vesta-onboarding-skipped";
const DEFAULT_SAVE_USD = "1.00";

type VestaContextValue = {
  accountId: string | null;
  wrongNetwork: boolean;
  vault: VaultState | null;
  runs: RunEntry[];
  successfulRuns: RunEntry[];
  nearUsd: number | null;
  fetching: boolean;
  pending: PendingAction;
  toast: Toast;
  setToast: (t: Toast) => void;
  depositNear: string;
  setDepositNear: (v: string) => void;
  saveUsd: string;
  setSaveUsd: (v: string) => void;
  withdrawNear: string;
  setWithdrawNear: (v: string) => void;
  activeRule: string | null;
  activeRuleUsd: string | null;
  activeRuleDisplay: string | null;
  maxPerRunNear: number;
  saveRuleOk: boolean;
  ruleConfigured: boolean;
  showOnboarding: boolean;
  skipOnboarding: () => void;
  confirmOnboarding: () => Promise<void>;
  persistSaveRule: () => Promise<void>;
  deposit: () => Promise<void>;
  withdraw: () => Promise<void>;
  withdrawForBillUsd: (amountUsd: number, billName: string) => Promise<void>;
  total: ReturnType<typeof formatDual>;
  spending: ReturnType<typeof formatDual>;
  savings: ReturnType<typeof formatDual>;
  accountBalance: ReturnType<typeof formatDual>;
  nextSave: string;
  dailySaveLine: string | null;
  runSaveNow: () => Promise<void>;
  refreshVault: () => Promise<void>;
};

const VestaCtx = createContext<VestaContextValue | null>(null);

export function useVesta() {
  const ctx = useContext(VestaCtx);
  if (!ctx) throw new Error("useVesta must be used within VestaDataProvider");
  return ctx;
}

function isSuccessfulRun(run: RunEntry): boolean {
  if (run.skipped || run.error || !run.amount) return false;
  try {
    return BigInt(run.amount) > BigInt(0);
  } catch {
    return false;
  }
}

export function VestaDataProvider({ children }: { children: ReactNode }) {
  const { accountId, selector } = useWallet();
  const [vault, setVault] = useState<VaultState | null>(null);
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [nearUsd, setNearUsd] = useState<number | null>(null);
  const [accountYocto, setAccountYocto] = useState<string | null>(null);
  const [depositNear, setDepositNear] = useState("0.5");
  const [saveUsd, setSaveUsd] = useState(DEFAULT_SAVE_USD);
  const [withdrawNear, setWithdrawNear] = useState("0.01");
  const [activeRule, setActiveRule] = useState<string | null>(null);
  const [ruleConfigured, setRuleConfigured] = useState(false);
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);
  const [ruleIntervalMs, setRuleIntervalMs] = useState(86_400_000);
  const [pending, setPending] = useState<PendingAction>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [fetching, setFetching] = useState(true);

  const refreshVault = useCallback(async () => {
    const res = await fetch("/api/vault-state");
    if (!res.ok) throw new Error("Could not fetch vault balances.");
    const next = (await res.json()) as VaultState;
    setVault((prev) => {
      if (
        prev &&
        prev.spending === next.spending &&
        prev.savings === next.savings &&
        prev.lastRun === next.lastRun
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const refreshRuns = useCallback(async () => {
    const res = await fetch("/api/runs");
    if (!res.ok) return;
    const data = (await res.json()) as { runs?: RunEntry[] };
    const next = [...(data.runs ?? [])].reverse();
    setRuns((prev) => {
      if (
        prev.length === next.length &&
        prev[0]?.timestamp === next[0]?.timestamp &&
        prev[prev.length - 1]?.timestamp === next[next.length - 1]?.timestamp
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const refreshPrice = useCallback(async () => {
    const res = await fetch("/api/near-usd");
    if (res.ok) {
      const { usd } = await res.json();
      setNearUsd(usd);
    }
  }, []);

  const refreshRule = useCallback(async () => {
    const res = await fetch("/api/rule");
    if (!res.ok) return;
    const data = (await res.json()) as {
      saveAmountNear?: string;
      updatedAt?: string | null;
      intervalMs?: number;
    };
    const configured = Boolean(data.updatedAt);
    setRuleConfigured(configured);
    if (data.saveAmountNear) {
      setActiveRule(data.saveAmountNear);
    }
    if (typeof data.intervalMs === "number" && data.intervalMs > 0) {
      setRuleIntervalMs(data.intervalMs);
    }
    return data;
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!accountId) {
      setAccountYocto(null);
      return;
    }
    const res = await fetch(
      `/api/account-balance?accountId=${encodeURIComponent(accountId)}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as { amount?: string };
    setAccountYocto(data.amount ?? "0");
  }, [accountId]);

  useEffect(() => {
    let active = true;
    const refreshAll = async () => {
      try {
        await Promise.all([
          refreshVault(),
          refreshRuns(),
          refreshPrice(),
          refreshRule(),
          refreshAccount(),
        ]);
      } catch (error) {
        if (active) {
          setToast({
            tone: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not refresh Vesta.",
          });
        }
      } finally {
        if (active) setFetching(false);
      }
    };
    void refreshAll();
    const pollLive = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      void Promise.all([
        refreshVault(),
        refreshRuns(),
        refreshAccount(),
      ]).catch(() => undefined);
    };
    const poll = setInterval(pollLive, 45_000);
    const pricePoll = setInterval(() => {
      void refreshPrice().catch(() => undefined);
    }, 300_000);
    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(pricePoll);
    };
  }, [
    refreshVault,
    refreshRuns,
    refreshPrice,
    refreshRule,
    refreshAccount,
  ]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!accountId || typeof window === "undefined") {
      setOnboardingSkipped(false);
      return;
    }
    const key = `${ONBOARDING_SKIP_KEY}:${accountId}`;
    setOnboardingSkipped(window.localStorage.getItem(key) === "1");
  }, [accountId]);

  useEffect(() => {
    if (!ruleConfigured || !activeRule || !nearUsd) return;
    const near = Number(activeRule);
    const usd = nearToUsd(near, nearUsd);
    if (usd != null) setSaveUsd(usd.toFixed(2));
  }, [ruleConfigured, activeRule, nearUsd]);

  const maxPerRunNear = useMemo(
    () => (vault ? yoctoToNearString(vault.maxPerRun) : 0),
    [vault],
  );

  const savePreview = useMemo(
    () => previewSaveFromUsd(saveUsd, nearUsd, maxPerRunNear),
    [saveUsd, nearUsd, maxPerRunNear],
  );

  const saveRuleOk = useMemo(() => {
    return Boolean(
      savePreview?.nearLabel &&
        savePreview.near != null &&
        savePreview.near > 0 &&
        nearUsd != null &&
        nearUsd > 0,
    );
  }, [savePreview, nearUsd]);

  const showOnboarding = useMemo(
    () =>
      !fetching &&
      !ruleConfigured &&
      !onboardingSkipped &&
      Boolean(accountId),
    [fetching, ruleConfigured, onboardingSkipped, accountId],
  );

  const skipOnboarding = useCallback(() => {
    if (accountId && typeof window !== "undefined") {
      window.localStorage.setItem(`${ONBOARDING_SKIP_KEY}:${accountId}`, "1");
    }
    setOnboardingSkipped(true);
  }, [accountId]);

  const persistSaveRuleNear = async (nearStr: string) => {
    const n = Number(nearStr);
    if (!Number.isFinite(n) || n <= 0) {
      setToast({
        tone: "error",
        message: "Enter a save amount greater than zero.",
      });
      return false;
    }
    if (vault && n > maxPerRunNear) {
      setToast({
        tone: "error",
        message: `Save amount must be at most ${maxPerRunNear} NEAR per run.`,
      });
      return false;
    }
    setPending("rule");
    try {
      const res = await fetch("/api/rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveAmountNear: nearStr }),
      });
      const data = (await res.json()) as {
        saveAmountNear?: string;
        updatedAt?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not save rule.");
      setActiveRule(data.saveAmountNear ?? nearStr);
      setRuleConfigured(true);
      setToast({ tone: "success", message: "Daily save updated." });
      return true;
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not save rule.",
      });
      return false;
    } finally {
      setPending(null);
    }
  };

  const persistSaveRule = async () => {
    if (!savePreview?.nearLabel) {
      setToast({
        tone: "error",
        message: "Enter a valid dollar amount.",
      });
      return;
    }
    await persistSaveRuleNear(savePreview.nearLabel);
  };

  const confirmOnboarding = async () => {
    if (!savePreview?.nearLabel) return;
    await persistSaveRuleNear(savePreview.nearLabel);
  };

  const deposit = async () => {
    if (!selector || !accountId) return;
    setPending("deposit");
    setToast(null);
    try {
      const wallet = await selector.wallet();
      const yocto = nearToYocto(depositNear);
      await wallet.signAndSendTransaction({
        receiverId: VAULT_CONTRACT_ID,
        actions: [
          actionCreators.functionCall("deposit", {}, TGAS, BigInt(yocto)),
        ],
      });
      setToast({ tone: "success", message: "Deposit confirmed." });
      await Promise.all([refreshVault(), refreshAccount()]);
    } catch (e) {
      setToast({
        tone: "error",
        message: e instanceof Error ? e.message : "Deposit failed.",
      });
    } finally {
      setPending(null);
    }
  };

  const runSaveNow = async () => {
    setPending("runNow");
    setToast(null);
    try {
      const res = await fetch("/api/run-now", { method: "POST" });
      const data = (await res.json()) as {
        skipped?: boolean;
        reason?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not run today's save.");
      }
      if (data.skipped) {
        setToast({
          tone: "error",
          message:
            data.reason ?? "No spendable balance. Deposit spending money first.",
        });
      } else {
        setToast({
          tone: "success",
          message: "Today's save ran on autopilot (agent key, not your wallet).",
        });
      }
      await Promise.all([refreshVault(), refreshRuns()]);
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not run today's save.",
      });
    } finally {
      setPending(null);
    }
  };

  const withdrawNearAmount = async (
    nearAmountStr: string,
    successMessage = "Savings withdrawn.",
  ) => {
    if (!selector || !accountId) return;
    setPending("withdraw");
    setToast(null);
    try {
      const wallet = await selector.wallet();
      const amount = nearToYocto(nearAmountStr);
      setWithdrawNear(nearAmountStr);
      await wallet.signAndSendTransaction({
        receiverId: VAULT_CONTRACT_ID,
        actions: [
          actionCreators.functionCall(
            "withdraw",
            { amount },
            TGAS,
            BigInt(0),
          ),
        ],
      });
      setToast({ tone: "success", message: successMessage });
      await Promise.all([refreshVault(), refreshAccount()]);
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Withdrawal failed.",
      });
    } finally {
      setPending(null);
    }
  };

  const withdraw = async () => {
    await withdrawNearAmount(withdrawNear);
  };

  const withdrawForBillUsd = async (amountUsd: number, billName: string) => {
    if (!nearUsd) {
      setToast({
        tone: "error",
        message: "NEAR price unavailable.",
      });
      return;
    }
    const savingsNear = vault ? yoctoToNearString(vault.savings) : 0;
    let near = amountUsd / nearUsd;
    if (near > savingsNear) near = savingsNear;
    if (!Number.isFinite(near) || near <= 0) {
      setToast({
        tone: "error",
        message: "Not enough savings to withdraw for this bill.",
      });
      return;
    }
    const nearStr = formatNearForRule(near);
    await withdrawNearAmount(
      nearStr,
      `Withdrawal for ${billName} confirmed.`,
    );
  };

  const wrongNetwork = Boolean(accountId && !/\.testnet$/i.test(accountId));

  const totalYocto = vault
    ? sumYoctoStrings(vault.spending, vault.savings)
    : null;
  const total = formatDual(totalYocto, nearUsd);
  const spending = formatDual(vault?.spending, nearUsd);
  const savings = formatDual(vault?.savings, nearUsd);
  const accountBalance = formatDual(accountYocto, nearUsd);

  const nextSave = useMemo(
    () => nextSaveLabel(vault, ruleIntervalMs),
    [vault, ruleIntervalMs],
  );

  const activeRuleUsd =
    activeRule && nearUsd != null
      ? `$${(Number(activeRule) * nearUsd).toFixed(2)}`
      : null;

  const activeRuleDisplay = useMemo(() => {
    if (!activeRule) return null;
    const near = Number(activeRule);
    if (!Number.isFinite(near)) return `${activeRule} NEAR`;
    if (activeRuleUsd) {
      return `${activeRuleUsd} (≈ ${near.toFixed(4)} NEAR) each day`;
    }
    return `≈ ${near.toFixed(4)} NEAR each day`;
  }, [activeRule, activeRuleUsd]);

  const dailySaveLine = useMemo(() => {
    if (activeRuleUsd) {
      const near = activeRule ? Number(activeRule) : null;
      if (near != null && Number.isFinite(near)) {
        return `Vesta saves ${activeRuleUsd} (≈ ${near.toFixed(4)} NEAR) each day`;
      }
      return `Vesta saves ${activeRuleUsd} each day`;
    }
    const preview = previewSaveFromUsd(saveUsd, nearUsd, maxPerRunNear);
    if (preview && nearUsd) {
      const nearPart = preview.near != null ? ` (≈ ${preview.near.toFixed(4)} NEAR)` : "";
      return `Vesta saves $${preview.usd.toFixed(2)}${nearPart} each day`;
    }
    return null;
  }, [activeRuleUsd, activeRule, saveUsd, nearUsd, maxPerRunNear]);

  const successfulRuns = useMemo(
    () => runs.filter(isSuccessfulRun),
    [runs],
  );

  const value = useMemo<VestaContextValue>(
    () => ({
      accountId,
      wrongNetwork,
      vault,
      runs,
      successfulRuns,
      nearUsd,
      fetching,
      pending,
      toast,
      setToast,
      depositNear,
      setDepositNear,
      saveUsd,
      setSaveUsd,
      withdrawNear,
      setWithdrawNear,
      activeRule,
      activeRuleUsd,
      activeRuleDisplay,
      maxPerRunNear,
      saveRuleOk,
      ruleConfigured,
      showOnboarding,
      skipOnboarding,
      confirmOnboarding,
      persistSaveRule,
      deposit,
      withdraw,
      withdrawForBillUsd,
      total,
      spending,
      savings,
      accountBalance,
      nextSave,
      dailySaveLine,
      runSaveNow,
      refreshVault,
    }),
    [
      accountId,
      wrongNetwork,
      vault,
      runs,
      successfulRuns,
      nearUsd,
      fetching,
      pending,
      toast,
      depositNear,
      saveUsd,
      withdrawNear,
      activeRule,
      activeRuleUsd,
      activeRuleDisplay,
      maxPerRunNear,
      saveRuleOk,
      ruleConfigured,
      showOnboarding,
      skipOnboarding,
      confirmOnboarding,
      persistSaveRule,
      deposit,
      withdraw,
      withdrawForBillUsd,
      total,
      spending,
      savings,
      accountBalance,
      nextSave,
      dailySaveLine,
      runSaveNow,
      refreshVault,
    ],
  );

  return (
    <VestaCtx.Provider value={value}>
      {children}
    </VestaCtx.Provider>
  );
}