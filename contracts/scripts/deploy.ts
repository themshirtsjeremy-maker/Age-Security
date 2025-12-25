import { ethers } from "hardhat";

async function main() {
  console.log("Deploying AgeVerification contract...");

  const AgeVerification = await ethers.getContractFactory("AgeVerification");
  const contract = await AgeVerification.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`AgeVerification deployed to: ${address}`);
  console.log(`Verify with: npx hardhat verify --network sepolia ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

