"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

/** RainbowKit connect button rendered in the site's own button style. */
export default function ConnectWallet({ compact = false }: { compact?: boolean }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className={`btn-primary ${compact ? "!px-4 !py-2 !text-[12px]" : ""}`}
            >
              <Wallet size={compact ? 14 : 16} strokeWidth={1.75} />
              Connect Wallet
            </button>
          );
        }
        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className={`btn-coral ${compact ? "!px-4 !py-2 !text-[12px]" : ""}`}
            >
              Switch to Base
            </button>
          );
        }
        return (
          <button
            onClick={openAccountModal}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded border border-compass/40 bg-compass/5 px-3 py-2 font-mono text-[11px] text-compass transition-colors hover:border-compass"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-compass" />
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
