import { createPublicClient, http } from "viem";
import { chains } from "@lens-chain/sdk/viem";
import config from "@/src/config";

const CHAIN_NAME = config.lens.isTestnet ? "sepolia" : "mainnet";

export default createPublicClient({
  chain: config.lens.chain,
  transport: http(`https://lens-${CHAIN_NAME}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
});
