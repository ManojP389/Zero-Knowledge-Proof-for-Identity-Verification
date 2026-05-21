import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { createUser, findUserByEmail } from '../store/demoStore';
import { logVerifierAccountOnChain } from '../services/blockchain';

const router = Router();

type AuthRole = 'user' | 'company';

function createAuthResponse(user: { id: string; role: AuthRole; email: string }) {
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return { token, role: user.role, email: user.email };
}

async function registerHandler(req: Request, res: Response) {
  const { email, password, role } = req.body as { email?: string; password?: string; role?: AuthRole };
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'email, password, and role are required' });
  }

  if (!['user', 'company'].includes(role)) {
    return res.status(400).json({ message: 'Role must be user or company' });
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const accountCreatedChainReference = role === 'company' ? await logVerifierAccountOnChain(`pending:${email}`, email) : undefined;
  const user = createUser({ email, passwordHash, role, accountCreatedChainReference });
  return res.json(createAuthResponse({ id: user.id, role: user.role, email: user.email }));
}

router.post('/signup', registerHandler);
router.post('/register', registerHandler);

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (user.deletedAt) {
    return res.status(403).json({ message: 'This verifier account has been deleted and cannot be used again.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json(createAuthResponse({ id: user.id, role: user.role, email: user.email }));
});

export default router;
