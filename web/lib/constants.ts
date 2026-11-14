export const NETWORK_ID = "testnet" as const;

export const VAULT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_VESTA_VAULT_ACCOUNT_ID ??
  "dev-7706-30240.cipher22.testnet";

export const NODE_URL =
  process.env.NEXT_PUBLIC_NEAR_RPC_URL ?? "https://test.rpc.fastnear.com";

/** Set `NEXT_PUBLIC_GITHUB_URL` in env to enable the landing footer GitHub link. */
export const LANDING_GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL?.trim() ?? "";