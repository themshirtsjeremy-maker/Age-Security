"use client";

import { useStore } from "@/store/useStore";
import { CONTRACT_ADDRESS, ETHERSCAN_URL } from "@/lib/contract";
import { useAccount, useDisconnect } from "wagmi";
import { useState } from "react";
import { Check, Copy, ExternalLink, Shield, AlertCircle, Loader2, LogOut } from "lucide-react";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function StatusBar() {
  const { fhevmStatus, fhevmError } = useStore();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const openEtherscan = () => {
    if (CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      window.open(`${ETHERSCAN_URL}/address/${CONTRACT_ADDRESS}`, "_blank");
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-4 font-mono text-xs tracking-wide">
      {/* FHEVM Status */}
      <div className="flex items-center gap-2 px-3 py-2 border border-border bg-card/80 backdrop-blur-sm">
        {fhevmStatus === "ready" && (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
            <span className="text-muted-foreground">FHE</span>
            <span className="text-foreground">READY</span>
          </>
        )}
        {fhevmStatus === "initializing" && (
          <>
            <Loader2 className="w-3 h-3 text-accent loading-spinner" />
            <span className="text-muted-foreground">FHE</span>
            <span className="text-accent">INIT</span>
          </>
        )}
        {fhevmStatus === "error" && (
          <>
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span className="text-red-500">FHE ERROR</span>
          </>
        )}
        {fhevmStatus === "idle" && (
          <>
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">FHE IDLE</span>
          </>
        )}
      </div>

      {/* Contract Address */}
      {CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000" && (
        <button
          onClick={openEtherscan}
          className="flex items-center gap-2 px-3 py-2 border border-border bg-card/80 backdrop-blur-sm hover:border-accent transition-colors group"
        >
          <Shield className="w-3 h-3 text-muted-foreground group-hover:text-accent" />
          <span className="text-muted-foreground">CONTRACT</span>
          <span className="text-foreground group-hover:text-accent">
            {shortenAddress(CONTRACT_ADDRESS)}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-accent" />
        </button>
      )}

      {/* Wallet Address */}
      {isConnected && address && (
        <button
          onClick={copyAddress}
          className="flex items-center gap-2 px-3 py-2 border border-border bg-card/80 backdrop-blur-sm hover:border-accent transition-colors group"
        >
          <span className="text-muted-foreground">WALLET</span>
          <span className="text-foreground group-hover:text-accent">
            {shortenAddress(address)}
          </span>
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3 text-muted-foreground group-hover:text-accent" />
          )}
        </button>
      )}

      {/* Disconnect Button */}
      {isConnected && (
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 px-3 py-2 border border-border bg-card/80 backdrop-blur-sm hover:border-red-500 hover:text-red-500 transition-colors group"
          title="Disconnect Wallet"
        >
          <LogOut className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

