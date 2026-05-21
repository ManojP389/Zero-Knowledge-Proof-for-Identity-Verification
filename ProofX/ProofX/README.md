# ProofX

ProofX is a full-stack zero-knowledge credential verification prototype with separate user and company interfaces, an Express backend, and an Ethereum trust layer.

## Architecture Summary

Frontend handles user interaction, backend performs data processing and zero-knowledge proof verification, and blockchain ensures trust through immutable storage of credentials and verification policies.

## What’s Included

- User portal for auth, document upload, profile preview, proof generation, QR generation, and notifications
- Company portal for rule setup, QR scanning, manual token verification, and result viewing
- Express APIs for auth, uploads, proof generation, QR issuance, verification, and notifications
- Solidity contract for credential hashes, company requirements, and verification logs
- Demo-friendly OCR, ZKP, and blockchain adapters that can be swapped for production integrations

## Tech Stack

- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Node.js + Express + TypeScript + MongoDB
- Blockchain: Solidity + Ethereum-compatible RPC

## API Surface

### User APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/user/upload-documents`
- `POST /api/user/generate-proof`
- `GET /api/user/get-qr`
- `GET /api/user/profile`
- `GET /api/user/notifications`

### Company APIs

- `GET /api/company/requirements`
- `POST /api/company/set-requirements`
- `POST /api/company/verify-qr`
- `GET /api/company/verification-result`

## Project Structure

- `frontend/` React UI for users and verifiers
- `backend/` Express server, models, routes, OCR/ZKP/QR/blockchain services
- `contracts/` Solidity contract and compiled ABI/bin artifacts

## Environment

Copy [.env.example](/Users/ayushsharma/Documents/ProofX/.env.example) to `backend/.env` and update values as needed:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/proofx
JWT_SECRET=proofx-secret
APP_BASE_URL=http://localhost:4000
CHAIN_RPC=https://sepolia.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=
CHAIN_PRIVATE_KEY=
QR_SECRET=proofx-qr-secret
DEMO_MODE=true
```

If MongoDB is not installed or `DEMO_MODE=true`, the backend falls back to demo mode and uses in-memory storage. If `CONTRACT_ADDRESS` and `CHAIN_PRIVATE_KEY` are omitted, blockchain writes are simulated.

## Run On Another PC

1. Install Node.js 18+.
2. Copy this project folder to the other machine.
3. From the project root, run `npm run install:all`.
4. Create `backend/.env` from `.env.example`.
5. Run `npm run build`.
6. Run `npm start`.
7. Open `http://localhost:4000`.

This production flow serves the built frontend and the API from the same Express server, so you do not need to run Vite on the other PC.

## Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo Flow

1. Sign up as a user and upload a photo plus certificate.
2. Generate the identity profile, then create a proof and QR.
3. Sign up as a company and define age/degree requirements.
4. Scan the QR or open the verifier link and submit the token.
5. View the pass/fail result without exposing raw user data.
