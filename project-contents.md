

--- File: C:\Users\VOID\Documents\token-voting-app\frontend\app\components\dashboard\ActiveCampaigns.tsx ---
// frontend/app/components/dashboard/ActiveCampaigns.tsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Campaign {
  id: number;
  name: string;
  votesFor: string;
  votesAgainst: string;
}

interface ActiveCampaignsProps {
  votingContract: ethers.Contract | null;
  address: string;
}

export default function ActiveCampaigns({
  votingContract,
  address,
}: ActiveCampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<{
    id: number | null;
    type: "for" | "against" | null;
  }>({ id: null, type: null });

  useEffect(() => {
    loadCampaigns();
  }, [votingContract]);

  async function loadCampaigns() {
    if (!votingContract) return;

    try {
      const count = await votingContract.getProposalsCount();
      const campaignsData: Campaign[] = [];

      for (let i = 0; i < count; i++) {
        const [name, votesFor, votesAgainst] = await votingContract.getProposal(
          i
        );
        console.log(
          `Proposal ${i}: ${name}, Votes For: ${votesFor}, Votes Against: ${votesAgainst}`
        );
        campaignsData.push({
          id: i,
          name,
          votesFor: ethers.formatEther(votesFor),
          votesAgainst: ethers.formatEther(votesAgainst),
        });
      }

      setCampaigns(campaignsData);
    } catch (err: any) {
      console.error("Error loading campaigns:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(campaignId: number, support: boolean) {
    if (!votingContract) {
      alert("Voting contract is not initialized.");
      return;
    }

    setVotingInProgress({
      id: campaignId,
      type: support ? "for" : "against",
    });
    setError(null);

    try {
      console.log(
        `Voting ${support ? "for" : "against"} proposal ${campaignId}`
      );
      // Explicitly log the transaction parameters
      console.log(`Parameters: campaignId=${campaignId}, support=${support}`);

      // Call vote function and wait for transaction
      const tx = await votingContract.vote(campaignId, support);
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      // Reload campaigns after successful vote
      await loadCampaigns();
    } catch (err: any) {
      console.error("Voting error:", err);
      // ... rest of the error handling ...
    } finally {
      setVotingInProgress({ id: null, type: null });
    }
  }

  if (loading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Active Campaigns</h2>
      </div>

      <div className="p-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-gray-50 rounded-lg p-6 mb-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900">
                {campaign.name}
              </h3>
              <div className="mt-2 flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  For: {campaign.votesFor}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Against: {campaign.votesAgainst}
                </span>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => handleVote(campaign.id, true)}
                  disabled={votingInProgress.id === campaign.id}
                  className={`px-6 py-2 rounded-lg ${
                    votingInProgress.id === campaign.id &&
                    votingInProgress.type === "for"
                      ? "bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white transition-colors`}
                >
                  {votingInProgress.id === campaign.id &&
                  votingInProgress.type === "for"
                    ? "Voting..."
                    : "Vote For"}
                </button>
                <button
                  onClick={() => handleVote(campaign.id, false)}
                  disabled={votingInProgress.id === campaign.id}
                  className={`px-6 py-2 rounded-lg ${
                    votingInProgress.id === campaign.id &&
                    votingInProgress.type === "against"
                      ? "bg-gray-400"
                      : "bg-red-600 hover:bg-red-700"
                  } text-white transition-colors`}
                >
                  {votingInProgress.id === campaign.id &&
                  votingInProgress.type === "against"
                    ? "Voting..."
                    : "Vote Against"}
                </button>
              </div>
            </div>
          </div>
        ))}

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



--- File: C:\Users\VOID\Documents\token-voting-app\frontend\app\components\dashboard\UserProfile.tsx ---
// frontend/app/components/dashboard/UserProfile.tsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface UserProfileProps {
  address: string;
  tokenContract: ethers.Contract | null;
}

