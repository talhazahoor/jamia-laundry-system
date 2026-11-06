import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { User, UserRole } from '@/types';
import { db } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'jamia-laundry-secret-key-2026-super-secure-token'
);

export const COOKIE_NAME = 'jamia_laundry_session';

export interface AuthSession {
  userId: string;
  username: string;
  role: UserRole;
  fullName: string;
}

export async function createToken(payload: AuthSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthSession;
  } catch (err) {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<AuthSession | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // In non-server context
    }
  }

  if (!token) return null;
  return await verifyToken(token);
}

export function hasPermission(role: UserRole, requiredRoles: UserRole[]): boolean {
  if (role === 'Administrator') return true;
  return requiredRoles.includes(role);
}
