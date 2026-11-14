"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { NetworkGuard } from "@/components/vesta/NetworkGuard";
import { VestaDataProvider } from "@/components/vesta/VestaDataProvider";
import { AppShell } from "@/components/vesta/AppShell";

export function AppGate({ children }: { children: ReactNode }) {
  const { accountId, loading } = useWallet();
  const router = useRouter();

  const wrongNetwork = Boolean(accountId && !/\.testnet$/i.test(accountId));

  useEffect(() => {
    if (loading) return;
    if (!accountId) {
      router.replace("/");
    }
  }, [accountId, loading, router]);

  if (loading) {
    return (
      <main className="loading-screen" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>Restoring your wallet…</p>
      </main>
    );
  }

  if (!accountId) {
    return (
      <main className="loading-screen" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>Redirecting…</p>
      </main>
    );
  }

  if (wrongNetwork) {
    return <NetworkGuard accountId={accountId} />;
  }

  return (
    <VestaDataProvider>
      <AppShell>{children}</AppShell>
    </VestaDataProvider>
  );
}