import { ethers } from 'ethers';
import { CHAIN_RPC, CONTRACT_ADDRESS } from '../config';

const CONTRACT_ABI = [
  'function storeCredentialHash(bytes32 userId, bytes32 hash) public',
  'function setRequirements(uint256 companyId, string rules) public',
  'function logVerification(bytes32 userId, uint256 companyId, bool result) public',
];

const PRIVATE_KEY = process.env.CHAIN_PRIVATE_KEY || '';

function toBytes32(value: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(value));
}

async function withContract<T>(action: (contract: ethers.Contract) => Promise<T>) {
  if (!CONTRACT_ADDRESS || !PRIVATE_KEY) {
    return null;
  }

  const provider = new ethers.JsonRpcProvider(CHAIN_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  return action(contract);
}

export async function storeCredentialHash(userId: string, hash: string) {
  const tx = await withContract((contract) => contract.storeCredentialHash(toBytes32(userId), hash.startsWith('0x') ? hash : `0x${hash}`));
  if (tx) {
    await tx.wait();
    return tx.hash as string;
  }

  return `simulated:${ethers.keccak256(ethers.toUtf8Bytes(`credential:${userId}:${hash}`))}`;
}

export async function setRequirementsOnChain(companyId: string, rules: string) {
  const companyNumericId = BigInt(`0x${toBytes32(companyId).slice(2, 18)}`);
  const tx = await withContract((contract) => contract.setRequirements(companyNumericId, rules));
  if (tx) {
    await tx.wait();
    return tx.hash as string;
  }

  return `simulated:${ethers.keccak256(ethers.toUtf8Bytes(`requirements:${companyId}:${rules}`))}`;
}

export async function logVerificationOnChain(userId: string, companyId: string, result: boolean) {
  const companyNumericId = BigInt(`0x${toBytes32(companyId).slice(2, 18)}`);
  const tx = await withContract((contract) => contract.logVerification(toBytes32(userId), companyNumericId, result));
  if (tx) {
    await tx.wait();
    return tx.hash as string;
  }

  return `simulated:${ethers.keccak256(ethers.toUtf8Bytes(`verification:${userId}:${companyId}:${String(result)}`))}`;
}

export async function logVerifierAccountOnChain(companyId: string, email: string) {
  return `simulated:${ethers.keccak256(ethers.toUtf8Bytes(`verifier-account:${companyId}:${email}`))}`;
}

export async function logVerifierDeletionOnChain(companyId: string, email: string) {
  return `simulated:${ethers.keccak256(ethers.toUtf8Bytes(`verifier-account-delete:${companyId}:${email}`))}`;
}
