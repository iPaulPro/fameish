import { http, createConfig } from "wagmi";
import { chains } from "@lens-chain/sdk/viem";
import { getDefaultConfig } from "connectkit";
import appConfig from "@/src/config";

export const config = createConfig(
  getDefaultConfig({
    chains: [appConfig.lens.chain],
    transports: {
      [chains.mainnet.id]: http(`https://lens-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
      [chains.testnet.id]: http(`https://lens-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
    },

    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,

    appName: "Fameish",
    appUrl: "https://fameish.day/",
  }),
);
