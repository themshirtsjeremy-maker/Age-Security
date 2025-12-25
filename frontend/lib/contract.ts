// AgeVerification Contract Configuration

export const CONTRACT_ADDRESS = "0x053eD58bd6C58CC53dc51a884CFE7477D070d922" as const;

export const CONTRACT_ABI = [
  // Constants
  {
    inputs: [],
    name: "MINIMUM_AGE",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "BASE_YEAR",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  // Core functions
  {
    inputs: [
      { internalType: "externalEuint16", name: "encryptedYear", type: "bytes32" },
      { internalType: "bytes", name: "inputProof", type: "bytes" },
    ],
    name: "submitBirthYear",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getResultHandle",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "hasUserSubmitted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserSubmissionCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getThresholdYear",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "pure",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "submissionNumber", type: "uint256" },
    ],
    name: "YearSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "user", type: "address" }],
    name: "VerificationComplete",
    type: "event",
  },
  // Errors
  {
    inputs: [],
    name: "NoSubmission",
    type: "error",
  },
] as const;

export const SEPOLIA_CHAIN_ID = 11155111;
export const ETHERSCAN_URL = "https://sepolia.etherscan.io";
