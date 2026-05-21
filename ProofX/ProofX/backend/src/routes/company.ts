import crypto from 'crypto';
import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { evaluateRules, verifyProof } from '../services/zkp';
import { addNotification } from '../services/notifications';
import { decodeQrToken } from '../services/qr';
import {
  logVerificationOnChain,
  logVerifierDeletionOnChain,
  setRequirementsOnChain,
} from '../services/blockchain';
import {
  createCompanyRequirement,
  createVerificationLog,
  deleteVerifierAccount,
  findLatestVerificationByCompany,
  findUserById,
  findUserByQrToken,
  getCompanyRequirement,
  listVerificationLogsByCompany,
} from '../store/demoStore';

const router = Router();

router.get('/requirements', requireAuth, requireRole('company'), async (req: AuthRequest, res) => {
  const companyId = req.user?.id;
  if (!companyId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const company = findUserById(companyId);
  if (!company || company.role !== 'company') {
    return res.status(404).json({ message: 'Verifier account not found' });
  }

  const requirements = getCompanyRequirement(companyId);
  const history = listVerificationLogsByCompany(companyId);
  return res.json({
    rules: requirements?.rules || {},
    locked: Boolean(requirements),
    deletedAt: company.deletedAt || null,
    accountChainReference: company.accountCreatedChainReference || null,
    requirementChainReference: requirements?.chainReference || null,
    verificationHistory: history,
  });
});

router.post('/set-requirements', requireAuth, requireRole('company'), async (req: AuthRequest, res) => {
  const companyId = req.user?.id;
  const {
    minAge,
    degree,
    state,
    minIncome,
    requireWhitelistedIssuer,
    requireActiveCredential,
    name,
    issuer,
  } = req.body as {
    minAge?: number;
    degree?: string;
    state?: string;
    minIncome?: number;
    requireWhitelistedIssuer?: boolean;
    requireActiveCredential?: boolean;
    name?: string;
    issuer?: string;
  };
  if (!companyId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const company = findUserById(companyId);
  if (!company || company.role !== 'company') {
    return res.status(404).json({ message: 'Verifier account not found' });
  }
  if (company.deletedAt) {
    return res.status(403).json({ message: 'Deleted verifier accounts cannot create or use requirements.' });
  }
  if (getCompanyRequirement(companyId)) {
    return res.status(409).json({ message: 'This verifier account already has a permanent requirement policy.' });
  }

  const rules = {
    minAge: typeof minAge === 'number' && !Number.isNaN(minAge) ? Number(minAge) : undefined,
    degree: degree?.trim() || undefined,
    state: state?.trim() || undefined,
    minIncome: typeof minIncome === 'number' && !Number.isNaN(minIncome) ? Number(minIncome) : undefined,
    requireWhitelistedIssuer: requireWhitelistedIssuer !== false ? true : undefined,
    requireActiveCredential: requireActiveCredential !== false ? true : undefined,
    name: name?.trim() || undefined,
    issuer: issuer?.trim() || undefined,
  };

  const txHash = await setRequirementsOnChain(companyId, JSON.stringify(rules));
  const record = createCompanyRequirement(companyId, rules, txHash);

  return res.json({
    message: 'Requirements saved permanently for this verifier account.',
    rules: record.rules,
    chainReference: txHash,
  });
});

router.post('/verify-qr', requireAuth, requireRole('company'), async (req: AuthRequest, res) => {
  const companyId = req.user?.id;
  const { token } = req.body as { token?: string };
  if (!companyId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  const company = findUserById(companyId);
  if (!company || company.role !== 'company') {
    return res.status(404).json({ message: 'Verifier account not found' });
  }
  if (company.deletedAt) {
    return res.status(403).json({ message: 'Deleted verifier accounts cannot verify users.' });
  }

  const decoded = decodeQrToken(token);
  if (!decoded.valid) {
    return res.status(400).json({ message: 'QR token is invalid or has been tampered with' });
  }

  const user = findUserByQrToken(token);
  if (!user || !user.proof || !user.profile) {
    return res.status(404).json({ message: 'User record or proof not found' });
  }

  const requirements = getCompanyRequirement(companyId);
  if (!requirements) {
    return res.status(400).json({ message: 'Create your verifier requirements once before scanning QR codes.' });
  }

  const proofOk = await verifyProof(user.proof.publicSignals, user.proof.proofData);
  const evaluation = evaluateRules(user.profile, requirements.rules || {});
  const result = proofOk && evaluation.verified;
  const nullifier = crypto
    .createHash('sha256')
    .update(`${companyId}:${user.id}:${user.proof.proofData.generatedAt}`)
    .digest('hex');

  const chainReference = await logVerificationOnChain(String(user.id), companyId, result);
  const verificationLog = createVerificationLog({
    userId: String(user.id),
    userEmail: user.email,
    companyId,
    companyEmail: company.email,
    result,
    chainReference,
  });

  addNotification({
    userId: String(user.id),
    type: result ? 'verified' : 'rejected',
    message: result
      ? `${company.email} accepted your proof and this verification was anchored to the chain.`
      : `${company.email} rejected your proof against its stored requirements. The attempt was anchored to the chain.`,
    timestamp: new Date().toISOString(),
  });

  return res.json({
    verified: result,
    nameVerified: evaluation.nameVerified,
    ageVerified: evaluation.ageVerified,
    degreeVerified: evaluation.degreeVerified,
    stateVerified: evaluation.stateVerified,
    incomeVerified: evaluation.incomeVerified,
    issuerVerified: evaluation.issuerVerified,
    signatureVerified: evaluation.signatureVerified,
    revocationVerified: evaluation.revocationVerified,
    replayVerified: true,
    status: result ? 'VERIFIED' : 'NOT VERIFIED',
    companyRules: requirements.rules || {},
    verifierName: company.email,
    proofPackage: {
      issuer: user.proof.publicSignals.issuer,
      revocationId: user.proof.publicSignals.revocationId,
      issuerSignature: user.proof.publicSignals.issuerSignature,
      nullifier,
      proofHash: user.proof.proofData.proof,
      requestId: requirements.rules.requestId || 'req_demo',
    },
    trustLayer: {
      issuerWhitelist: evaluation.issuerVerified ? 'Checked' : 'Failed',
      issuerSignature: evaluation.signatureVerified ? 'Valid' : 'Invalid',
      revocationRegistry: evaluation.revocationVerified ? 'Active' : 'Revoked',
      nullifierRegistry: 'Persistent QR with per-check log anchor',
      verificationLog: 'Anchored',
    },
    verificationId: String(verificationLog.id),
    chainReference,
  });
});

router.get('/verification-result', requireAuth, requireRole('company'), async (req: AuthRequest, res) => {
  const companyId = req.user?.id;
  if (!companyId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const latest = findLatestVerificationByCompany(companyId);
  const history = listVerificationLogsByCompany(companyId);
  return res.json({
    result: latest
      ? {
          userId: latest.userId,
          userEmail: latest.userEmail,
          companyId: latest.companyId,
          companyEmail: latest.companyEmail,
          verified: latest.result,
          timestamp: latest.timestamp,
          chainReference: latest.chainReference,
        }
      : null,
    history,
  });
});

router.delete('/account', requireAuth, requireRole('company'), async (req: AuthRequest, res) => {
  const companyId = req.user?.id;
  if (!companyId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const company = findUserById(companyId);
  if (!company || company.role !== 'company') {
    return res.status(404).json({ message: 'Verifier account not found' });
  }
  if (company.deletedAt) {
    return res.status(400).json({ message: 'This verifier account is already deleted.' });
  }

  const chainReference = await logVerifierDeletionOnChain(companyId, company.email);
  const deleted = deleteVerifierAccount(companyId, chainReference);
  return res.json({
    message: 'Verifier account deleted. Previous verification history remains preserved for audit.',
    deletedAt: deleted?.deletedAt || null,
    chainReference,
  });
});

export default router;
