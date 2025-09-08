import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export function generateTotpSecret(labelEmail, issuer = 'MERN 2FA App') {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(labelEmail, issuer, secret);
  return { secret, otpauth };
}

export async function otpauthToPng(otpauth) {
  return QRCode.toDataURL(otpauth);
}

export function verifyTotp(token, secret) {
  return authenticator.verify({ token, secret });
}
