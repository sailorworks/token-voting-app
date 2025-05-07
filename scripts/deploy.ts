// token-voting-app/scripts/deploy.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const VotingToken = await ethers.getContractFactory("VotingToken");
  const votingToken = await VotingToken.deploy(ethers.parseEther("1000"));
  await votingToken.waitForDeployment();
  const tokenAddress = await votingToken.getAddress();
  console.log("Token deployed to:", tokenAddress);

  const testAccounts = await ethers.getSigners();
  console.log("Deployer address:", testAccounts[0].address);
  const deployerBalance = await votingToken.balanceOf(testAccounts[0].address);
  console.log("Deployer balance:", ethers.formatEther(deployerBalance));

  for (let i = 1; i < testAccounts.length && i < 5; i++) {
    await votingToken.transfer(
      testAccounts[i].address,
      ethers.parseEther("100"),
    );
    console.log(`Transferred 100 tokens to: ${testAccounts[i].address}`);
  }

  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(tokenAddress, [
    "Proposal 1",
    "Proposal 2",
    "Proposal 3",
  ]);
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();

  const addresses = {
    votingToken: tokenAddress,
    voting: votingAddress,
  };

  // Use path.join for cross-platform compatibility
  const filePath = path.join(__dirname, "deployed-addresses.json");
  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
  console.log(`Deployment addresses saved to ${filePath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
