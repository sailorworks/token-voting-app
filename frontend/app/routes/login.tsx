// frontend/app/routes/login.tsx
import WalletConnect from "~/components/auth/WalletConnnect";

export default function Login() {
  //In a real application, you would check for existing session / authentication here
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect your wallet to proceed
          </p>
        </div>
        {/* Using the WalletConnect component for simplicity */}
        <WalletConnect onConnect={() => {}} />
      </div>
    </div>
  );
}
