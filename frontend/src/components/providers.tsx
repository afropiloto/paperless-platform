"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  // In a real app, use environment variable: process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const privyAppId = "cm6n8a8s20000a6m3hxwz8l6e"; // Placeholder / generic ID or user can override

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["wallet", "email", "google"],
        appearance: {
          theme: "light",
          accentColor: "#000000", // Black/white theme matching Paperless
          logo: "https://auth.privy.io/logos/privy-logo.png", // Replace with Paperless logo
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
