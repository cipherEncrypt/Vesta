"use client";

import { useWallet } from "@/components/WalletProvider";
import { LANDING_GITHUB_URL } from "@/lib/constants";

const FAQ_ITEMS = [
  {
    q: "Do I give Vesta my private keys?",
    a: "No. You grant a restricted key that can only save. Your real key never leaves your wallet.",
  },
  {
    q: "Can the agent steal my money?",
    a: "No. It can only move funds into your savings. Withdrawals are owner-only.",
  },
  {
    q: "Is my money locked up?",
    a: "No. You can withdraw anytime.",
  },
  {
    q: "What does it cost to try?",
    a: "It runs on NEAR testnet, so no real funds are involved.",
  },
] as const;

const FEATURES = [
  {
    title: "Saves on autopilot",
    body: "Set it once; it runs on its own.",
  },
  {
    title: "Can't be drained",
    body: "The agent holds a restricted key that can only save. The chain blocks everything else.",
  },
  {
    title: "In dollars, not crypto",
    body: "Set amounts in USD. No yocto, no gas, no seed phrases to manage.",
  },
  {
    title: "Bills, covered",
    body: "Reserve toward recurring bills; Vesta tells you the moment each one’s funded.",
  },
] as const;

export function VestaLanding() {
  const { connect } = useWallet();

  return (
    <main className="landing">
      <header className="site-header landing-header-minimal">
        <a className="wordmark" href="/" aria-label="Vesta home">
          <span className="vesta-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Vesta
        </a>
        <button type="button" className="primary" onClick={connect}>
          Connect wallet
        </button>
      </header>

      <section className="landing-hero" aria-labelledby="landing-headline">
        <p className="landing-eyebrow">On NEAR · testnet</p>
        <h1 id="landing-headline">Money that saves itself.</h1>
        <p className="landing-lede">
          Set one rule. Vesta’s agent moves a little into savings for you
          automatically, every day. You never sign a transfer, and it can never
          be drained.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary" onClick={connect}>
            Connect wallet
          </button>
          <a className="ghost hero-secondary" href="#how-it-works">
            See how it works
          </a>
        </div>
        <p className="security-pill hero-trust-pill">
          🔒 Non-custodial. You always hold the keys
        </p>

        <div className="product-stage" aria-label="Vesta product preview">
          <div className="cloud cloud-left" aria-hidden="true" />
          <div className="cloud cloud-right" aria-hidden="true" />
          <div className="float-pill float-pill-left">
            <span aria-hidden="true">✦</span>
            Saves automatically
          </div>
          <div className="float-pill float-pill-right">
            <span aria-hidden="true">◎</span>
            Owner-only withdrawals
          </div>

          <div className="mockup-card mockup-card-tilted" aria-hidden="true">
            <div className="mockup-topbar">
              <strong>Vesta</strong>
              <span>Testnet</span>
            </div>
            <p className="mockup-label">Savings</p>
            <p className="mockup-balance">1.2400 NEAR</p>
            <p className="mockup-usd">≈ $4.34</p>
            <div className="mockup-rule">
              <span>Save each run</span>
              <strong>0.0200 NEAR</strong>
            </div>
            <div className="mockup-button">Withdraw savings</div>
          </div>

          <div className="mockup-card mockup-card-main" aria-hidden="true">
            <div className="mockup-topbar">
              <strong>Vesta</strong>
              <span className="mockup-live">● Autopilot on</span>
            </div>
            <p className="mockup-label">Total in vault</p>
            <p className="mockup-balance">4.7600 NEAR</p>
            <p className="mockup-usd">≈ $16.66</p>
            <div className="mockup-split">
              <div>
                <span>Spending</span>
                <strong>3.5200</strong>
              </div>
              <div>
                <span>Savings</span>
                <strong>1.2400</strong>
              </div>
            </div>
            <div className="mockup-feed">
              <span>✓</span>
              <div>
                <strong>Vesta saved 0.0200 NEAR</strong>
              </div>
            </div>
          </div>
          <div className="stage-shadow" aria-hidden="true" />
        </div>
      </section>

      <section
        className="landing-section how-it-works"
        id="how-it-works"
        aria-labelledby="how-title"
      >
        <h2 id="how-title">How it works</h2>
        <ol className="landing-steps">
          <li>
            <div className="step-top">
              <span>1</span>
            </div>
            <strong>Set a rule</strong>
            <p>
              Connect your wallet and tell Vesta how much to save, in dollars.
            </p>
          </li>
          <li>
            <div className="step-top">
              <span>2</span>
            </div>
            <strong>Vesta saves for you</strong>
            <p>
              An agent quietly moves money into savings on schedule. No signing,
              no gas, no thinking about it.
            </p>
          </li>
          <li>
            <div className="step-top">
              <span>3</span>
            </div>
            <strong>Your money stays yours</strong>
            <p>
              Only you can withdraw. The agent can save, but it can never take
              your money out.
            </p>
          </li>
        </ol>
      </section>

      <section
        className="landing-section landing-features"
        aria-labelledby="features-title"
      >
        <h2 id="features-title">Why Vesta is different</h2>
        <ul className="feature-grid">
          {FEATURES.map((item) => (
            <li key={item.title} className="feature-card">
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="landing-section landing-trust"
        id="safeguards"
        aria-labelledby="trust-title"
      >
        <h2 id="trust-title">How it can’t be drained</h2>
        <div className="landing-trust-card">
          <p>
            Vesta’s agent never holds your keys. It gets a single-purpose key
            that can only run your save rule. It physically cannot withdraw,
            transfer, or send your funds anywhere. That’s enforced by NEAR itself,
            not by trust. We proved it on testnet: when the agent tries to
            withdraw, the network rejects the transaction outright.
          </p>
        </div>
      </section>

      <section className="landing-section landing-faq" aria-labelledby="faq-title">
        <h2 id="faq-title">FAQ</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="faq-details">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-section landing-cta landing-cta-final" aria-label="Get started">
        <h2>Put your money on autopilot.</h2>
        <button type="button" className="primary" onClick={connect}>
          Connect wallet
        </button>
      </section>

      <footer className="landing-footer landing-footer-bar">
        <a className="wordmark" href="/" aria-label="Vesta home">
          <span className="vesta-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Vesta
        </a>
        <nav className="landing-footer-meta" aria-label="Site links">
          <span>Built at NEAR Hackathon</span>
          {LANDING_GITHUB_URL ? (
            <a
              href={LANDING_GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub
            </a>
          ) : (
            <span>GitHub</span>
          )}
          <span>Running on NEAR testnet</span>
        </nav>
      </footer>
    </main>
  );
}