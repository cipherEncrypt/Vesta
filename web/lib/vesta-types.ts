export type VaultState = {
  spending: string;
  savings: string;
  maxPerRun: string;
  lastRun: string;
};

export type RunEntry = {
  timestamp: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
  amount?: string | null;
  txHash?: string | null;
  state?: VaultState | null;
};

export type PendingAction = "deposit" | "rule" | "withdraw" | "runNow" | null;

export type Toast = { tone: "success" | "error"; message: string } | null;