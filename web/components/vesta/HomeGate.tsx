"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { VestaLanding } from "@/components/VestaLanding";

export function HomeGate() {
  const { accountId, loading } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (accountId) {
      router.replace("/app");
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

  if (accountId) {
    return (
      <main className="loading-screen" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>Opening your dashboard…</p>
      </main>
    );
  }

  return <VestaLanding />;
}