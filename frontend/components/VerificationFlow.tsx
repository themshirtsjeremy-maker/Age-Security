"use client";

import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useWalletClient, useReadContract } from "wagmi";
import { useStore } from "@/store/useStore";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { encryptBirthYear, userDecrypt, initFhevm } from "@/lib/fhe";
import { YearPicker } from "./YearPicker";
import { LoadingSpinner } from "./LoadingSpinner";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X, RotateCcw, Lock, Unlock, Send, Shield, RefreshCw } from "lucide-react";

export function VerificationFlow() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  
  const {
    step,
    setStep,
    selectedYear,
    isEligible,
    setIsEligible,
    txHash,
    setTxHash,
    error,
    setError,
    fhevmStatus,
    setFhevmStatus,
    setFhevmError,
    reset,
  } = useStore();

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if user has existing submission
  const { data: hasSubmitted, refetch: refetchSubmission } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasUserSubmitted",
    args: address ? [address] : undefined,
  });


  // Initialize FHEVM on mount
  useEffect(() => {
    const init = async () => {
      setFhevmStatus("initializing");
      try {
        await initFhevm();
        setFhevmStatus("ready");
      } catch (err: any) {
        setFhevmStatus("error");
        setFhevmError(err.message);
      }
    };
    init();
  }, []);

  // Update submission state
  useEffect(() => {
    if (hasSubmitted !== undefined) {
      setHasExistingSubmission(hasSubmitted as boolean);
    }
  }, [hasSubmitted]);


  // Handle wallet connection/disconnection
  useEffect(() => {
    if (isConnected && step === "idle") {
      setStep("connected");
    } else if (!isConnected) {
      reset();
      setStep("idle");
      setHasExistingSubmission(false);
    }
  }, [isConnected]);

  // Handle transaction hash
  useEffect(() => {
    if (hash) {
      setTxHash(hash);
      setStep("confirming");
    }
  }, [hash]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      setError(writeError.message);
      setStep("connected");
    }
  }, [writeError]);

  // Handle confirmation and start decryption
  useEffect(() => {
    if (isConfirmed && step === "confirming") {
      // Refetch submission status
      refetchSubmission();
      handleDecryption();
    }
  }, [isConfirmed]);

  const handleStart = () => {
    setError(null);
    setStep("input");
  };

  const handleSubmit = async () => {
    if (!address || fhevmStatus !== "ready") return;

    try {
      setStep("encrypting");
      
      // Encrypt birth year
      const { handle, inputProof } = await encryptBirthYear(
        CONTRACT_ADDRESS,
        address,
        selectedYear
      );

      setStep("submitting");

      // Submit to contract
      // FHE operations require high gas - set explicit limits
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "submitBirthYear",
        args: [handle, inputProof],
        gas: 5000000n, // FHE ops need ~3-5M gas
      });
    } catch (err: any) {
      setError(err.message);
      setStep("input");
    }
  };

  const handleDecryption = async () => {
    if (!address || !walletClient) return;

    try {
      setStep("decrypting");

      // Get result handle from contract using viem
      const { createPublicClient, http } = await import("viem");
      const { sepolia } = await import("viem/chains");
      
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const handle = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getResultHandle",
        args: [address],
      }) as `0x${string}`;

      // User decrypt
      const result = await userDecrypt(handle, CONTRACT_ADDRESS, walletClient);
      
      // Result is boolean: 1n = true (18+), 0n = false (under 18)
      setIsEligible(result === 1n);
      setStep("result");
    } catch (err: any) {
      setError(err.message);
      setStep("result");
    }
  };

  const handleRestart = () => {
    reset();
    setStep("connected");
  };

  // Retrieve existing result
  const handleRetrieveResult = async () => {
    if (!address || !walletClient || fhevmStatus !== "ready") return;
    setError(null);
    handleDecryption();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <AnimatePresence mode="wait">
        {/* Idle / Not Connected */}
        {step === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8">
              AGE
              <br />
              <span className="text-accent">SECURITY</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl tracking-wide mb-12 max-w-md mx-auto">
              PRIVACY-FIRST VERIFICATION
            </p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="group relative inline-flex items-center gap-3 text-accent text-lg font-semibold tracking-wider uppercase py-3 transition-all"
                >
                  <span>CONNECT WALLET</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent scale-x-100 group-hover:scale-x-110 transition-transform origin-left" />
                </button>
              )}
            </ConnectButton.Custom>
          </motion.div>
        )}

        {/* Connected - Ready to Start */}
        {step === "connected" && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <Shield className="w-16 h-16 text-accent mx-auto mb-8" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              {hasExistingSubmission ? "VERIFIED" : "READY"}
            </h2>
            <p className="text-muted-foreground tracking-wide mb-8">
              YOUR DATA STAYS ENCRYPTED
            </p>
            
            {error && (
              <p className="text-red-500 text-sm mb-8 max-w-md">{error}</p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Retrieve existing result button */}
              {hasExistingSubmission && (
                <button
                  onClick={handleRetrieveResult}
                  disabled={fhevmStatus !== "ready"}
                  className="group relative inline-flex items-center gap-3 text-muted-foreground hover:text-foreground text-lg font-semibold tracking-wider uppercase py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Unlock className="w-5 h-5" />
                  <span>VIEW RESULT</span>
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </button>
              )}
              
              {/* New verification button */}
              <button
                onClick={handleStart}
                disabled={fhevmStatus !== "ready"}
                className="group relative inline-flex items-center gap-3 text-accent text-lg font-semibold tracking-wider uppercase py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasExistingSubmission ? (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>REVERIFY</span>
                  </>
                ) : (
                  <>
                    <span>BEGIN VERIFICATION</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent scale-x-100 group-hover:scale-x-110 transition-transform origin-left" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Input - Year Selection */}
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full max-w-lg"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-12">
              SELECT YEAR
            </h2>
            
            <YearPicker />

            <div className="mt-12 flex justify-center gap-6">
              <button
                onClick={() => setStep("connected")}
                className="px-6 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors tracking-wider uppercase text-sm"
              >
                BACK
              </button>
              <button
                onClick={handleSubmit}
                className="group relative inline-flex items-center gap-3 text-accent text-lg font-semibold tracking-wider uppercase py-3 transition-all"
              >
                <Lock className="w-5 h-5" />
                <span>ENCRYPT & VERIFY</span>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent scale-x-100 group-hover:scale-x-110 transition-transform origin-left" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Encrypting */}
        {step === "encrypting" && (
          <motion.div
            key="encrypting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <Lock className="w-16 h-16 text-accent mx-auto mb-8 animate-pulse" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              ENCRYPTING
            </h2>
            <LoadingSpinner message="SECURING YOUR DATA" />
          </motion.div>
        )}

        {/* Submitting */}
        {step === "submitting" && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <Send className="w-16 h-16 text-accent mx-auto mb-8 animate-pulse" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              CONFIRM
            </h2>
            <LoadingSpinner message="APPROVE IN WALLET" />
          </motion.div>
        )}

        {/* Confirming */}
        {step === "confirming" && (
          <motion.div
            key="confirming"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-2 border-accent mx-auto mb-8 flex items-center justify-center">
              <div className="w-8 h-8 border-t-2 border-accent loading-spinner" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              ON-CHAIN
            </h2>
            <LoadingSpinner message="COMPUTING ENCRYPTED RESULT" />
            {txHash && (
              <p className="text-muted-foreground text-xs font-mono mt-8">
                TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
            )}
          </motion.div>
        )}

        {/* Decrypting */}
        {step === "decrypting" && (
          <motion.div
            key="decrypting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <Unlock className="w-16 h-16 text-accent mx-auto mb-8 animate-pulse" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              DECRYPTING
            </h2>
            <LoadingSpinner message="RETRIEVING YOUR RESULT" />
          </motion.div>
        )}

        {/* Result */}
        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            {isEligible === true && (
              <>
                <div className="w-24 h-24 border-4 border-green-500 mx-auto mb-8 flex items-center justify-center accent-glow">
                  <Check className="w-12 h-12 text-green-500" strokeWidth={3} />
                </div>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-4 text-green-500">
                  VERIFIED
                </h2>
                <p className="text-muted-foreground tracking-widest uppercase text-lg mb-12">
                  18+ CONFIRMED
                </p>
              </>
            )}
            {isEligible === false && (
              <>
                <div className="w-24 h-24 border-4 border-red-500 mx-auto mb-8 flex items-center justify-center">
                  <X className="w-12 h-12 text-red-500" strokeWidth={3} />
                </div>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-4 text-red-500">
                  DENIED
                </h2>
                <p className="text-muted-foreground tracking-widest uppercase text-lg mb-12">
                  UNDER 18
                </p>
              </>
            )}
            {isEligible === null && error && (
              <>
                <div className="w-24 h-24 border-4 border-accent mx-auto mb-8 flex items-center justify-center">
                  <X className="w-12 h-12 text-accent" strokeWidth={3} />
                </div>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
                  ERROR
                </h2>
                <p className="text-red-500 text-sm max-w-md mx-auto mb-12">
                  {error}
                </p>
              </>
            )}
            <button
              onClick={handleRestart}
              className="group relative inline-flex items-center gap-3 text-accent text-lg font-semibold tracking-wider uppercase py-3 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span>VERIFY AGAIN</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent scale-x-100 group-hover:scale-x-110 transition-transform origin-left" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
