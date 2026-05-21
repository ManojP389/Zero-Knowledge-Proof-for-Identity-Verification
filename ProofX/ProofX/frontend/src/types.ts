export interface ProfileData {
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

export interface VerificationHistoryItem {
  id: string;
  userId: string;
  userEmail: string;
  companyId: string;
  companyEmail: string;
  result: boolean;
  timestamp: string;
  chainReference?: string;
  verifierRules?: {
    requestId?: string;
    minAge?: number;
    degree?: string;
    state?: string;
    minIncome?: number;
    requireWhitelistedIssuer?: boolean;
    requireActiveCredential?: boolean;
    name?: string;
    issuer?: string;
  };
}

export interface ProofData {
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

export interface NotificationItem {
  userId: string;
  message: string;
  type: 'verified' | 'rejected' | 'pending';
  timestamp: string;
}

export interface VerificationResult {
  verified: boolean;
  nameVerified?: boolean;
  ageVerified: boolean;
  degreeVerified: boolean;
  stateVerified: boolean;
  incomeVerified: boolean;
  issuerVerified: boolean;
  signatureVerified: boolean;
  revocationVerified: boolean;
  replayVerified: boolean;
  status: string;
  companyRules?: {
    requestId?: string;
    minAge?: number;
    degree?: string;
    state?: string;
    minIncome?: number;
    requireWhitelistedIssuer?: boolean;
    requireActiveCredential?: boolean;
  };
  proofPackage?: {
    issuer: string;
    revocationId: string;
    issuerSignature: string;
    nullifier: string;
    proofHash: string;
    requestId: string;
  };
  trustLayer?: {
    issuerWhitelist: string;
    issuerSignature: string;
    revocationRegistry: string;
    nullifierRegistry: string;
    verificationLog: string;
  };
  verifierName?: string;
  verificationId?: string;
  chainReference?: string;
}
