import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { extractProfileFromDocuments } from '../services/ocr';
import { generateProof } from '../services/zkp';
import { generateQrImage, generateQrToken } from '../services/qr';
import { getNotifications } from '../services/notifications';
import { storeCredentialHash } from '../services/blockchain';
import {
  findLatestVerificationByUser,
  findUserById,
  getCompanyRequirement,
  listVerificationLogsByUser,
  StoredProfile,
  updateUser,
} from '../store/demoStore';

const upload = multer();
const router = Router();

function mergeProfile(existing: StoredProfile | undefined, extracted: Awaited<ReturnType<typeof extractProfileFromDocuments>>) {
  const combinedSourceSummary = Array.from(new Set([...(existing?.sourceSummary || []), ...(extracted.sourceSummary || [])]));
  const mergedHash = existing?.documentHash
    ? crypto.createHash('sha256').update(`${existing.documentHash}:${extracted.documentHash}`).digest('hex')
    : extracted.documentHash;
  const issuer = existing?.issuer || extracted.issuer;
  const revocationId = `rev_${mergedHash.slice(0, 12)}`;
  const issuerSignature = crypto.createHash('sha256').update(`issuer:${issuer}:${mergedHash}:${revocationId}`).digest('hex');

  return {
    name: existing?.name || extracted.name,
    dob: existing?.dob || extracted.dob,
    degree: existing?.degree || extracted.degree,
    state: existing?.state || extracted.state,
    income: existing?.income || extracted.income,
    issuer,
    revocationId,
    issuerSignature,
    photoDataUrl: existing?.photoDataUrl || extracted.photoDataUrl,
    documentHash: mergedHash,
    sourceSummary: combinedSourceSummary,
  };
}

router.get('/profile', requireAuth, requireRole('user'), async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const qrUrl = user.qrToken
    ? `${process.env.APP_BASE_URL || 'http://localhost:5173'}/verify?token=${encodeURIComponent(user.qrToken)}`
    : null;
  const verificationHistory = listVerificationLogsByUser(userId).map((log) => ({
    ...log,
    verifierRules: getCompanyRequirement(log.companyId)?.rules || {},
  }));

  return res.json({
    profile: user.profile || null,
    proof: user.proof || null,
    qr: user.qrToken ? { qrToken: user.qrToken, qrUrl } : null,
    verificationHistory,
  });
});

router.post(
  '/upload-documents',
  requireAuth,
  requireRole('user'),
  upload.any(),
  async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const files = ((req.files as Express.Multer.File[] | undefined) || []).filter((file) =>
      ['photo', 'documents', 'certificate'].includes(file.fieldname),
    );
    if (files.length === 0) {
      return res.status(400).json({ message: 'Upload at least one photo or document.' });
    }

    const extracted = await extractProfileFromDocuments({ files });
    const profile = mergeProfile(user.profile, extracted);
    const proof = await generateProof(profile);
    const chainHash = await storeCredentialHash(userId, profile.documentHash || extracted.documentHash);

    updateUser(userId, {
      profile,
      proof,
    });

    return res.json({
      profile,
      proof,
      storage: {
        chainReference: chainHash,
        visibility: 'Raw documents remain off-chain. Only hashes are logged.',
      },
    });
  },
);

router.post('/generate-proof', requireAuth, requireRole('user'), async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = findUserById(userId);
  if (!user?.profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  const proof = await generateProof(user.profile);
  updateUser(userId, { proof });

  return res.json({
    proof,
    summary: {
      claimsReady: proof.publicSignals.issuedClaimSet,
      generatedAt: proof.proofData.generatedAt,
    },
  });
});

router.get('/get-qr', requireAuth, requireRole('user'), async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.proof) {
    return res.status(400).json({ message: 'Upload documents first so the system can build your profile proof.' });
  }

  if (!user.qrToken) {
    const qrToken = await generateQrToken(userId);
    updateUser(userId, { qrToken });
    user.qrToken = qrToken;
  }

  const qrUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/verify?token=${encodeURIComponent(user.qrToken)}`;
  const qrImage = await generateQrImage(qrUrl);
  return res.json({ qrUrl, qrToken: user.qrToken, qrImage });
});

router.get('/notifications', requireAuth, requireRole('user'), async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.json({ notifications: getNotifications(userId) });
});

router.get('/verification-result', requireAuth, requireRole('user'), async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const latest = findLatestVerificationByUser(userId);
  if (!latest) {
    return res.json({ result: null });
  }

  return res.json({
    result: {
      companyId: latest.companyId,
      companyEmail: latest.companyEmail,
      verified: latest.result,
      timestamp: latest.timestamp,
      reference: crypto.createHash('sha256').update(`${latest.userId}:${latest.companyId}:${latest.timestamp}`).digest('hex'),
    },
  });
});

export default router;
