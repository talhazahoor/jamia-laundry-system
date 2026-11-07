import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const settings = await db.getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleUpdate(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json({ error: 'Administrator permission required' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await db.updateSettings(body, session.fullName || session.username || 'Administrator');

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}
