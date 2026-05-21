import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type Role = 'user' | 'company';

export interface StoredProfile {
  name?: string;
  dob?: string;
  degree?: string;
  state?: string;
  income?: number;
  issuer?: string;
  revocationId?: string;
  issuerSignature?: string;
  photoDataUrl?: string;
  documentHash?: string;
  sourceSummary?: string[];
}

export interface StoredProof {
  publicSignals: {
    documentCommitment: string;
    issuer: string;
    revocationId: string;
    issuerSignature: string;
    issuedClaimSet: string[];
  };
  proofData: {
    scheme: string;
    proof: string;
    commitment: string;
    generatedAt: string;
  };
}

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  profile?: StoredProfile;
  qrToken?: string;
  proof?: StoredProof;
  accountCreatedAt: string;
  accountCreatedChainReference?: string;
  deletedAt?: string;
  accountDeletedChainReference?: string;
}

export interface CompanyRequirementRules {
  requestId?: string;
  minAge?: number;
  degree?: string;
  state?: string;
  minIncome?: number;
  requireWhitelistedIssuer?: boolean;
  requireActiveCredential?: boolean;
  name?: string;
  issuer?: string;
}

export interface CompanyRequirementRecord {
  companyId: string;
  rules: CompanyRequirementRules;
  createdAt: string;
  chainReference?: string;
}

export interface VerificationLogRecord {
  id: string;
  userId: string;
  userEmail: string;
  companyId: string;
  companyEmail: string;
  result: boolean;
  timestamp: string;
  chainReference?: string;
}

export interface NotificationRecord {
  userId: string;
  message: string;
  type: 'verified' | 'rejected' | 'pending';
  timestamp: string;
}

interface DemoState {
  users: StoredUser[];
  companyRequirements: CompanyRequirementRecord[];
  verificationLogs: VerificationLogRecord[];
  notifications: NotificationRecord[];
}

const storePath = path.resolve(__dirname, '../../demo-store.json');

function createId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function readState(): DemoState {
  if (!fs.existsSync(storePath)) {
    return {
      users: [],
      companyRequirements: [],
      verificationLogs: [],
      notifications: [],
    };
  }

  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      companyRequirements: Array.isArray(parsed.companyRequirements) ? parsed.companyRequirements : [],
      verificationLogs: Array.isArray(parsed.verificationLogs) ? parsed.verificationLogs : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    };
  } catch {
    return {
      users: [],
      companyRequirements: [],
      verificationLogs: [],
      notifications: [],
    };
  }
}

function writeState(state: DemoState) {
  fs.writeFileSync(storePath, JSON.stringify(state, null, 2));
}

function updateState<T>(updater: (state: DemoState) => T): T {
  const state = readState();
  const result = updater(state);
  writeState(state);
  return result;
}

export function createUser(input: {
  email: string;
  passwordHash: string;
  role: Role;
  accountCreatedChainReference?: string;
}) {
  return updateState((state) => {
    const user: StoredUser = {
      id: createId('usr'),
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      accountCreatedAt: new Date().toISOString(),
      accountCreatedChainReference: input.accountCreatedChainReference,
    };
    state.users.push(user);
    return user;
  });
}

export function findUserByEmail(email: string) {
  return readState().users.find((user) => user.email === email) || null;
}

export function findUserById(id: string) {
  return readState().users.find((user) => user.id === id) || null;
}

export function findUserByQrToken(token: string) {
  return readState().users.find((user) => user.qrToken === token) || null;
}

export function updateUser(id: string, updates: Partial<StoredUser>) {
  return updateState((state) => {
    const index = state.users.findIndex((user) => user.id === id);
    if (index === -1) {
      return null;
    }

    const next = { ...state.users[index], ...updates };
    state.users[index] = next;
    return next;
  });
}

export function getCompanyRequirement(companyId: string) {
  return readState().companyRequirements.find((record) => record.companyId === companyId) || null;
}

export function createCompanyRequirement(
  companyId: string,
  rules: CompanyRequirementRules,
  chainReference?: string,
) {
  return updateState((state) => {
    const existing = state.companyRequirements.find((record) => record.companyId === companyId);
    if (existing) {
      throw new Error('Verifier requirements have already been created for this account.');
    }

    const record: CompanyRequirementRecord = {
      companyId,
      rules: { ...rules, requestId: rules.requestId || createId('req') },
      createdAt: new Date().toISOString(),
      chainReference,
    };
    state.companyRequirements.push(record);
    return record;
  });
}

export function deleteVerifierAccount(companyId: string, chainReference?: string) {
  return updateState((state) => {
    const index = state.users.findIndex((user) => user.id === companyId && user.role === 'company');
    if (index === -1) {
      return null;
    }

    const next: StoredUser = {
      ...state.users[index],
      deletedAt: new Date().toISOString(),
      accountDeletedChainReference: chainReference,
    };
    state.users[index] = next;
    return next;
  });
}

export function createVerificationLog(input: Omit<VerificationLogRecord, 'id' | 'timestamp'>) {
  return updateState((state) => {
    const log: VerificationLogRecord = {
      id: createId('ver'),
      timestamp: new Date().toISOString(),
      ...input,
    };
    state.verificationLogs.unshift(log);
    return log;
  });
}

export function listVerificationLogsByUser(userId: string) {
  return readState().verificationLogs.filter((log) => log.userId === userId);
}

export function listVerificationLogsByCompany(companyId: string) {
  return readState().verificationLogs.filter((log) => log.companyId === companyId);
}

export function findLatestVerificationByUser(userId: string) {
  return listVerificationLogsByUser(userId)[0] || null;
}

export function findLatestVerificationByCompany(companyId: string) {
  return listVerificationLogsByCompany(companyId)[0] || null;
}

export function addNotification(notification: NotificationRecord) {
  return updateState((state) => {
    state.notifications.unshift(notification);
    return notification;
  });
}

export function getNotifications(userId: string) {
  return readState().notifications.filter((item) => item.userId === userId);
}
