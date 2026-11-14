"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { useWallet } from "@/components/WalletProvider";
import { useVesta } from "@/components/vesta/VestaDataProvider";
import { AppToast } from "@/components/vesta/AppToast";
import { OnboardingModal } from "@/components/vesta/OnboardingModal";
import { yoctoToNearString } from "@/lib/amounts";

const NAV = [
  { href: "/app", label: "Overview", icon: "overview" },
  { href: "/app/bills", label: "Bills", icon: "bills" },
  { href: "/app/activity", label: "Activity", icon: "activity" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
] as const;

function VestaLogo() {
  return (
    <Link className="wordmark app-shell-logo" href="/app" aria-label="Vesta home">
      <span className="vesta-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      Vesta
    </Link>
  );
}

function TabIcon({ icon }: { icon: (typeof NAV)[number]["icon"] }) {
  switch (icon) {
    case "overview":
      return (
        <svg className="app-tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
          />
        </svg>
      );
    case "bills":
      return (
        <svg className="app-tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6 3h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm8 1.5V9h4.5L14 4.5zM8 13h8v2H8v-2zm0 4h5v2H8v-2z"
          />
        </svg>
      );
    case "activity":
      return (
        <svg className="app-tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"
          />
        </svg>
      );
    case "settings":
      return (
        <svg className="app-tab-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8.2 4a7.2 7.2 0 0 1-.1 1l1.7 1.3-1.6 2.8-2-.8a8.4 8.4 0 0 1-1.7 1l-.3 2.1h-3.2l-.3-2.1a8.4 8.4 0 0 1-1.7-1l-2 .8-1.6-2.8 1.7-1.3a7.2 7.2 0 0 1-.1-1 7.2 7.2 0 0 1 .1-1L3.5 9.7l1.6-2.8 2 .8a8.4 8.4 0 0 1 1.7-1L9.1 4.6h3.2l.3 2.1a8.4 8.4 0 0 1 1.7 1l2-.8 1.6 2.8-1.7 1.3c.07.33.1.66.1 1z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  if (href === "/app/bills") return pathname.startsWith("/app/bills");
  return pathname.startsWith(href);
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="app-nav" aria-label="App navigation">
      {NAV.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={
            isNavActive(pathname, href) ? "app-nav-link active" : "app-nav-link"
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { disconnect } = useWallet();
  const { accountId, accountBalance, nextSave } = useVesta();

  const signOut = async () => {
    await disconnect();
    router.push("/");
  };

  const shortAccount =
    accountId && accountId.length > 22
      ? `${accountId.slice(0, 10)}…${accountId.slice(-10)}`
      : accountId;

  const mobileAccount =
    accountId && accountId.length > 16
      ? `${accountId.slice(0, 8)}…${accountId.slice(-7)}`
      : accountId;

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Sidebar">
        <VestaLogo />
        <NavLinks pathname={pathname} />
        <div className="app-sidebar-status">
          <span className="autopilot-status-pill">
            <span aria-hidden="true" />
            Autopilot on
          </span>
          <span className="app-sidebar-next">{nextSave}</span>
        </div>
        <div className="app-sidebar-footer">
          <div className="account-chip account-chip-stacked">
            <span className="mono" title={accountId ?? undefined}>
              {shortAccount}
            </span>
            <strong>{accountBalance.near}</strong>
            {accountBalance.usd && <small>≈ {accountBalance.usd}</small>}
          </div>
          <span className="network-pill">Testnet</span>
          <button
            type="button"
            className="ghost ghost-full"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="app-main-column">
        <header className="app-mobile-header" aria-label="Mobile header">
          <div className="app-mobile-header-top">
            <VestaLogo />
            <div className="app-mobile-header-pills">
              <span className="network-pill network-pill-mobile">Testnet</span>
              <span
                className="autopilot-status-pill autopilot-status-pill-mobile"
                title={nextSave}
              >
                <span aria-hidden="true" />
                Autopilot on
              </span>
            </div>
          </div>
          <p className="app-mobile-account-bar" title={accountId ?? ""}>
            <span className="mono account-id-truncate">{mobileAccount}</span>
            <span className="app-mobile-account-dot" aria-hidden="true">
              ·
            </span>
            <span className="app-mobile-account-balance">
              {accountBalance.near}
            </span>
            {accountBalance.usd ? (
              <span className="app-mobile-account-usd">
                {accountBalance.usd}
              </span>
            ) : null}
          </p>
        </header>

        <header className="app-page-header">
          <div>
            <p className="app-welcome-kicker">Welcome back</p>
            <h1 className="app-welcome-title">
              <span className="mono">{shortAccount}</span>
            </h1>
          </div>
          <span className="network-pill network-pill-desktop">Testnet</span>
        </header>

        <div className="app-content">{children}</div>

        <nav className="app-tabbar" aria-label="Main navigation">
          {NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={
                isNavActive(pathname, href)
                  ? "app-tabbar-link active"
                  : "app-tabbar-link"
              }
            >
              <TabIcon icon={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <OnboardingModal />
      <AppToast />
    </div>
  );
}

export function StatCards() {
  const { fetching, total, spending, savings, vault } = useVesta();

  return (
    <div className="stat-grid">
      <article className="stat-card">
        <span className="stat-label">Total</span>
        <strong className="stat-value">{total.near}</strong>
        {total.usd && <span className="stat-usd">{total.usd}</span>}
        {fetching && !vault && <span className="hint">Loading…</span>}
      </article>
      <article className="stat-card">
        <span className="stat-label">Spending</span>
        <strong className="stat-value">{spending.near}</strong>
        {spending.usd && <span className="stat-usd">{spending.usd}</span>}
        {vault && yoctoToNearString(vault.spending) === 0 && (
          <span className="empty-note">No deposit yet</span>
        )}
      </article>
      <article className="stat-card stat-card-savings">
        <span className="stat-label">Savings</span>
        <strong className="stat-value">{savings.near}</strong>
        {savings.usd && <span className="stat-usd">{savings.usd}</span>}
      </article>
    </div>
  );
}