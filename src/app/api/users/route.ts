import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { User } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json({ error: 'Administrator permission required' }, { status: 403 });
    }

    const users = await db.getUsers();
    // Do not return password hashes
    const sanitized = users.map(u => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      role: u.role,
      active: u.active,
      created_at: u.created_at,
    }));

    return NextResponse.json({ users: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json({ error: 'Administrator permission required' }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, full_name, role } = body;

    if (!username || !password || !full_name || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existing = await db.getUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: username.trim().toLowerCase(),
      password_hash: bcrypt.hashSync(password, 10),
      full_name: full_name.trim(),
      role: role,
      active: true,
      created_at: new Date().toISOString(),
    };

    await db.createUser(newUser);

    await db.addAuditLog({
      user_id: session.userId,
      user_name: session.fullName,
      action: 'CREATE',
      table_name: 'users',
      record_id: newUser.username,
      reason: `Created user ${newUser.username} with role ${newUser.role}`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json({ error: 'Administrator permission required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, full_name, role, active, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updatePayload: Partial<User> & { id: string } = { id };
    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (role !== undefined) updatePayload.role = role;
    if (active !== undefined) updatePayload.active = active;
    if (password) {
      updatePayload.password_hash = bcrypt.hashSync(password, 10);
    }

    await db.updateUser(updatePayload);

    await db.addAuditLog({
      user_id: session.userId,
      user_name: session.fullName,
      action: 'UPDATE',
      table_name: 'users',
      record_id: id,
      reason: `Updated user profile/permissions for ${id}`,
    });

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
