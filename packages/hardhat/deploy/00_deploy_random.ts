import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync";
import { verifyZkDeployedContract } from "../lib/utils";

const deployFameishRandom = async function (hre: HardhatRuntimeEnvironment) {
    const wallet = await hre.deployer.getWallet(0);

    // Create deployer object and load the artifact of the contract we want to deploy.
    const deployer = new Deployer(hre, wallet);

    // Load contract
    const artifact = await deployer.loadArtifact("FameishRandom");

    const contract = await deployer.deploy(artifact);
    const address = await contract.getAddress();
    console.log("FameishRandom deployed to:", address);

    await verifyZkDeployedContract({
        address,
        artifact,
        constructorArguments: [],
    });
};

export default deployFameishRandom;

deployFameishRandom.tags = ["AccountVerificationAction"];
