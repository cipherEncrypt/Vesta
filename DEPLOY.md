# Deploy Vesta (GitHub + Vercel)

Use **your** GitHub account and **your** git identity so commits show only you as the author (not Cursor, not a bot). Do the steps below in **Terminal** on your Mac, not through an AI “push for you” flow.

---

## 1. One-time git identity (your name on commits)

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use the same email as your GitHub account if you want contribution credit.

---

## 2. Create the GitHub repo (you)

1. Open [github.com/new](https://github.com/new).
2. Repository name: e.g. `vesta` (or `vesta-near`).
3. **Private** or **Public** — your choice for the hackathon.
4. **Do not** add a README, `.gitignore`, or license (this project already has them).
5. Click **Create repository**.
6. Copy the repo URL, e.g. `https://github.com/YOUR_USER/vesta.git`.

---

## 3. Push this project from your machine

```bash
cd "/Users/macair/Documents/Vesta "

git init -b main

# Sanity check: nothing secret should appear
git status
git check-ignore -v agent/.agent-key.json agent/.env web/.env.local 2>/dev/null || true

git add -A
git status   # confirm no .env, .agent-key.json, or web/.env.local

git commit -m "Vesta: NEAR testnet autopilot savings MVP"

git remote add origin https://github.com/YOUR_USER/vesta.git
git push -u origin main
```

If GitHub asks you to log in, use **SSH** (`git@github.com:YOU/vesta.git`) or **GitHub CLI** (`gh auth login` then `gh repo create` + push).

**Never commit:** `agent/.agent-key.json`, `agent/.env`, `web/.env.local`, real private keys.

---

## 4. Deploy the web app on Vercel

### Import from GitHub

1. [vercel.com/new](https://vercel.com/new) → **Import** your `vesta` repo.
2. **Root Directory:** click **Edit** → set to **`web`**.
3. Vercel should detect **Next.js**. This repo sets `web/vercel.json` so install runs from the monorepo root (`cd .. && npm install`).
4. **Environment variables** (Production + Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_NEAR_NETWORK` | `testnet` |
| `NEXT_PUBLIC_NEAR_RPC_URL` | `https://rpc.testnet.near.org` or your RPC |
| `NEXT_PUBLIC_VESTA_VAULT_ACCOUNT_ID` | Your deployed vault, e.g. `dev-7706-30240.cipher22.testnet` |
| `NEXT_PUBLIC_GITHUB_URL` | `https://github.com/YOUR_USER/vesta` (optional, landing footer) |

Do **not** put agent private keys in Vercel unless you fully understand the risk.

5. **Deploy**.

### What works on Vercel vs locally

| Feature | Vercel | Local `npm run demo` |
|---------|--------|----------------------|
| Landing, connect wallet, view vault | Yes | Yes |
| Deposit / withdraw (wallet signs) | Yes | Yes |
| Save rule / bills / activity file APIs | Limited (no persistent `agent/data` on serverless) | Yes |
| **Run today's save now** / background agent | No (needs local agent + key) | Yes |

For the **full judge demo** (autopilot + activity), keep running `npm run demo` locally and use Vercel for the **public landing + wallet + vault UI** link.

---

## 5. Optional: GitHub CLI one-shot

If you use `gh` and want to create the repo from the terminal (still **your** account):

```bash
cd "/Users/macair/Documents/Vesta "
git init -b main
git add -A && git commit -m "Vesta: NEAR testnet autopilot savings MVP"
gh repo create vesta --private --source=. --remote=origin --push
```

Change `--private` to `--public` if you want it public.

---

## Troubleshooting

- **Vercel build fails on install:** Confirm Root Directory is `web` and `web/vercel.json` is in the repo.
- **Wallet shows wrong network:** `NEXT_PUBLIC_NEAR_NETWORK=testnet` on Vercel.
- **Vault balances empty / 502:** Check `NEXT_PUBLIC_VESTA_VAULT_ACCOUNT_ID` and RPC URL.
- **Cursor as co-author on GitHub:** That usually means commits were made by an automated environment. Re-commit and push from your Terminal with your `git config user.*` as in step 1.