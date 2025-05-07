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
          votingContract.hasUserVoted(address),
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
      <div className="p-4 mb-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Token-Weighted Voting System
        </h4>
        <p className="text-sm text-gray-600">
          In this system, your voting power equals your token holdings. All vote
          statistics represent the sum of tokens used for voting, not the count
          of individual voters.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-800">Votes For</h4>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {parseFloat(statistics.totalVotesFor) > 0.01
              ? parseFloat(statistics.totalVotesFor).toFixed(2)
              : parseFloat(statistics.totalVotesFor).toString()}{" "}
            <span className="text-sm font-normal">VOTE</span>
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <h4 className="text-sm font-medium text-red-800">Votes Against</h4>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            {parseFloat(statistics.totalVotesAgainst) > 0.01
              ? parseFloat(statistics.totalVotesAgainst).toFixed(2)
              : parseFloat(statistics.totalVotesAgainst).toString()}{" "}
            <span className="text-sm font-normal">VOTE</span>
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
          <span className="text-sm font-medium text-gray-500">Proposals Voted: </span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              statistics.hasVoted
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {parseFloat(statistics.totalVotesAgainst) + parseFloat(statistics.totalVotesFor)}  
          </span>
        </div>
      </div>
    </div>
  );
}
