"use client";

import Link from "next/link";
import { useVesta } from "@/components/vesta/VestaDataProvider";
import { StatCards } from "@/components/vesta/AppShell";
import { RunList } from "@/components/vesta/RunList";

export function OverviewView() {
  const {
    fetching,
    savings,
    nextSave,
    dailySaveLine,
    successfulRuns,
    nearUsd,
    pending,
    runSaveNow,
  } = useVesta();
  const preview = successfulRuns.slice(0, 3);

  return (
    <div className="app-page">
      <section className="app-section" aria-labelledby="overview-stats">
        <h2 id="overview-stats" className="section-heading">
          Overview
        </h2>
        {fetching && <p className="hint">Fetching latest vault state…</p>}
        {dailySaveLine ? (
          <p className="daily-save-line">{dailySaveLine}</p>
        ) : null}
        <p className="saved-so-far-banner">
          Vesta saved <strong>{savings.near}</strong>
          {savings.usd ? <span> ({savings.usd})</span> : null} so far
        </p>
        <StatCards />
        <article className="app-card autopilot-card">
          <span className="autopilot-status-pill">
            <span aria-hidden="true" />
            Autopilot on
          </span>
          <p className="autopilot-card-detail">· {nextSave}</p>
        </article>
        <div className="demo-run-block">
          <button
            type="button"
            className="secondary demo-run-btn"
            disabled={pending !== null}
            onClick={() => void runSaveNow()}
          >
            {pending === "runNow"
              ? "Running today's save…"
              : "Run today's save now"}
          </button>
          <p className="hint demo-run-hint">
            Uses the agent function-call key only, not your wallet signature.
          </p>
        </div>
      </section>

      <section className="app-section" aria-labelledby="overview-recent">
        <div className="section-heading-row">
          <h2 id="overview-recent" className="section-heading">
            Recent saves
          </h2>
          <Link className="text-link" href="/app/activity">
            View all →
          </Link>
        </div>
        <div className="app-card">
          <RunList
            runs={preview}
            nearUsd={nearUsd}
            compact
            emptyMessage="No saves yet. Add spending money in Settings; Vesta saves each day on autopilot."
          />
        </div>
      </section>
    </div>
  );
}