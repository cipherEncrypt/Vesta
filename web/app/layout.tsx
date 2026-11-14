import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WalletProvider } from "@/components/WalletProvider";
import "./globals.css";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vesta | savings on autopilot",
  description: "Money that saves itself on NEAR testnet.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={body.variable}>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}