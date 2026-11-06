import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { LaundryItem } from '@/types';

export async function GET() {
  try {
    const items = await db.getItems();
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name_ur || !body.name_en) {
      return NextResponse.json({ error: 'Urdu and English item names are required' }, { status: 400 });
    }

    const newItem: LaundryItem = {
      id: body.id || `itm_${Date.now()}`,
      name_ur: body.name_ur.trim(),
      name_en: body.name_en.trim(),
      display_order: Number(body.display_order) || 1,
      private_rate: Number(body.private_rate) || 0,
      allowed_sarkari: body.allowed_sarkari !== false,
      allowed_private: body.allowed_private !== false,
      active: body.active !== false,
    };

    const saved = await db.saveItem(newItem, session.fullName);

    await db.addAuditLog({
      user_id: session.userId,
      user_name: session.fullName,
      action: 'UPDATE',
      table_name: 'items',
      record_id: newItem.id,
      reason: `Item ${newItem.name_en} (${newItem.name_ur}) saved with rate Rs ${newItem.private_rate}`,
    });

    return NextResponse.json({ success: true, item: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
