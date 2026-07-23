"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function WalletConnect() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");

  const handleConnect = () => {
    // Placeholder for actual Privy connect
    setConnected(true);
    setAddress("0x71C...976F");
  };

  const handleDisconnect = () => {
    setConnected(false);
    setAddress("");
  };

  if (connected) {
    return (
      <Button variant="outline" onClick={handleDisconnect} className="gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        {address}
      </Button>
    );
  }

  return (
    <Button onClick={handleConnect} className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
