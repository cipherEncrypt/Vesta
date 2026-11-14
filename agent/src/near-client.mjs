import { connect, keyStores, utils } from "near-api-js";
import { parseNearAmount } from "near-api-js/lib/utils/format.js";

const TGAS = 30n * 10n ** 12n;

export async function connectAgent({ networkId, nodeUrl, ownerAccountId, agentPrivateKey }) {
  const keyPair = utils.KeyPair.fromString(agentPrivateKey);
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(networkId, ownerAccountId, keyPair);

  const near = await connect({ networkId, nodeUrl, keyStore });
  const account = await near.account(ownerAccountId);
  return { near, account };
}

export async function viewVaultState(account, vaultAccountId) {
  return account.viewFunction({
    contractId: vaultAccountId,
    methodName: "get_state",
    args: {},
  });
}

export function pickSaveAmountYocto(state, saveAmountNear) {
  const configured = BigInt(parseNearAmount(saveAmountNear));
  const maxPerRun = BigInt(state.maxPerRun);
  const spending = BigInt(state.spending);
  let amount = configured;
  if (amount > maxPerRun) amount = maxPerRun;
  if (amount > spending) amount = spending;
  if (amount <= 0n) return null;
  return amount.toString();
}

export async function callAutoSave(account, vaultAccountId, amountYocto) {
  return account.functionCall({
    contractId: vaultAccountId,
    methodName: "auto_save",
    args: { amount: amountYocto },
    gas: TGAS,
    attachedDeposit: 0n,
  });
}

export function txHashFromOutcome(outcome) {
  return (
    outcome?.transaction?.hash ??
    outcome?.transaction_outcome?.id ??
    outcome?.transaction_outcome?.outcome?.receipt_ids?.[0] ??
    null
  );
}