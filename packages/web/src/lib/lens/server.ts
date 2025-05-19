import { PublicClient, mainnet, testnet } from "@lens-protocol/react";

export const lensClient = PublicClient.create({
  environment: process.env.NEXT_PUBLIC_LENS_USE_TESTNET ? testnet : mainnet,
});
