import { useState } from "react";
import { ethers } from "ethers";

export default function WalletConnect({
  onConnect,
}: {
  onConnect: (address: string) => void;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  async function connectWallet() {
    setIsConnecting(true);
    setError("");

    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        throw new Error("Please install MetaMask to use this feature");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];
      onConnect(address);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
