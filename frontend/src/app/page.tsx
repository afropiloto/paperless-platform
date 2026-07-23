import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col items-center text-center mb-16 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Paperless Settlement
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mb-8">
          Agentic Delivery-versus-Payment (DvP) connecting tokenised trade documents with stablecoin payments.
        </p>
        <div className="flex gap-4">
          <Link href="/import">
            <Button size="lg">
              Import Document
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            View API Docs
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
              Import
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Upload tokenised TrustVC documents or third-party invoices (CargoX, WaveBL).
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
              Agent Review
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            AI agent validates mLETR compliance and extracts settlement terms automatically.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
              Atomic DvP
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Simultaneous stablecoin payment via smart escrow and document title transfer.
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Recent Settlements</h2>
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">BL-9923841</p>
                <p className="text-sm text-muted-foreground">Oceanic Freight → Global Imports</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">24,500 USDC</p>
              <p className="text-sm text-muted-foreground">Settled Today</p>
            </div>
          </div>
          
          <div className="p-4 border-b flex items-center justify-between hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-4">
              <Circle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">INV-2026-089</p>
                <p className="text-sm text-muted-foreground">TechCorp → RetailPlus</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">12,000 USDT</p>
              <p className="text-sm text-yellow-600">Awaiting Payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
