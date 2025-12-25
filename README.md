# Age Security

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Network](https://img.shields.io/badge/network-Sepolia-purple.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![FHE](https://img.shields.io/badge/powered%20by-Zama%20FHEVM-green.svg)

**Prove you're 18+ without revealing when you were born.** Your birth year is encrypted in browser, verified on chain via FHE, and only you can decrypt the result. Zero knowledge. Zero exposure.

## ⚡ Flow

```
Browser: birthYear → encrypt() → ciphertext
   ↓
Chain:   FHE.le(ciphertext, 2007) → encrypted boolean
   ↓
Browser: userDecrypt(signature) → true/false
```

## 🛠 Stack

| Layer | Tech |
|-------|------|
| Contract | Solidity + @fhevm/solidity v0.9 |
| Frontend | Next.js 14, wagmi, RainbowKit |
| FHE | @zama-fhe/relayer-sdk v0.3 |

## 📍 Deployed

**Sepolia**: [`0x053eD58bd6C58CC53dc51a884CFE7477D070d922`](https://sepolia.etherscan.io/address/0x053eD58bd6C58CC53dc51a884CFE7477D070d922#code)

## 🚀 Run

```bash
cd frontend && npm i && npm run dev
```

## 🧪 Tests

```bash
cd contracts && npm test
```

✅ 32 passing

## 🙏 Acknowledgments

- [Zama](https://zama.ai) — FHEVM infrastructure & relayer SDK
- [fhevm-react-template](https://github.com/0xNana/fhevm-react-template) — Project scaffold reference

## 📄 License

MIT
