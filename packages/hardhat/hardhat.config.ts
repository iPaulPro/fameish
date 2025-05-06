import * as dotenv from "dotenv";
import path from "path";

const envFileName =
  !process.env.NODE_ENV || process.env.NODE_ENV === "production" ? ".env" : `.env.${process.env.NODE_ENV}`;
const envFile = path.resolve(process.cwd(), envFileName);
dotenv.config({ path: envFile });

import "@matterlabs/hardhat-zksync";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";

import { HardhatUserConfig } from "hardhat/config";

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
  },
  zksolc: {
    version: "latest",
    settings: {},
  },
  defaultNetwork: "localhost",
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    hardhat: {
      zksync: true,
    },
    localhost: {
      url: "http://127.0.0.1:8011",
      ethNetwork: "localhost", // in-memory node doesn't support eth node; removing this line will cause an error
      zksync: true,
      ...(deployerPrivateKey ? { accounts: [deployerPrivateKey] } : {}),
    },
    lensTestnet: {
      url: 'https://rpc.testnet.lens.dev',
      chainId: 37111,
      zksync: true,
      ethNetwork: 'sepolia',
      verifyURL: 'https://api-explorer-verify.staging.lens.zksync.dev/contract_verification',
      enableVerifyURL: true,
    },
    lensMainnet: {
      chainId: 232,
      url: "https://rpc.lens.dev/",
      zksync: true,
      verifyURL: "https://api-explorer-verify.lens.matterhosted.dev/contract_verification",
      enableVerifyURL: true,
    },
  }
};

export default config;
