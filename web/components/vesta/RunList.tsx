"use client";

import { formatDual } from "@/lib/amounts";
import type { RunEntry } from "@/lib/vesta-types";

type RunListProps = {
  runs: RunEntry[];
  nearUsd: number | null;
  emptyMessage: string;
  compact?: boolean;
};

export function RunList({
  runs,
  nearUsd,
  emptyMessage,
  compact = false,
}: RunListProps) {
  if (runs.length === 0) {
    return (
      <p className={`feed-empty${compact ? " feed-empty-compact" : ""}`}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className={`feed${compact ? " feed-compact" : ""}`}
      aria-live="polite"
    >
      {runs.map((run) => {
        if (run.error) {
          return (
            <li
              key={run.timestamp + run.error}
              className="feed-item err"
              title={run.error}
            >
              <p className="feed-headline">
                An agent run failed. Check the agent terminal.
              </p>
            </li>
          );
        }
        const amt = formatDual(run.amount ?? "0", nearUsd);
        return (
          <li
            key={run.timestamp + (run.txHash ?? "")}
            className="feed-item feed-row"
          >
            <div className="feed-main">
              <p className="feed-headline">
                Vesta saved {amt.near}
                {amt.usd ? ` (${amt.usd})` : ""}
              </p>
              <p className="feed-meta">
                {new Date(run.timestamp).toLocaleString()}
              </p>
            </div>
            {run.txHash ? (
              <a
                className="feed-link"
                href={`https://explorer.testnet.near.org/transactions/${run.txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Explorer →
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}