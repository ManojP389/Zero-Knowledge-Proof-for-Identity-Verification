import crypto from 'crypto';
import QRCode from 'qrcode';

const QR_SECRET = process.env.QR_SECRET || 'proofx-qr-secret';

function signPayload(payload: string) {
  return crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
}

export async function generateQrToken(userId: string): Promise<string> {
  const payload = `${userId}:${Date.now()}`;
  const signature = signPayload(payload);
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export async function generateQrImage(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 2,
    color: {
      dark: '#102a43',
      light: '#fefcf6',
    },
  });
}

export function decodeQrToken(token: string) {
  const decoded = Buffer.from(token, 'base64url').toString('utf8');
  const [userId, timestamp, signature] = decoded.split(':');
  const payload = `${userId}:${timestamp}`;
  return {
    userId,
    timestamp: Number(timestamp),
    valid: signPayload(payload) === signature,
  };
}
