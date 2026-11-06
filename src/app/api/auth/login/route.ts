import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await db.getUserByUsername(username);
    if (!user || !user.active) {
      return NextResponse.json(
        { error: 'Invalid username or account is disabled' },
        { status: 401 }
      );
    }

    // Compare password
    const valid = user.password_hash ? bcrypt.compareSync(password, user.password_hash) : false;
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
    };

    const token = await createToken(sessionPayload);

    await db.addAuditLog({
      user_id: user.id,
      user_name: user.full_name,
      action: 'LOGIN',
      table_name: 'users',
      record_id: user.id,
      reason: 'User logged in successfully',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
