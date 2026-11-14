import { AppGate } from "@/components/vesta/AppGate";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppGate>{children}</AppGate>;
}