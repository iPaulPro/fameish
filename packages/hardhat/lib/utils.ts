import * as hre from "hardhat";
import { ethers } from "ethers";
import { ZkSyncArtifact } from "@matterlabs/hardhat-zksync-deploy/dist/types";

/**
 * @param {string} data.contract The contract's path and name. E.g., "contracts/Greeter.sol:Greeter"
 */
export const verifyContract = async (data: {
    address: string;
    contract: string;
    constructorArguments: string;
    bytecode: string;
}) => {
    // Skip verification for local networks
    if (hre.network.name === "inMemoryNode" || hre.network.name === "zkstackMigrationNode") {
        console.log("Skipping contract verification on local network");
        return 0;
    }
    const verificationRequestId: number = await hre.run("verify:verify", {
        ...data,
        noCompile: true,
    });
    return verificationRequestId;
};

export const verifyZkDeployedContract = async (data: {
    address: string;
    artifact: ZkSyncArtifact;
    constructorArguments: any[];
}) => {
    const contractToVerify = new ethers.Contract(data.address, data.artifact.abi);
    return verifyContract({
        address: data.address,
        contract: `${data.artifact.sourceName}:${data.artifact.contractName}`,
        constructorArguments: contractToVerify.interface.encodeDeploy(data.constructorArguments),
        bytecode: data.artifact.bytecode,
    });
};