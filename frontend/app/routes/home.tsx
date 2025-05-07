// frontend/app/routes/home.tsx
import type { Route } from "./+types/home";
import { ethers } from "ethers";
import VotingABI from "../../../artifacts/contracts/Voting.sol/Voting.json";
import TokenABI from "../../../artifacts/contracts/Token.sol/VotingToken.json";
import React, { useState, useEffect } from "react";
import UserProfile from "~/components/dashboard/UserProfile";
import ActiveCampaigns from "~/components/dashboard/ActiveCampaigns";

class MetamaskNotFoundError extends Error {
  constructor(message?: string) {
    super(message || "MetaMask not detected");
    this.name = "MetamaskNotFoundError";
  }
}

// Custom Error for user rejection
class UserRejectedRequestError extends Error {
  constructor(message?: string) {
    super(message || "User denied transaction signature");
    this.name = "UserRejectedRequestError";
  }
}

// Custom Error for Contract Not Deployed
class ContractNotDeployedError extends Error {
  constructor(message?: string) {
    super(message || "Contract not deployed at the specified address");
    this.name = "ContractNotDeployedError";
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [votingContract, setVotingContract] = useState<ethers.Contract | null>(
    null
  );
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(
    null
  );
  const [proposals, setProposals] = useState<
    { name: string; voteCount: string }[]
  >([]);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    async function init() {
      const { ethereum } = window as any;
      if (!ethereum) {
        console.error("MetaMask is not installed!");
        setErrorMessage("MetaMask is not installed.  Please install MetaMask.");
        setIsLoading(false);
        throw new MetamaskNotFoundError(); // Throw custom error
        return;
      }

      try {
        await ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(ethereum);
        setProvider(provider);
        const signer = await provider.getSigner();
        setSigner(signer);

        const votingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
        const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

        console.log("Initializing contracts with addresses:", {
          votingAddress,
          tokenAddress,
        });

        const votingContract = new ethers.Contract(
          votingAddress,
          VotingABI.abi,
          signer
        );
        const tokenContract = new ethers.Contract(
          tokenAddress,
          TokenABI.abi,
          signer
        );

        // Verify contracts are properly initialized
        const code = await provider.getCode(votingAddress);
        if (code === "0x") {
          setErrorMessage("Voting contract not deployed at specified address.");
          setIsLoading(false);
          throw new ContractNotDeployedError(
            "Voting contract not deployed at specified address"
          ); // Throw custom error
          return; // Early return on error.
        }

        setVotingContract(votingContract);
        setTokenContract(tokenContract);
        setAccount(await signer.getAddress());
      } catch (error: any) {
        console.error("Initialization error:", error);
        if (error.code === 4001) {
          setErrorMessage("User denied account access.");
        } else {
          setErrorMessage(
            "Failed to initialize.  Please check the console for details, or ensure your MetaMask is correctly configured."
          );
        }
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        if (!votingContract || !tokenContract) {
          console.warn("Voting contract or Token contract is not set up yet.");
          //Don't set the error message here.  The previous useEffect block handles initial setup errors.
          return;
        }

        console.log("Fetching proposal count...");
        const proposalCount = await votingContract.getProposalsCount();
        console.log("Proposal count:", proposalCount);

        const proposalsData = [];
        for (let i = 0; i < proposalCount; i++) {
          console.log(`Fetching proposal ${i}...`);
          const [name, voteCount] = await votingContract.getProposal(i);
          proposalsData.push({ name, voteCount: voteCount.toString() });
          console.log(`Proposal ${i}:`, name, voteCount.toString());
        }
        setProposals(proposalsData);

        console.log("Fetching balance...");
        const bal = await tokenContract.balanceOf(account);
        console.log("Balance:", bal);
        setBalance(ethers.formatEther(bal));
      } catch (err: any) {
        console.error("[loadData] Error loading data:", err);
        setErrorMessage(
          "Unable to load voting data. Please check the console for details."
        );
      } finally {
        setIsLoading(false); // Set isLoading to false after loading data, whether successful or not
      }
    }

    if (account && votingContract && tokenContract) {
      loadData();
    }
  }, [votingContract, tokenContract, account]);

  async function handleVote(proposalIndex: number) {
    if (!votingContract) {
      console.error("Voting contract not initialized.");
      setErrorMessage(
        "Voting contract is not available. Please try again later."
      );
      return;
    }

    setIsVoting(true); // Disable button during voting process
    try {
      const tx = await votingContract.vote(proposalIndex);
      console.log("Transaction submitted:", tx);

      // Wait for the transaction to be mined
      await tx.wait();
      console.log(`Voted for proposal index: ${proposalIndex}`);

      // Reload proposals *after* the vote has been mined.
      try {
        const proposalCount = await votingContract.getProposalsCount();
        const updatedProposalsData = [];
        for (let i = 0; i < proposalCount; i++) {
          const [name, voteCount] = await votingContract.getProposal(i);
          updatedProposalsData.push({ name, voteCount: voteCount.toString() });
        }
        setProposals(updatedProposalsData);
      } catch (reloadError) {
        console.error(
          "[handleVote -> reload] Error reloading proposals:",
          reloadError
        );
        setErrorMessage("Voted successfully, but failed to reload proposals.");
      }
    } catch (error: any) {
      console.error("[handleVote] Error voting:", error);
      if (error.code === 4001) {
        // User denied transaction signature
        setErrorMessage("Transaction signature denied.");
        throw new UserRejectedRequestError(); // Throw the custom error.
      } else {
        // Other errors
        setErrorMessage(
          "Voting failed. Please check the console for details or try again."
        );
      }
    } finally {
      setIsVoting(false); // Re-enable the button
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">VoteChain</h1>
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar with User Profile */}
          <div className="lg:col-span-1">
            <UserProfile address={account} tokenContract={tokenContract} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <ActiveCampaigns
              votingContract={votingContract}
              address={account}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 VoteChain. All rights reserved.
            </p>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
