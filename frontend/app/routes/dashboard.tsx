// frontend/app/routes/dashboard.tsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import UserProfile from "../components/dashboard/UserProfile";
import ActiveCampaigns from "../components/dashboard/ActiveCampaigns";
import VotingABI from "../../../artifacts/contracts/Voting.sol/Voting.json";
import TokenABI from "../../../artifacts/contracts/Token.sol/VotingToken.json";
import VotingStatistics from "~/components/dashboard/VotingStatistics";

export default function Dashboard() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [votingContract, setVotingContract] = useState<ethers.Contract | null>(
    null
  );
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(
    null
  );
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeContracts() {
      try {
        // Check if MetaMask is installed
        if (!(window as any).ethereum) {
          throw new Error("Please install MetaMask to use this application");
        }

        // Initialize provider and get signer
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        // Contract addresses (you should get these from your environment variables)
        const votingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
        const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

        // Initialize contracts
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

        setProvider(provider);
        setVotingContract(votingContract);
        setTokenContract(tokenContract);
        setAddress(userAddress);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }

    initializeContracts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">Token Based Tender Approval System</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-600 bg-gray-50">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-4">
              <UserProfile address={address} tokenContract={tokenContract} />

              {/* Additional Stats or Information */}
              <div className="mt-6 bg-white rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Voting Statistics
                  </h3>

                  <VotingStatistics
                    votingContract={votingContract}
                    address={address}
                  />
                  <div className="md:col-span-2">
                    <div className="lg:col-span-8">
                      {/* <ActiveCampaigns
                        votingContract={votingContract}
                        tokenContract={tokenContract}
                        address={address}
                      /> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8">
              <ActiveCampaigns
                votingContract={votingContract}
                tokenContract={tokenContract}
                address={address}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 Token Based Tender Approval System. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                Help
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
