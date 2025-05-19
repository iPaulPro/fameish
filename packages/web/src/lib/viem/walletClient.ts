import { createWalletClient, http } from "viem";
import config from "@/src/config";
import { privateKeyToAccount } from "viem/accounts";

const CHAIN_NAME = process.env.NEXT_PUBLIC_LENS_USE_TESTNET ? "sepolia" : "mainnet";

const accountManagerAccount = privateKeyToAccount(process.env.LENS_ACCOUNT_MANAGER_PRIVATE_KEY! as `0x${string}`);

export const walletClient = createWalletClient({
  chain: config.lens.chain,
  transport: http(`https://lens-${CHAIN_NAME}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
  account: accountManagerAccount,
});
