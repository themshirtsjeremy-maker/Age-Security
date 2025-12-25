"use client";

import { StatusBar } from "@/components/StatusBar";
import { VerificationFlow } from "@/components/VerificationFlow";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background">
      {/* Decorative background text */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-20 -left-10 text-[20rem] font-bold tracking-tighter text-border/20 leading-none">
          18
        </div>
        <div className="absolute -bottom-20 -right-10 text-[15rem] font-bold tracking-tighter text-border/20 leading-none">
          +
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Main verification flow */}
      <VerificationFlow />

      {/* Footer */}
      <footer className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          POWERED BY ZAMA FHE
        </p>
      </footer>
    </main>
  );
}

