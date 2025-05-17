import { http, createConfig } from "wagmi";
import { chains } from "@lens-chain/sdk/viem";

export const config = createConfig({
  chains: [chains.mainnet, chains.testnet],
  transports: {
    [chains.mainnet.id]: http(`https://lens-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
    [chains.testnet.id]: http(`https://lens-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
  },
});
