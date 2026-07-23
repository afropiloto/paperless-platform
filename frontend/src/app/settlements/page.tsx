"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Check, ArrowRight } from "lucide-react";
import { MOCK_SETTLEMENTS } from "@/app/page"; // We'll move the mock data here or reuse it

const ALL_SETTLEMENTS = [
  {
    id: "TRD-2025-05-0001",
    shipmentId: "SH-2025-0199",
    shipmentDesc: "Electronics from Shenzen",
    docType: "Bill of Lading",
    docRef: "BOL-2025-05-0001",
    counterparty: "Global Trade Partners LLC",
    amount: "45,000 USDC",
    status: "Awaiting Payment",
    date: "Today",
    time: "10:24 AM UTC",
    isPending: true,
  },
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
    time: "10:42 AM UTC",
    isPending: false,
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
    time: "03:18 PM UTC",
    isPending: false,
  }
];

export default function SettlementsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-10 py-8">
        <div>
          <h1 className="text-2xl font-bold">All Settlements</h1>
          <p className="text-muted-foreground mt-1">View and manage all your Delivery-versus-Payment workflows.</p>
        </div>
      </div>

      <div className="px-10 pb-12 max-w-6xl">
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
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ALL_SETTLEMENTS.map((row) => (
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
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${row.isPending ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {!row.isPending && <Check className="mr-1.5 h-3 w-3" />}
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
            Showing {ALL_SETTLEMENTS.length} settlements
          </div>
        </div>
      </div>
    </div>
  );
}
