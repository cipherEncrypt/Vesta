"use client";

import { useCallback, useEffect, useState } from "react";
import type { Bill } from "@/lib/bills-types";

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bills");
      if (!res.ok) {
        setBills([]);
        setError(null);
        return;
      }
      const data = (await res.json()) as { bills?: Bill[] };
      setBills(Array.isArray(data.bills) ? data.bills : []);
      setError(null);
    } catch {
      setBills([]);
      setError("Bills unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addBill = async (input: {
    name: string;
    amountUsd: number;
    dueDay: number;
  }) => {
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Could not add bill.");
    await refresh();
  };

  const deleteBill = async (id: string) => {
    const res = await fetch(`/api/bills?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Could not delete bill.");
    await refresh();
  };

  return { bills, loading, error, refresh, addBill, deleteBill };
}