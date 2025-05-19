import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync";
import { verifyZkDeployedContract, loadAddressBook, saveContractToAddressBook } from "../lib/utils";
import { accountManagerPrivateKey } from "../hardhat.config";

const deployFameish = async function (hre: HardhatRuntimeEnvironment) {
  console.log('Starting deployment process of "Fameish"...');
  const wallet = await hre.deployer.getWallet(0);
  const deployer = new Deployer(hre, wallet);
  const addressBook = loadAddressBook();

  let accountManagerAddress: string;
  if (process.env.ACCOUNT_MANAGER_PRIVATE_KEY) {
    const accountManagerWallet = await hre.deployer.getWallet(accountManagerPrivateKey);
    accountManagerAddress = accountManagerWallet.address;
  } else {
    const signerWallet = await hre.deployer.getWallet(1);
    accountManagerAddress = signerWallet.address;
  }

  const lensGraphAddress = process.env.LENS_GRAPH_ADDRESS ?? addressBook["LensGlobalGraph"]?.address;
  if (!lensGraphAddress) {
    throw new Error("LensGlobalGraph address not found in address book or environment variable");
  }

  const fameishRandomAddress = process.env.FAMEISH_RANDOM_ADDRESS ?? addressBook["FameishRandom"]?.address;
  if (!fameishRandomAddress) {
    throw new Error("FameishRandom address not found in address book or environment variable");
  }

  const artifact = await deployer.loadArtifact("Fameish");
  const contract = await deployer.deploy(artifact, [accountManagerAddress, lensGraphAddress, fameishRandomAddress]);
  const address = await contract.getAddress();
  console.log("Fameish deployed to:", address);

  saveContractToAddressBook({
    contractName: "Fameish",
    address,
  });

  if (hre.network.verifyURL) {
    await verifyZkDeployedContract({
      address,
      artifact,
      constructorArguments: [accountManagerAddress, lensGraphAddress, fameishRandomAddress],
    });
  }
};

export default deployFameish;

deployFameish.tags = ["Fameish"];
