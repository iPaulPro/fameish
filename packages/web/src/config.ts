import { EnvironmentConfig, mainnet, testnet } from "@lens-protocol/react";
import { chains } from "@lens-chain/sdk/viem";
import { Chain } from "viem";

interface Config {
  lens: {
    isTestnet: boolean;
    environment: EnvironmentConfig;
    chain: Chain;
  };
}

const config: Config = {
  lens: {
    isTestnet: Boolean(process.env.NEXT_PUBLIC_LENS_USE_TESTNET),
    environment: process.env.NEXT_PUBLIC_LENS_USE_TESTNET ? testnet : mainnet,
    chain: process.env.NEXT_PUBLIC_LENS_USE_TESTNET ? chains.testnet : chains.mainnet,
  },
};

export default config;
