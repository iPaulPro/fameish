import * as dotenv from "dotenv";
dotenv.config();

import "@matterlabs/hardhat-zksync";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";

import { HardhatUserConfig } from "hardhat/config";

// If not set, it uses the hardhat account 0 private key.
const deployerPrivateKey =
  process.env.DEPLOYER_PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// If not set, it uses the hardhat account 1 private key.
export const accountManagerPrivateKey =
  process.env.ACCOUNT_MANAGER_PRIVATE_KEY ?? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
  },
  zksolc: {
    version: "latest",
    settings: {
      codegen: "yul",
    },
  },
  defaultNetwork: "inMemoryNode",
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    hardhat: {
      zksync: true,
    },
    inMemoryNode: {
      url: "http://127.0.0.1:8011",
      ethNetwork: "localhost", // in-memory node doesn't support eth node; removing this line will cause an error
      zksync: true,
      accounts: [deployerPrivateKey, accountManagerPrivateKey],
    },
    lensTestnet: {
      url: "https://rpc.testnet.lens.dev",
      chainId: 37111,
      zksync: true,
      ethNetwork: "sepolia",
      verifyURL: "https://api-explorer-verify.staging.lens.zksync.dev/contract_verification",
      enableVerifyURL: true,
      accounts: [deployerPrivateKey],
    },
    lensMainnet: {
      chainId: 232,
      url: "https://rpc.lens.xyz/",
      zksync: true,
      verifyURL: "https://verify.lens.xyz/contract_verification",
      enableVerifyURL: true,
      accounts: [deployerPrivateKey],
    },
  },
};

export default config;
