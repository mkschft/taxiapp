export type JwtPayload = {
  sub: string;
  type: 'access' | 'refresh';
  role: 'user' | 'admin';
  emailVerified: boolean;
  iat: number;
  exp: number;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
