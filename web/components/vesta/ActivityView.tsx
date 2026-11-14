"use client";

import { useVesta } from "@/components/vesta/VestaDataProvider";
import { RunList } from "@/components/vesta/RunList";

export function ActivityView() {
  const { successfulRuns, nearUsd, runs } = useVesta();

  const hasErrors = runs.some((r) => r.error);

  return (
    <div className="app-page">
      <section className="app-section" aria-labelledby="activity-title">
        <h2 id="activity-title" className="section-heading">
          Activity
        </h2>
        <p className="section-lead">
          Daily autopilot saves from the agent log (plus manual demo runs).
        </p>
        <div className="app-card">
          <RunList
            runs={successfulRuns}
            nearUsd={nearUsd}
            emptyMessage="No saves yet. Add spending money and Vesta will save each day on autopilot."
          />
          {hasErrors ? (
            <p className="hint activity-agent-hint">
              Some runs failed. Check the agent terminal.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}