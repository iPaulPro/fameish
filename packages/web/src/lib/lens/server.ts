import { PublicClient } from "@lens-protocol/react";
import config from "@/src/config";

export const lensClient = PublicClient.create({
  environment: config.lens.environment,
  origin: "https://fameish.day",
});
