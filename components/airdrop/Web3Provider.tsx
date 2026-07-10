"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getDefaultConfig,
  lightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { SITE_URL } from "@/lib/airdrop";

/**
 * Wagmi + RainbowKit context for the airdrop page only — keeps the
 * wallet stack out of the marketing pages' bundle.
 *
 * NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID enables WalletConnect (QR /
 * mobile deep links). Get a free ID at https://cloud.reown.com.
 * Browser-extension wallets work even without it.
 */
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "MISSING_PROJECT_ID";

const config = getDefaultConfig({
  appName: "Mortgage Estate",
  appUrl: SITE_URL,
  projectId,
  chains: [base],
  ssr: true,
});

const theme = lightTheme({
  accentColor: "#275CAB",
  accentColorForeground: "#FFFFFF",
  borderRadius: "small",
  fontStack: "system",
});

export default function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
