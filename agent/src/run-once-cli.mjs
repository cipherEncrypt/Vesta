import { executeAutoSaveOnce } from "./run-once.mjs";

try {
  const entry = await executeAutoSaveOnce();
  process.stdout.write(`${JSON.stringify({ ok: true, entry })}\n`);
  process.exit(0);
} catch (err) {
  const message = String(err?.message ?? err);
  process.stdout.write(`${JSON.stringify({ ok: false, error: message })}\n`);
  process.exit(1);
}