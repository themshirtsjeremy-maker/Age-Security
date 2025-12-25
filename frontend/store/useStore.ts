import { create } from "zustand";

export type FhevmStatus = "idle" | "initializing" | "ready" | "error";
export type VerificationStep = 
  | "idle"           // Initial state, not connected
  | "connected"      // Wallet connected, ready to start
  | "input"          // Selecting birth year
  | "encrypting"     // Encrypting birth year
  | "submitting"     // Submitting to blockchain
  | "confirming"     // Waiting for transaction confirmation
  | "decrypting"     // Decrypting result
  | "result";        // Showing final result

interface AppStore {
  // FHEVM state
  fhevmStatus: FhevmStatus;
  fhevmError: string | null;
  setFhevmStatus: (status: FhevmStatus) => void;
  setFhevmError: (error: string | null) => void;

  // Verification flow state
  step: VerificationStep;
  setStep: (step: VerificationStep) => void;
  
  // Selected birth year
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  
  // Verification result
  isEligible: boolean | null;
  setIsEligible: (eligible: boolean | null) => void;
  
  // Transaction hash
  txHash: string | null;
  setTxHash: (hash: string | null) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
  
  // Reset all state
  reset: () => void;
}

const initialState = {
  fhevmStatus: "idle" as FhevmStatus,
  fhevmError: null,
  step: "idle" as VerificationStep,
  selectedYear: 2000,
  isEligible: null,
  txHash: null,
  error: null,
};

export const useStore = create<AppStore>((set) => ({
  ...initialState,
  
  setFhevmStatus: (status) => set({ fhevmStatus: status }),
  setFhevmError: (error) => set({ fhevmError: error }),
  
  setStep: (step) => set({ step }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setIsEligible: (eligible) => set({ isEligible: eligible }),
  setTxHash: (hash) => set({ txHash: hash }),
  setError: (error) => set({ error }),
  
  reset: () => set({
    step: "idle",
    selectedYear: 2000,
    isEligible: null,
    txHash: null,
    error: null,
  }),
}));

