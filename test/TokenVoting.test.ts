// test/TokenVoting.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Token Voting", function () {
  async function deployContracts() {
    // Get signers
    const [owner, voter1, voter2] = await ethers.getSigners();

    // Deploy VotingToken
    const VotingToken = await ethers.getContractFactory("VotingToken");
    const votingToken = await VotingToken.deploy(ethers.parseEther("1000"));

    // Deploy Voting contract
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy(await votingToken.getAddress(), [
      "Proposal 1",
      "Proposal 2",
      "Proposal 3",
    ]);

    return { votingToken, voting, owner, voter1, voter2 };
  }

  it("Should deploy contracts correctly", async function () {
    const { votingToken, voting, owner } = await deployContracts();

    // Check initial token balance
    expect(await votingToken.balanceOf(owner.address)).to.equal(
      ethers.parseEther("1000"),
    );

    // Check proposals count
    expect(await voting.getProposalsCount()).to.equal(3);
  });

  it("Should allow voting with tokens", async function () {
    const { votingToken, voting, owner, voter1 } = await deployContracts();

    // Transfer some tokens to voter1
    await votingToken.transfer(voter1.address, ethers.parseEther("100"));

    // Approve voting contract to spend tokens (if needed)
    await votingToken
      .connect(voter1)
      .approve(await voting.getAddress(), ethers.parseEther("100"));

    // Vote for proposal 0
    await voting.connect(voter1).vote(0);

    // Check proposal votes
    const [, voteCount] = await voting.getProposal(0);
    expect(voteCount).to.equal(ethers.parseEther("100"));
  });
});
