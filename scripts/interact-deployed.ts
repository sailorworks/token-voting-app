// scripts/interact-deployed.ts (Example for Sepolia)
import { ethers } from "hardhat";

async function main() {
  // Replace with your *deployed* contract addresses on Sepolia (or other network)
  const VOTING_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; //Your deployed token address
  const VOTING_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Your deployed voting address

  // Get contract instances
  const votingToken = await ethers.getContractAt(
    "VotingToken",
    VOTING_TOKEN_ADDRESS,
  );
  const voting = await ethers.getContractAt("Voting", VOTING_CONTRACT_ADDRESS);

  // Get proposal count
  const proposalCount = await voting.getProposalsCount();
  console.log("Number of proposals:", proposalCount);

  // Get first proposal details
  const [name, voteCount] = await voting.getProposal(0);
  console.log("First proposal:", name, "with", voteCount.toString(), "votes");

  // Get the signer
  const [owner] = await ethers.getSigners();

  // Check token balance
  const balance = await votingToken.balanceOf(owner.address);
  console.log("Owner token balance:", ethers.formatEther(balance));

  // Vote for proposal 0 (adjust as needed)
  try {
    const tx = await voting.vote(0);
    const receipt = await tx.wait(); // Wait for the transaction to be mined
    console.log("Voted for proposal 0. Transaction hash:", receipt?.hash);

    // Get updated proposal details
    const [updatedName, updatedVoteCount] = await voting.getProposal(0);
    console.log(
      `Updated votes for ${updatedName}: ${updatedVoteCount.toString()}`,
    );
  } catch (error) {
    console.error("Error voting:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
