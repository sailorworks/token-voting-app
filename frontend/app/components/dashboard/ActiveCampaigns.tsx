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
  tokenContract: ethers.Contract | null; // Add tokenContract prop
  address: string;
}

export default function ActiveCampaigns({
  votingContract,
  tokenContract, // Receive tokenContract
  address,
}: ActiveCampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<{
    id: number | null;
    type: "for" | "against" | null;
  }>({ id: null, type: null });
  const [voteFee, setVoteFee] = useState<string>("1.0"); // Default fee is 1 token

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
    if (!votingContract || !tokenContract) {
      alert("Voting contract or token contract is not initialized.");
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

      // First, approve the voting contract to spend tokens
      const votingAddress = await votingContract.getAddress();
      const approvalAmount = ethers.parseEther(voteFee); // 1 VOTE token

      console.log(
        `Approving voting contract ${votingAddress} to spend ${voteFee} VOTE tokens`
      );
      const approveTx = await tokenContract.approve(
        votingAddress,
        approvalAmount
      );
      console.log("Approval transaction sent:", approveTx.hash);
      await approveTx.wait();
      console.log("Approval transaction confirmed");

      // Now call vote function with the approved tokens
      const tx = await votingContract.vote(campaignId, support);
      console.log("Vote transaction sent:", tx.hash);
      await tx.wait();
      console.log("Vote transaction confirmed");

      // Reload campaigns after successful vote
      await loadCampaigns();
    } catch (err: any) {
      console.error("Voting error:", err);
      setError(`Error: ${err.message || "Unknown error occurred"}`);
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
        <h2 className="text-xl font-bold text-gray-900">Active Tenders</h2>
      </div>

      <div className="p-6">
        {/* Add explanation about token-weighted voting and fee */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-700">
            <span className="font-medium">Note:</span> Voting requires {voteFee}{" "}
            VOTE tokens as a fee. Votes are weighted by your token balance. The
            numbers shown represent the total token weight, not the count of
            voters.
          </p>
        </div>

        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-gray-50 rounded-lg p-6 mb-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900">
                {campaign.name}
              </h3>
              <div className="mt-2 flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="font-bold mr-1">For:</span>{" "}
                  {campaign.votesFor} VOTE
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <span className="font-bold mr-1">Against:</span>{" "}
                  {campaign.votesAgainst} VOTE
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
                    ? "Approving & Voting..."
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
                    ? "Approving & Voting..."
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