export default function UserProfile({
  address,
  tokenContract,
}: UserProfileProps) {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const requestTokens = async () => {
    if (!tokenContract) return;
    setRequesting(true);
    try {
      // Call the claimTokens function
      const tx = await tokenContract.claimTokens();
      await tx.wait();

      // Refresh balance
      const newBalance = await tokenContract.balanceOf(address);
      setBalance(ethers.formatEther(newBalance));
      console.log("New balance:", ethers.formatEther(newBalance));
    } catch (err) {
      console.error("Error requesting tokens:", err);
      setError(err instanceof Error ? err.message : "Failed to request tokens");
    } finally {
      setRequesting(false);
    }
  };
  useEffect(() => {
    async function loadBalance() {
      if (!tokenContract) {
        setError("Token contract is not initialized");
        setLoading(false);
        return;
      }

      if (!address) {
        setError("No wallet address provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Attempting to fetch balance for:", address);
        console.log(
          "Token contract address:",
          await tokenContract.getAddress()
        );
        // const deployerAddress = await tokenContract.deployer(); // No need to set state
        // console.log("Deployer address:", deployerAddress);       // just use this for debugging

        const bal = await tokenContract.balanceOf(address);
        console.log("Raw balance:", bal);
        setBalance(ethers.formatEther(bal));
        setError(null);
      } catch (err) {
        console.error("Error loading balance:", err);
        setError(err instanceof Error ? err.message : "Failed to load balance");
      } finally {
        setLoading(false);
      }
    }

    loadBalance();
  }, [address, tokenContract]);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">User Profile</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm">Wallet Address</label>
          <p className="font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>

        <div>
          <label className="text-sm">Token Balance</label>
          <p className="text-lg font-bold">
            {loading ? "Loading..." : `${balance} VOTE`}
          </p>
          {error && <p className="text-red-500 text-sm mt-1">Error: {error}</p>}
          <button
            onClick={requestTokens}
            disabled={requesting}
            className={`mt-2 px-4 py-2 ${
              requesting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded transition-colors`}
          >
            {requesting ? "Requesting..." : "Request Test Tokens"}
          </button>
        </div>
      </div>
    </div>
  );
}



--- File: C:\Users\VOID\Documents\token-voting-app\frontend\app\components\dashboard\VotingStatistics.tsx ---
import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface VotingStatisticsProps {
  votingContract: ethers.Contract | null;
  address: string;
}

export default function VotingStatistics({
  votingContract,
  address,
}: VotingStatisticsProps) {
  const [statistics, setStatistics] = useState({
    totalVotesFor: "0",
    totalVotesAgainst: "0",
    hasVoted: false,
    isActive: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatistics() {
      if (!votingContract) return;

      try {
        // Get all statistics in parallel
        const [totalVotes, hasVoted, isActive] = await Promise.all([
          votingContract.getTotalVotes(),
          votingContract.hasUserVoted(address), // Corrected line: Call the function
          votingContract.isVotingActive(),
        ]);

        // Now totalVotes is a tuple [votesFor, votesAgainst]
        const [votesFor, votesAgainst] = totalVotes;

        setStatistics({
          totalVotesFor: ethers.formatEther(votesFor),
          totalVotesAgainst: ethers.formatEther(votesAgainst),
          hasVoted,
          isActive,
        });
        setError(null);
      } catch (err) {
        console.error("Error loading voting statistics:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load statistics"
        );
      } finally {
        setLoading(false);
      }
    }

    loadStatistics();
  }, [votingContract, address]);

  if (loading) {
    return <div>Loading statistics...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-800">Votes For</h4>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {statistics.totalVotesFor}
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <h4 className="text-sm font-medium text-red-800">Votes Against</h4>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            {statistics.totalVotesAgainst}
          </p>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Voting Status
          </span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              statistics.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {statistics.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Your Vote</span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              statistics.hasVoted
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {statistics.hasVoted ? "Voted" : "Not Voted"}
          </span>
        </div>
      </div>
    </div>
  );
}

