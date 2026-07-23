"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, UserCircle2, Lock, FileText, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { WalletConnect } from "@/components/layout/wallet-connect";

const MOCK_SETTLEMENTS = [
  {
    id: "SET-2024-0057",
    shipmentId: "SH-2024-0142",
    shipmentDesc: "Coffee Beans from Brazil",
    docType: "Bill of Lading",
    docRef: "BL-2024-0098",
    counterparty: "Oceanic Traders Ltd.",
    amount: "24,500 USDC",
    status: "Settled",
    date: "May 16, 2024",
    time: "10:42 AM UTC"
  },
  {
    id: "SET-2024-0056",
    shipmentId: "SH-2024-0137",
    shipmentDesc: "Raw Sugar from Thailand",
    docType: "Invoice",
    docRef: "INV-2024-0211",
    counterparty: "Global Commodities SA",
    amount: "24,500 USDC",
    status: "Settled",
    date: "May 15, 2024",
    time: "03:18 PM UTC"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Area */}
      <div className="flex items-center justify-between px-10 py-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your trade operations.</p>
        </div>
        <div className="flex items-center">
          <WalletConnect />
        </div>
      </div>

      <div className="px-10 pb-12 max-w-6xl">
        {/* DvP Stepper Card */}
        <Card className="mb-10 shadow-sm border-gray-200/60">
          <CardHeader className="pb-8">
            <CardTitle className="text-xl">Delivery-versus-Payment (DvP)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex justify-between px-12">
              {/* Connecting Line */}
              <div className="absolute top-10 left-[15%] right-[15%] h-[1px] bg-gray-300 -z-10" />

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center w-64">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4 z-10">
                  1
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-background mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Import</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import trade documents and settlement instructions.
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Pending
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center w-64">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4 z-10">
                  2
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-background mb-4">
                  <UserCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Agent Review</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our trade agent reviews documents and validates terms.
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Pending
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center w-64">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4 z-10">
                  3
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-background mb-4">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Atomic DvP</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Atomic delivery-versus-payment settlement on-chain.
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Pending
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Settlements Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Settlements</h2>
            <Link href="/settlements" className="text-sm font-medium hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Shipment</th>
                  <th className="px-6 py-4 font-medium">Documents</th>
                  <th className="px-6 py-4 font-medium">Counterparty</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Settled At</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {MOCK_SETTLEMENTS.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => window.location.href=`/settlement/${row.id}`}>
                    <td className="px-6 py-4 font-medium">{row.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{row.shipmentId}</div>
                      <div className="text-muted-foreground text-xs">{row.shipmentDesc}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{row.docType}</div>
                          <div className="text-muted-foreground text-xs">{row.docRef}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{row.counterparty}</td>
                    <td className="px-6 py-4 font-medium">{row.amount}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                        <Check className="mr-1.5 h-3 w-3" />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{row.date}</div>
                      <div className="text-muted-foreground text-xs">{row.time}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t text-sm text-muted-foreground bg-gray-50/30">
              Showing {MOCK_SETTLEMENTS.length} of {MOCK_SETTLEMENTS.length} settlements
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
