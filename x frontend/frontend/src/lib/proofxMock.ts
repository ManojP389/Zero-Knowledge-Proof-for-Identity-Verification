export type VerificationRequest = {
  id: string;
  code: string;
  verifierName: string;
  minAge: number;
  requiredDegree: string;
  createdAt: string;
  requirementHash: string;
};

export type ProofPackage = {
  proofId: string;
  requestCode: string;
  requestId: string;
  holderAlias: string;
  generatedAt: string;
  encryptedAtRest: boolean;
  blockchainCredentialHash: string;
  blockchainAuditHash: string;
  revealedClaims: string[];
  hiddenFields: string[];
  age: number;
  degree: string;
  degreeQualified: boolean;
  ageQualified: boolean;
};

export type VerificationResult = {
  verified: boolean;
  checkedAt: string;
  request: VerificationRequest;
  proof: ProofPackage | null;
  matchedClaims: string[];
  hiddenFields: string[];
  failureReason?: string;
};

const ACTIVE_REQUEST_KEY = 'proofx.active-request';
const PROOFS_KEY = 'proofx.proofs';

const DEFAULT_REQUEST: VerificationRequest = {
  id: 'req-demo-2026',
  code: '4829301756',
  verifierName: 'TechCorp Hiring',
  minAge: 21,
  requiredDegree: 'B.Tech',
  createdAt: '2026-04-24T12:00:00.000Z',
  requirementHash: 'REQ-4829301756-21-BTECH',
};

export const DEFAULT_USER = {
  holderAlias: 'Prover Wallet 2048',
  name: 'Rahul Sharma',
  dob: '2000-05-10',
  degree: 'B.Tech in Computer Science',
};

const safeLocalStorage = () =>
  typeof window !== 'undefined' ? window.localStorage : null;

const randomDigits = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

const buildSimpleHash = (value: string) =>
  value
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 17), 0)
    .toString(16)
    .toUpperCase()
    .padStart(10, '0')
    .slice(0, 10);

export const getActiveRequest = (): VerificationRequest => {
  const storage = safeLocalStorage();
  const raw = storage?.getItem(ACTIVE_REQUEST_KEY);

  if (!raw) {
    return DEFAULT_REQUEST;
  }

  try {
    return JSON.parse(raw) as VerificationRequest;
  } catch {
    return DEFAULT_REQUEST;
  }
};

export const saveActiveRequest = (
  request: Omit<VerificationRequest, 'id' | 'code' | 'createdAt' | 'requirementHash'>,
) => {
  const nextRequest: VerificationRequest = {
    ...request,
    id: `req-${Date.now()}`,
    code: randomDigits(10),
    createdAt: new Date().toISOString(),
    requirementHash: `REQ-${buildSimpleHash(
      `${request.verifierName}-${request.minAge}-${request.requiredDegree}-${Date.now()}`,
    )}`,
  };

  safeLocalStorage()?.setItem(ACTIVE_REQUEST_KEY, JSON.stringify(nextRequest));
  return nextRequest;
};

export const createProofForRequest = (request: VerificationRequest): ProofPackage => {
  const age = calculateAge(DEFAULT_USER.dob);
  const degreeQualified = degreeMatches(DEFAULT_USER.degree, request.requiredDegree);
  const ageQualified = age >= request.minAge;

  return {
    proofId: `proof-${Date.now()}`,
    requestCode: request.code,
    requestId: request.id,
    holderAlias: DEFAULT_USER.holderAlias,
    generatedAt: new Date().toISOString(),
    encryptedAtRest: true,
    blockchainCredentialHash: `CRED-${buildSimpleHash(
      `${DEFAULT_USER.name}-${DEFAULT_USER.dob}-${DEFAULT_USER.degree}`,
    )}`,
    blockchainAuditHash: `AUD-${buildSimpleHash(
      `${request.code}-${request.requiredDegree}-${request.minAge}-${Date.now()}`,
    )}`,
    revealedClaims: [
      `Age is at least ${request.minAge}`,
      `Degree satisfies ${request.requiredDegree}`,
    ],
    hiddenFields: [
      'Full name',
      'Exact date of birth',
      'Certificate number',
      'Raw OCR extraction',
    ],
    age,
    degree: DEFAULT_USER.degree,
    degreeQualified,
    ageQualified,
  };
};

export const saveProof = (proof: ProofPackage) => {
  const storage = safeLocalStorage();
  if (!storage) {
    return;
  }

  const proofs = getProofs().filter(
    (existingProof) => existingProof.requestCode !== proof.requestCode,
  );
  proofs.unshift(proof);
  storage.setItem(PROOFS_KEY, JSON.stringify(proofs));
};

export const getProofs = (): ProofPackage[] => {
  const storage = safeLocalStorage();
  const raw = storage?.getItem(PROOFS_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ProofPackage[];
  } catch {
    return [];
  }
};

export const getProofByCode = (code: string) =>
  getProofs().find((proof) => proof.requestCode === code) ?? null;

export const buildVerificationResult = (
  code: string,
  request: VerificationRequest,
): VerificationResult => {
  const proof = getProofByCode(code);

  if (!proof) {
    return {
      verified: false,
      checkedAt: new Date().toISOString(),
      request,
      proof: null,
      matchedClaims: [],
      hiddenFields: [
        'Full name',
        'Exact date of birth',
        'Certificate number',
        'Raw OCR extraction',
      ],
      failureReason: 'No proof package was found for this verification code.',
    };
  }

  const verified =
    proof.requestId === request.id && proof.ageQualified && proof.degreeQualified;

  return {
    verified,
    checkedAt: new Date().toISOString(),
    request,
    proof,
    matchedClaims: proof.revealedClaims.filter((_claim, index) =>
      index === 0 ? proof.ageQualified : proof.degreeQualified,
    ),
    hiddenFields: proof.hiddenFields,
    failureReason: verified
      ? undefined
      : 'The proof was valid but did not satisfy every verifier requirement.',
  };
};

export const calculateAge = (dob: string) => {
  const birthDate = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

export const degreeMatches = (userDegree: string, requiredDegree: string) =>
  userDegree.toLowerCase().includes(requiredDegree.toLowerCase());

export const getQrPayload = (code: string) =>
  JSON.stringify({
    code,
  });
