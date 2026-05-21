import crypto from 'crypto';

export interface ProfileInput {
  name?: string;
  dob?: string;
  degree?: string;
  state?: string;
  income?: number;
  issuer?: string;
  revocationId?: string;
  issuerSignature?: string;
  documentHash?: string;
}

export interface CompanyRules {
  minAge?: number;
  degree?: string;
  state?: string;
  minIncome?: number;
  requireWhitelistedIssuer?: boolean;
  requireActiveCredential?: boolean;
  name?: string;
  issuer?: string;
}

export interface ZKPResult {
  proofData: {
    scheme: string;
    proof: string;
    commitment: string;
    generatedAt: string;
  };
  publicSignals: {
    documentCommitment: string;
    issuer: string;
    revocationId: string;
    issuerSignature: string;
    issuedClaimSet: string[];
  };
}

function calculateAge(dob?: string) {
  if (!dob) {
    return 0;
  }

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthOffset = now.getUTCMonth() - birthDate.getUTCMonth();
  const dayOffset = now.getUTCDate() - birthDate.getUTCDate();
  if (monthOffset < 0 || (monthOffset === 0 && dayOffset < 0)) {
    age -= 1;
  }
  return Math.max(age, 0);
}

export async function generateProof(profile: ProfileInput): Promise<ZKPResult> {
  const payload = JSON.stringify({
    issuer: profile.issuer || 'DigiLocker',
    revocationId: profile.revocationId || '',
    issuerSignature: profile.issuerSignature || '',
    documentHash: profile.documentHash || '',
  });
  const commitment = crypto.createHash('sha256').update(payload).digest('hex');

  return {
    proofData: {
      scheme: 'snarkjs-demo',
      proof: crypto.createHash('sha256').update(`proof:${payload}`).digest('hex'),
      commitment,
      generatedAt: new Date().toISOString(),
    },
    publicSignals: {
      documentCommitment: commitment,
      issuer: profile.issuer || 'DigiLocker',
      revocationId: profile.revocationId || '',
      issuerSignature: profile.issuerSignature || '',
      issuedClaimSet: ['age predicate', 'state predicate', 'degree predicate', 'income predicate', 'issuer signature', 'revocation predicate'],
    },
  };
}

export async function verifyProof(
  publicSignals: ZKPResult['publicSignals'],
  proofData: ZKPResult['proofData'],
) {
  if (!publicSignals || !proofData) {
    return false;
  }

  return Boolean(
    proofData.scheme &&
      proofData.proof &&
      proofData.commitment &&
      proofData.commitment === publicSignals.documentCommitment,
  );
}

export function evaluateRules(profile: ProfileInput, rules: CompanyRules) {
  const whitelistedIssuers = new Set(['DigiLocker', 'UIDAI', 'NSDL', 'RBI Bank']);
  const age = calculateAge(profile.dob);
  const nameVerified = rules.name ? (profile.name || '').toLowerCase().includes(rules.name.toLowerCase()) : true;
  const ageVerified = typeof rules.minAge === 'number' ? age >= rules.minAge : true;
  const degreeVerified = rules.degree ? (profile.degree || '').toLowerCase() === rules.degree.toLowerCase() : true;
  const stateVerified = rules.state ? (profile.state || '').toLowerCase() === rules.state.toLowerCase() : true;
  const incomeVerified = typeof rules.minIncome === 'number' ? Number(profile.income || 0) >= rules.minIncome : true;
  const issuerMatches = rules.issuer ? (profile.issuer || '').toLowerCase() === rules.issuer.toLowerCase() : true;
  const issuerWhitelisted = rules.requireWhitelistedIssuer === false ? true : whitelistedIssuers.has(profile.issuer || '');
  const issuerVerified = issuerMatches && issuerWhitelisted;
  const signatureVerified = Boolean(profile.issuerSignature);
  const revocationVerified = rules.requireActiveCredential === false ? true : Boolean(profile.revocationId);

  return {
    nameVerified,
    ageVerified,
    degreeVerified,
    stateVerified,
    incomeVerified,
    issuerVerified,
    signatureVerified,
    revocationVerified,
    verified:
      nameVerified &&
      ageVerified &&
      degreeVerified &&
      stateVerified &&
      incomeVerified &&
      issuerVerified &&
      signatureVerified &&
      revocationVerified,
  };
}
