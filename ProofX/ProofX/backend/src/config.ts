import dotenv from 'dotenv';

dotenv.config();

export const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proofx';
export const JWT_SECRET = process.env.JWT_SECRET || 'proofx-secret';
export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4000';
export const CHAIN_RPC = process.env.CHAIN_RPC || 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID';
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
