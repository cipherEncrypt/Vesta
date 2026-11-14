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
import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import "@near-wallet-selector/modal-ui/styles.css";
import { NETWORK_ID, VAULT_CONTRACT_ID } from "@/lib/constants";

type WalletCtx = {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  loading: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
};

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    setupWalletSelector({
      network: NETWORK_ID,
      modules: [
        setupMyNearWallet(),
        setupHereWallet(),
        setupMeteorWallet(),
      ],
    })
      .then((sel) => {
        const m = setupModal(sel, { contractId: VAULT_CONTRACT_ID });
        setSelector(sel);
        setModal(m);
        const state = sel.store.getState();
        setAccountId(state.accounts[0]?.accountId ?? null);
        subscription = sel.store.observable.subscribe((s) => {
          setAccountId(s.accounts[0]?.accountId ?? null);
        });
      })
      .catch((err) => console.error("wallet init", err))
      .finally(() => setLoading(false));

    return () => subscription?.unsubscribe();
  }, []);

  const connect = useCallback(() => {
    modal?.show();
  }, [modal]);

  const disconnect = useCallback(async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
    setAccountId(null);
  }, [selector]);

  const value = useMemo(
    () => ({ selector, modal, accountId, loading, connect, disconnect }),
    [selector, modal, accountId, loading, connect, disconnect],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet outside provider");
  return ctx;
}