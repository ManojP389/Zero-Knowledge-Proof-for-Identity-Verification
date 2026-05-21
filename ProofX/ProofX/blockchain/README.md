# ProofX Blockchain Layer

This directory contains the Ethereum smart contract for the ProofX zero-knowledge proof credential system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  ProofXCredentialManager.sol                                │
│  ├── storeCredentialHash()    → Store credential hash       │
│  ├── setRequirements()        → Set company requirements    │
│  ├── logVerification()        → Log verification results    │
│  └── verifyProofHash()        → Verify proof integrity      │
└─────────────────────────────────────────────────────────────┘
```

## What's Stored On-Chain

| Data | Storage | Description |
|------|---------|-------------|
| Credential Hash | ✅ | Hash of user credentials (NOT raw data) |
| Company Requirements | ✅ | Age, degree, and other verification rules |
| Verification Logs | ✅ | Immutable record of all verifications |
| Proof Hash | ✅ | ZKP proof integrity check |

## What's Off-Chain (Backend)

- Actual user data (encrypted)
- Proof generation (Circom + SnarkJS)
- QR code handling
- API logic

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure your environment:
- `SEPOLIA_RPC_URL`: Get from Alchemy or Infura
- `PRIVATE_KEY`: Your wallet private key
- `ETHERSCAN_API_KEY`: For contract verification

## Compile Contracts

```bash
npm run compile
```

## Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

## Deploy to Local Hardhat Network

```bash
# Start local node
npx hardhat node

# Deploy (in another terminal)
npm run deploy:localhost
```

## Run Tests

```bash
npm run test
```

## Contract Functions

### User Functions

```solidity
// Store credential hash
contract.storeCredentialHash(userId, credentialHash);

// Get credential hash
(bytes32 hash, uint256 timestamp) = contract.getCredentialHash(userId);

// Check if credential exists
bool exists = contract.hasCredential(userId);
```

### Company Functions

```solidity
// Set requirements (returns companyId)
uint256 companyId = contract.setRequirements('{"minAge": 18, "degree": "B.Tech"}');

// Update requirements
contract.updateRequirements(companyId, '{"minAge": 21}');

// Get requirements
string memory reqs = contract.getRequirements(companyId);
```

### Verification Functions

```solidity
// Log verification result
contract.logVerification(userId, companyId, true);

// Get verification logs
VerificationLog[] memory logs = contract.getVerificationLogs(userId);

// Verify proof hash
contract.verifyProofHash(userId, proofHash);
```

## Example Integration

```javascript
// Backend (Node.js) - Store credential hash
const { ethers } = require("ethers");
const contract = await ethers.getContractAt(
  "ProofXCredentialManager",
  CONTRACT_ADDRESS
);

// Store credential hash (not raw data)
const userId = ethers.keccak256(ethers.toUtf8Bytes("user_wallet_address"));
const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(credentialData)));
await contract.storeCredentialHash(userId, credentialHash);

// Company sets requirements
const requirements = JSON.stringify({ minAge: 18, degree: "B.Tech" });
const companyId = await contract.setRequirements(requirements);

// Log verification
await contract.logVerification(userId, companyId, true);
```

## Security Notes

- Raw user data is NEVER stored on-chain
- Only hashes are stored for privacy
- Company requirements are transparent
- All verifications are logged immutably

## License

MIT