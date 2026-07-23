"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleDashed, FileText, Lock, ArrowLeftRight, Coins, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  
  const [currentStage, setCurrentStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState("");

  // This would normally fetch from API based on params.id
  const mockData = {
    documentId: params.id,
    type: "Bill of Lading",
    reference: "BL-7823901",
    amount: "45000.00",
    currency: "USDC",
    seller: "0xSeller...89AB (Oceanic Freight Ltd)",
    buyer: "0x71C...976F (Global Imports Inc)",
    escrow: "0xEscrow...1234",
  };

  const handlePayUSDC = () => {
    setIsProcessing(true);
    // Simulate wallet transaction
    setTimeout(() => {
      setTxHash("0x" + Math.random().toString(16).slice(2, 64));
      setIsProcessing(false);
      setCurrentStage(2); // Move to transfer
      
      // Auto-trigger the DvP execution after payment
      setTimeout(() => {
        setCurrentStage(3); // Settled
      }, 2500);
      
    }, 2000);
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
                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={handlePayUSDC}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Awaiting Wallet Signature..." : `Pay ${Number(mockData.amount).toLocaleString()} USDC`}
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
                    <a href="#" className="underline underline-offset-2 font-mono">{txHash.slice(0, 14)}...</a>
                  </div>
                  {currentStage === 3 && (
                    <>
                      <div className="flex justify-between border-b border-primary-foreground/20 pb-2">
                        <span className="text-primary-foreground/70">TrustVC Transfer Tx</span>
                        <a href="#" className="underline underline-offset-2 font-mono">0x9f8e...3c2a</a>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-primary-foreground/70">New Document Holder</span>
                        <span className="font-mono">0x71C...976F (You)</span>
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
