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
