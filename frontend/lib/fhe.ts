"use client";

let instance: any = null;
let isInitialized = false;
let isInitializing = false;
let initError: string | null = null;

// Convert Uint8Array to hex string with 0x prefix
function toHex(arr: Uint8Array): `0x${string}` {
  return `0x${Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

// Initialize FHEVM SDK (lazy load to avoid SSR issues)
export async function initFhevm(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("FHEVM can only be initialized in browser");
  }

  if (instance && isInitialized) return instance;
  if (initError) throw new Error(initError);

  // Prevent concurrent initialization
  if (isInitializing) {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (isInitialized && instance) {
          clearInterval(check);
          resolve(instance);
        }
        if (initError) {
          clearInterval(check);
          reject(new Error(initError));
        }
      }, 100);
    });
  }

  isInitializing = true;

  try {
    // Dynamic import to avoid SSR issues
    const { initSDK, createInstance, SepoliaConfig } = await import(
      "@zama-fhe/relayer-sdk/web"
    );

    // thread: 0 disables multi-threading to avoid COOP/COEP header issues
    await initSDK({ thread: 0 });
    
    // Use API route proxy to bypass CORS in development
    // /api/relayer/* -> https://relayer.testnet.zama.org/*
    const config = {
      ...SepoliaConfig,
      relayerUrl: typeof window !== 'undefined' 
        ? `${window.location.origin}/api/relayer`  // Use API proxy in browser
        : SepoliaConfig.relayerUrl,                // Use direct URL on server
    };
    
    instance = await createInstance(config);
    isInitialized = true;
    return instance;
  } catch (error: any) {
    initError = error.message || "Failed to initialize FHEVM";
    throw error;
  } finally {
    isInitializing = false;
  }
}

// Encrypt birth year value (uint16: 1900-2100)
export async function encryptBirthYear(
  contractAddress: string,
  userAddress: string,
  birthYear: number
): Promise<{ handle: `0x${string}`; inputProof: `0x${string}` }> {
  const fhevm = await initFhevm();
  const input = fhevm.createEncryptedInput(contractAddress, userAddress);
  input.add16(BigInt(birthYear));

  const encrypted = await input.encrypt();
  return {
    handle: toHex(encrypted.handles[0]),
    inputProof: toHex(encrypted.inputProof),
  };
}

// User private decryption using SDK's built-in userDecrypt method
export async function userDecrypt(
  handle: string,
  contractAddress: string,
  signer: any // viem WalletClient
): Promise<bigint> {
  const fhevm = await initFhevm();

  // Get user address from viem WalletClient
  const userAddress = signer.account?.address;
  if (!userAddress) {
    throw new Error("Cannot get user address from signer");
  }

  // 1. Generate reencryption keypair
  const { publicKey, privateKey } = fhevm.generateKeypair();

  // 2. Create EIP-712 signature request for reencryption
  const eip712 = fhevm.createEIP712(publicKey, [contractAddress]);

  // 3. Get startTimestamp and durationDays from EIP712 message
  const startTimestamp = eip712.message.startTimestamp ?? Math.floor(Date.now() / 1000);
  const durationDays = eip712.message.durationDays ?? 1;

  // Prepare message with BigInt values (required by EIP-712)
  const message = {
    ...eip712.message,
    startTimestamp: BigInt(startTimestamp),
    durationDays: BigInt(durationDays),
  };

  // 4. User signs the reencryption request (viem WalletClient)
  const signature = await signer.signTypedData({
    domain: eip712.domain,
    types: eip712.types,
    primaryType: eip712.primaryType,
    message: message,
  });

  // 5. Convert keys to hex format (SDK automatically strips 0x prefix)
  const publicKeyStr = publicKey instanceof Uint8Array ? toHex(publicKey) : publicKey;
  const privateKeyStr = privateKey instanceof Uint8Array ? toHex(privateKey) : privateKey;

  // 6. Use SDK's built-in userDecrypt
  const handleContractPairs = [{ handle, contractAddress }];
  
  const results = await fhevm.userDecrypt(
    handleContractPairs,
    privateKeyStr,
    publicKeyStr,
    signature,
    [contractAddress],
    userAddress,
    String(startTimestamp),
    String(durationDays)
  );

  // 7. Extract the decrypted value from results
  const decryptedValue = results[handle];

  if (decryptedValue === undefined) {
    throw new Error("No decrypted value found for handle");
  }

  return BigInt(decryptedValue);
}

// Check if FHEVM is ready
export function isFhevmReady(): boolean {
  return isInitialized && instance !== null;
}

// Get FHEVM error
export function getFhevmError(): string | null {
  return initError;
}

// Get FHEVM status
export function getFhevmStatus(): "idle" | "initializing" | "ready" | "error" {
  if (initError) return "error";
  if (isInitialized && instance) return "ready";
  if (isInitializing) return "initializing";
  return "idle";
}
