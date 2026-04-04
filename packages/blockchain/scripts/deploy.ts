import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ShoutAloud Smart Contracts...");

  // Deploy ShoutAloudZKVerifier
  const ZKVerifier = await ethers.getContractFactory("ShoutAloudZKVerifier");
  const zkVerifier = await ZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddress = await zkVerifier.getAddress();
  console.log(`✅ ShoutAloudZKVerifier deployed to: ${zkVerifierAddress}`);

  // Deploy ShoutAloudVoting
  const ShoutAloudVoting = await ethers.getContractFactory("ShoutAloudVoting");
  const voting = await ShoutAloudVoting.deploy();
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log(`✅ ShoutAloudVoting deployed to: ${votingAddress}`);

  // Log deployment info
  const [deployer] = await ethers.getSigners();
  console.log(`\n📋 Deployment Summary:`);
  console.log(`   Deployer: ${await deployer.getAddress()}`);
  console.log(`   Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`   ShoutAloudVoting: ${votingAddress}`);
  console.log(`   ShoutAloudZKVerifier: ${zkVerifierAddress}`);

  // Save addresses for frontend
  console.log(`\n📝 Add these to your frontend config:`);
  console.log(`   VOTING_CONTRACT_ADDRESS="${votingAddress}"`);
  console.log(`   ZK_VERIFIER_ADDRESS="${zkVerifierAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
