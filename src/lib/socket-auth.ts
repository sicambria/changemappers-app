import jwt, { type JwtPayload } from 'jsonwebtoken';

export type SocketTokenPayload = string | JwtPayload;


export function getSocketJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  throw new Error('JWT_SECRET must be set for the custom socket server');
}

export function verifySocketToken(token: string, secret: string = getSocketJwtSecret()): SocketTokenPayload {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });

  // Access tokens (generateTokens) sign the bare payload and carry NO `typ`
  // discriminator. Only non-access tokens set one — notably the short-lived
  // MFA-challenge token (typ='mfa_challenge'), which is signed with the same
  // JWT_SECRET but must grant nothing beyond the /verify-2fa step. Accept-list
  // the access-token shape: reject any verified token carrying a `typ`, so the
  // MFA-challenge token (and any future typ'd token) is inert on the realtime
  // boundary just as verifyAccessToken makes it inert on the HTTP boundary.
  // See docs/audits/findings/2026-06/AUDIT-20260613-045-socket-auth-accepts-mfa-challenge-token.md
  if (typeof decoded !== 'string' && decoded?.typ) {
    throw new Error('Token carrying a typ discriminator (e.g. MFA challenge) cannot authenticate a socket connection');
  }

  return decoded;
}
