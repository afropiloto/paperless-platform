"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Ship,
  FileText,
  CircleDollarSign,
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  Sun,
  HelpCircle,
  Box
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Shipments", href: "/shipments", icon: Ship },
  { name: "Documents", href: "/import", icon: FileText },
  { name: "Settlements", href: "/settlements", icon: CircleDollarSign },
  { name: "Counterparties", href: "/counterparties", icon: Users },
  { name: "Audit Trail", href: "/audit", icon: ShieldCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
          <Box className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">Paperless Trade</span>
          <span className="text-[10px] text-muted-foreground font-medium">Trade. Settle. Trust.</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-4">
        <button className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Sun className="h-5 w-5" />
          Light Mode
        </button>
        <button className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <HelpCircle className="h-5 w-5" />
          Help & Support
        </button>
      </div>
    </div>
  );
}
