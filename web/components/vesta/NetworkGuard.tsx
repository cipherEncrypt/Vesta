"use client";

import { useWallet } from "@/components/WalletProvider";

export function NetworkGuard({ accountId }: { accountId: string }) {
  const { disconnect } = useWallet();

  return (
    <main className="network-guard" aria-labelledby="network-guard-title">
      <header className="app-header">
        <a className="wordmark" href="/" aria-label="Vesta home">
          <span className="vesta-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Vesta
        </a>
      </header>
      <section className="network-guard-panel">
        <h1 id="network-guard-title">Switch to NEAR testnet</h1>
        <p>
          Vesta only runs on testnet accounts (IDs ending in{" "}
          <span className="mono">.testnet</span>). You&apos;re connected as{" "}
          <span className="mono">{accountId}</span>.
        </p>
        <button
          type="button"
          className="primary"
          onClick={() => void disconnect()}
        >
          Sign out and reconnect
        </button>
      </section>
    </main>
  );
}