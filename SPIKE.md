# Step 0 — Security spike

## SDK change vs brief (important)

| Brief | This repo |
|--------|-----------|
| `contract/` + **near-sdk-js** | **`near-sdk-rs`** via [cargo-near](https://github.com/near/cargo-near) |

Reasons (per [NEAR docs](https://docs.near.org/smart-contracts/quickstart)):

1. **near-sdk-js is deprecated** on GitHub (use **near-sdk-rs** for new contracts).
2. The JS SDK’s macOS build toolchain ships **x86_64-only** `clang`/`wasi-sdk`; on **Apple Silicon** WASM builds fail without a separate x86 environment.

Agent + web remain JavaScript (`near-api-js`).

## Local sandbox (`npm run spike`)

```bash
npm install
npm run build:contract
npm run spike
```

Uses **near-workspaces** sandbox when it works. **Known issue:** current `near-sandbox` (protocol **77**) may not load **near-sdk 5.17+** WASM (protocol **85**) — you'll see `PrepareError: Deserialization`. If that happens, use **testnet** below (matches the brief's deploy target anyway).

When sandbox works, it checks:

1. Valid `auto_save` moves `spending` → `savings`
2. Over-`max_per_run` `auto_save` fails
3. Owner function-call key (`method_names: ["auto_save"]`) **cannot** call `withdraw` — rejected by the protocol

See [Access keys](https://docs.near.org/protocol/access-keys).

## Testnet

```bash
export SPIKE_ACCOUNT_ID=alice.testnet
export SPIKE_PRIVATE_KEY=ed25519:5Fg2...   # full key string — do not paste "ed25519:..." from the docs
npm run spike:testnet
```

The script uses **your** account via an in-memory key store (it does not read `you.testnet` placeholders or near-workspaces’ default filesystem keystore).

After step 0 passes, continue with agent → frontend → dashboard.
