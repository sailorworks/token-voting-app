// frontend/app/components/layout/Header.tsx
import { Link } from "react-router";

interface HeaderProps {
  address: string;
}

export default function Header({ address }: HeaderProps) {
  return (
    <header className="bg-gray-800 text-white py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold">
          Voting DApp
        </Link>
        {address && (
          <div className="text-sm">
            Connected: {address.substring(0, 6)}...
            {address.substring(address.length - 4)}
          </div>
        )}
      </div>
    </header>
  );
}
