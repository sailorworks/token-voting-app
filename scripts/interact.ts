// token-voting-app/scripts/interact.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import VotingTokenABI from "../artifacts/contracts/Token.sol/VotingToken.json";
import VotingABI from "../artifacts/contracts/Voting.sol/Voting.json";

async function logProposalDetails(voting: any, proposalIndex: number) {
  const [name, votesFor, votesAgainst] =
    await voting.getProposal(proposalIndex);
  console.log(
    `Proposal ${proposalIndex}: ${name}
    Votes For: ${votesFor.toString()}
    Votes Against: ${votesAgainst.toString()}`,
  );
}

async function logUserBalance(
  votingToken: any,
  address: string,
  label: string,
) {
  try {
    const balance = await votingToken.balanceOf(address);
    console.log(`${label} balance: ${balance.toString()} VOTE`);
  } catch (error) {
    console.error(`Error getting balance for ${label}:`, error);
  }
}

async function main() {
  // Load deployed contract addresses
  const addressesPath = path.join(__dirname, "deployed-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error(
      "Please run deploy.ts first to generate contract addresses",
    );
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  console.log("Loaded addresses:", addresses);

  // Get signers
  const [owner, voter1, voter2, voter3] = await ethers.getSigners();
  console.log("\nAccounts:");
  console.log("Owner:", owner.address);
  console.log("Voter1:", voter1.address);
  console.log("Voter2:", voter2.address);
  console.log("Voter3:", voter3.address);

  // Create contract instances
  const votingToken = await ethers.getContractAt(
    "VotingToken",
    addresses.votingToken,
  );
  const voting = await ethers.getContractAt("Voting", addresses.voting);

  console.log("\n--- Initial State ---");
  await logUserBalance(votingToken, owner.address, "Owner");

  // Claim tokens for voters
  const voters = [voter1, voter2, voter3];
  for (let i = 0; i < voters.length; i++) {
    try {
      const tx = await votingToken.connect(voters[i]).claimTokens();
      await tx.wait();
      console.log(`\nVoter${i + 1} claimed tokens successfully`);
      await logUserBalance(votingToken, voters[i].address, `Voter${i + 1}`);
    } catch (error: any) {
      console.log(`Voter${i + 1} token claim failed:`, error.message);
    }
  }

  // Check voting period status
  const isActive = await voting.isVotingActive();
  console.log("\nVoting period active:", isActive);

  // Display initial proposal state
  console.log("\n--- Initial Proposals State ---");
  const proposalCount = await voting.getProposalsCount();
  for (let i = 0; i < proposalCount; i++) {
    await logProposalDetails(voting, i);
  }

  // Execute voting scenarios
  console.log("\n--- Executing Votes ---");

  // Scenario 1: Voter1 votes FOR proposal 0
  try {
    const tx = await voting.connect(voter1).vote(0, true);
    await tx.wait();
    console.log("Voter1 successfully voted FOR proposal 0");
    await logProposalDetails(voting, 0);
  } catch (error: any) {
    console.error("Voter1 voting failed:", error.message);
  }

  // Scenario 2: Voter2 votes AGAINST proposal 0
  try {
    const tx = await voting.connect(voter2).vote(0, false);
    await tx.wait();
    console.log("Voter2 successfully voted AGAINST proposal 0");
    await logProposalDetails(voting, 0);
  } catch (error: any) {
    console.error("Voter2 voting failed:", error.message);
  }

  // Scenario 3: Attempt double voting (should fail)
  try {
    const tx = await voting.connect(voter1).vote(0, false);
    await tx.wait();
    console.log("WARNING: Double voting succeeded (shouldn't happen)");
  } catch (error: any) {
    console.log("Expected error - Double voting prevented:", error.message);
  }

  // Final state
  console.log("\n--- Final State ---");
  console.log("\nVoting Status:");
  for (let i = 0; i < proposalCount; i++) {
    await logProposalDetails(voting, i);
  }

  // Check total votes
  const [totalFor, totalAgainst] = await voting.getTotalVotes();
  console.log("\nTotal Votes:");
  console.log(`Total FOR: ${totalFor.toString()} VOTE`);
  console.log(`Total AGAINST: ${totalAgainst.toString()} VOTE`);

  // Check voting status for each account
  console.log("\nVoting Status by Account:");
  for (let i = 0; i < voters.length; i++) {
    const hasVoted = await voting.hasUserVoted(voters[i].address);
    console.log(`Voter${i + 1} has voted: ${hasVoted}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in main execution:", error);
    process.exit(1);
  });
