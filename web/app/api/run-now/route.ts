import { execFile } from "node:child_process";
import { agentPackageRoot } from "@/lib/agent-root";
import { agentProcessEnv } from "@/lib/agent-env";

export const dynamic = "force-dynamic";

type CliResult = {
  ok: boolean;
  entry?: {
    skipped?: boolean;
    reason?: string;
    error?: string;
    amount?: string | null;
    txHash?: string | null;
    timestamp?: string;
  };
  error?: string;
};

function parseCliStdout(stdout: string): CliResult | null {
  const line = stdout.trim().split("\n").pop() ?? "";
  if (!line) return null;
  try {
    return JSON.parse(line) as CliResult;
  } catch {
    return null;
  }
}

function runAgentCli(
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      ["src/run-once-cli.mjs"],
      {
        cwd,
        env,
        maxBuffer: 2 * 1024 * 1024,
        timeout: 120_000,
      },
      (error, stdout, stderr) => {
        const code = (() => {
          if (!error) return 0;
          const e = error as NodeJS.ErrnoException & { status?: number };
          if (typeof e.status === "number") return e.status;
          if (typeof e.code === "number") return e.code;
          return 1;
        })();
        resolve({
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
          code,
        });
      },
    );
  });
}

export async function POST() {
  const cwd = agentPackageRoot();
  const env = agentProcessEnv();

  const { stdout, stderr, code } = await runAgentCli(cwd, env);
  const parsed = parseCliStdout(stdout);

  if (parsed?.ok && parsed.entry) {
    return Response.json(parsed.entry, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (parsed && !parsed.ok) {
    return Response.json(
      { error: parsed.error ?? "Agent run failed." },
      { status: 500 },
    );
  }

  const fallback =
    stderr.trim() ||
    stdout.trim() ||
    (code !== 0
      ? "Agent CLI failed. Set VESTA_OWNER_ACCOUNT_ID and agent/.agent-key.json (or VESTA_AGENT_PRIVATE_KEY)."
      : "Could not parse agent response.");

  return Response.json({ error: fallback }, { status: 500 });
}