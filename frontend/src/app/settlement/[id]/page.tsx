"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleDashed, FileText, Lock, ArrowLeftRight, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";

// ABI for a standard ERC-20 token (only transfer method needed for sending)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

// Mock stages for the DvP workflow
const STAGES = [
  { id: "agent", label: "Agent Review", desc: "mLETR compliance & terms" },
  { id: "payment", label: "USDC Escrow", desc: "Buyer deposits funds" },
  { id: "transfer", label: "DvP Execution", desc: "Atomic transfer & release" },
  { id: "settled", label: "Settled", desc: "Transaction complete" }
];

export default function SettlementPage() {
  const params = useParams();
  const router = useRouter();
  
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets?.[0];
  
  const [currentStage, setCurrentStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // This would normally fetch from API based on params.id
  const mockData = {
    documentId: params.id as string,
    type: "Bill of Lading",
    reference: "BL-7823901",
    amount: "45000.00",
    currency: "USDC",
    seller: "0xSeller...89AB (Oceanic Freight Ltd)",
    buyer: activeWallet ? `${activeWallet.address.slice(0,6)}...${activeWallet.address.slice(-4)} (You)` : "0xBuyer... (Not connected)",
    escrow: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Example escrow address
    tokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC on Polygon Amoy testnet
  };

  const handlePayUSDC = async () => {
    if (!authenticated || !activeWallet) {
      login();
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      // 1. Get ethers provider from Privy wallet
      const ethereumProvider = await activeWallet.getEthereumProvider();
      const provider = new ethers.providers.Web3Provider(ethereumProvider as any);
      const signer = provider.getSigner();

      // 2. Format the amount based on token decimals (USDC is typically 6 decimals)
      const usdcDecimals = 6;
      const amountAtomic = ethers.utils.parseUnits(mockData.amount, usdcDecimals);

      // 3. Connect to the ERC-20 contract
      const tokenContract = new ethers.Contract(mockData.tokenAddress, ERC20_ABI, signer);

      // 4. Execute the transfer transaction to the Escrow Address
      // Note: In a real app, you would check balance and allowance first, and handle gas estimation.
      // If running on a network without real funds, this will throw an error, 
      // so we catch it and fallback to a mock simulation for UI demonstration.
      try {
        const tx = await tokenContract.transfer(mockData.escrow, amountAtomic);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        setTxHash(receipt.transactionHash);
        
      } catch (err: any) {
        console.warn("Real transaction failed, falling back to UI simulation. Error:", err);
        // Fallback simulation for demonstration if real network fails (e.g. no testnet gas/funds)
        await new Promise(resolve => setTimeout(resolve, 3000));
        setTxHash("0x" + Math.random().toString(16).slice(2, 64));
      }

      setIsProcessing(false);
      setCurrentStage(2); // Move to transfer stage
      
      // Auto-trigger the DvP backend execution after payment confirmation
      // (In production, the backend would listen for the on-chain event or an API call here)
      setTimeout(() => {
        setCurrentStage(3); // Settled
      }, 3500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Failed to process transaction.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settlement Orchestration</h1>
        <p className="text-muted-foreground">
          Delivery-versus-Payment (DvP) for {mockData.reference}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Workflow Status */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settlement Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStage || (idx === 3 && currentStage === 3);
                  const isActive = idx === currentStage && currentStage !== 3;
                  
                  return (
                    <div key={stage.id} className="flex gap-4">
                      <div className="mt-0.5 flex flex-col items-center">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : isActive ? (
                          <CircleDashed className="h-5 w-5 text-primary animate-spin-slow" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted" />
                        )}
                        {idx !== STAGES.length - 1 && (
                          <div className={`w-0.5 h-10 mt-1 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isActive ? 'text-foreground' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {stage.label}
                        </p>
                        <p className="text-sm text-muted-foreground">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Action Area */}
        <div className="md:col-span-2 space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle>Trade Details</CardTitle>
              <CardDescription>Extracted by AI Agent and verified against mLETR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-accent/50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Document Type</p>
                  <p className="font-medium flex items-center gap-1"><FileText className="h-3 w-3"/> {mockData.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium">{mockData.reference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seller (Receives USDC)</p>
                  <p className="font-medium truncate pr-4">{mockData.seller}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Buyer (Receives Title)</p>
                  <p className="font-medium truncate pr-4">{mockData.buyer}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium text-lg">Settlement Amount</p>
                  <p className="text-muted-foreground text-sm">Required in Smart Escrow</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tracking-tight">
                    {Number(mockData.amount).toLocaleString()} {mockData.currency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Card based on state */}
          {currentStage === 0 && (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center py-12">
                <ShieldCheck className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">Agent Review Complete</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  The document has been verified as a compliant Electronic Transferable Record. Proceed to fund the escrow.
                </p>
                <Button size="lg" onClick={() => setCurrentStage(1)}>
                  Proceed to Payment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStage === 1 && (
            <Card className="border-primary shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Fund Escrow
                </CardTitle>
                <CardDescription>
                  Deposit USDC to the secure smart contract. Funds will only be released to the seller once the document title is transferred to your wallet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md font-mono text-sm mb-6 break-all">
                  Escrow Address: {mockData.escrow}
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                    {errorMsg}
                  </div>
                )}

                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={handlePayUSDC}
                  disabled={isProcessing}
                >
                  {!authenticated ? (
                    "Connect Wallet to Pay"
                  ) : isProcessing ? (
                    "Awaiting Wallet Signature..." 
                  ) : (
                    `Pay ${Number(mockData.amount).toLocaleString()} USDC`
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStage >= 2 && (
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      {currentStage === 2 ? "Executing DvP..." : "Settlement Complete"}
                    </h3>
                    <p className="text-primary-foreground/80">
                      {currentStage === 2 ? "Simultaneous transfer in progress" : "Document title and funds have been swapped"}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                    {currentStage === 2 ? (
                      <ArrowLeftRight className="h-6 w-6 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6" />
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-primary-foreground/20 pb-2">
                    <span className="text-primary-foreground/70">Payment Tx</span>
                    <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-mono flex items-center gap-1 hover:text-white">
                      {txHash.slice(0, 14)}...<ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {currentStage === 3 && (
                    <>
                      <div className="flex justify-between border-b border-primary-foreground/20 pb-2">
                        <span className="text-primary-foreground/70">TrustVC Transfer Tx</span>
                        <a href="#" className="underline underline-offset-2 font-mono flex items-center gap-1 hover:text-white">
                          0x9f8e...3c2a<ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-primary-foreground/70">New Document Holder</span>
                        <span className="font-mono">{activeWallet?.address ? `${activeWallet.address.slice(0,6)}...${activeWallet.address.slice(-4)}` : "0x71C...976F"} (You)</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
