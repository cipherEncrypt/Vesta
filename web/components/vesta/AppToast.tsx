"use client";

import { useVesta } from "@/components/vesta/VestaDataProvider";

export function AppToast() {
  const { toast } = useVesta();
  if (!toast) return null;
  return (
    <p className={`status status-${toast.tone}`} role="status">
      {toast.message}
    </p>
  );
}