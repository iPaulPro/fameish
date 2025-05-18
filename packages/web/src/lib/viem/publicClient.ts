import { createPublicClient, http } from "viem";
import { chains } from "@lens-chain/sdk/viem";

const CHAIN_NAME = process.env.NEXT_PUBLIC_USE_TESTNET ? "sepolia" : "mainnet";

export default createPublicClient({
  chain: process.env.NEXT_PUBLIC_USE_TESTNET ? chains.testnet : chains.mainnet,
  transport: http(`https://lens-${CHAIN_NAME}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
});
