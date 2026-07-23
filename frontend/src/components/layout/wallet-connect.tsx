"use client";

import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

export function WalletConnect() {
  const { login, logout, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();

  // Find the primary wallet if available
  const primaryWallet = wallets?.[0];

  // Helper to format wallet address
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Wait for Privy to initialize before rendering to avoid hydration mismatch
  if (!ready) {
    return (
      <Button disabled variant="outline" className="opacity-50">
        <Wallet className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (authenticated && primaryWallet) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2 cursor-default pointer-events-none">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          {formatAddress(primaryWallet.address)}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} title="Disconnect">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={login} className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
