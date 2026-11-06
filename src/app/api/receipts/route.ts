import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Receipt, ReceiptItem } from '@/types';
import { addDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const student_id = searchParams.get('student_id') || undefined;
    const from_date = searchParams.get('from_date') || undefined;
    const to_date = searchParams.get('to_date') || undefined;
    const operator_id = searchParams.get('operator_id') || undefined;
    const payment_status = searchParams.get('payment_status') || undefined;

    const receipts = await db.getReceipts({
      type,
      status,
      student_id,
      from_date,
      to_date,
      operator_id,
      payment_status,
    });

    return NextResponse.json({ receipts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role === 'Viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      student_reg_no,
      type, // 'Sarkari' | 'Private'
      items, // array of { item_id, quantity }
      payment_status, // 'Paid' | 'Unpaid'
      discount,
      notes,
      admin_override,
      override_reason,
    } = body;

    if (!student_reg_no || !type || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required receipt fields' }, { status: 400 });
    }

    const student = await db.getStudentByRegNo(student_reg_no);
    if (!student) {
      return NextResponse.json({ error: 'Student registration number not found' }, { status: 404 });
    }

    if (student.status !== 'Active') {
      return NextResponse.json({ error: `Student is inactive (${student.status})` }, { status: 400 });
    }

    const settings = await db.getSettings();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isSarkariDay = settings.sarkari_collection_days.includes(dayOfWeek);

    if (type === 'Sarkari') {
      if (!student.is_sarkari) {
        return NextResponse.json({
          error: 'This student is not registered for Sarkari laundry'
        }, { status: 400 });
      }

      if (!isSarkariDay && !admin_override) {
        return NextResponse.json({
          error: 'Today is not a Sarkari collection day. Admin override required.',
          requiresOverride: true,
        }, { status: 400 });
      }

      if (admin_override && session.role !== 'Administrator') {
        return NextResponse.json({
          error: 'Only an Administrator can provide a Sarkari collection day override'
        }, { status: 403 });
      }
    }

    // Validate quantities and build receipt items
    const allItems = await db.getItems();
    const itemMap = new Map(allItems.map(i => [i.id, i]));
    const receiptItems: ReceiptItem[] = [];
    let totalPieces = 0;
    let totalAmount = 0;

    for (const entry of items) {
      const qty = parseInt(entry.quantity, 10);
      if (isNaN(qty) || qty <= 0) continue;

      const itemDef = itemMap.get(entry.item_id);
      if (!itemDef || !itemDef.active) continue;

      if (type === 'Sarkari' && !itemDef.allowed_sarkari) {
        return NextResponse.json({
          error: `Item "${itemDef.name_ur} / ${itemDef.name_en}" is not allowed for Sarkari laundry`
        }, { status: 400 });
      }

      const rate = type === 'Private' ? itemDef.private_rate : 0;
      const lineAmt = type === 'Private' ? qty * rate : 0;

      totalPieces += qty;
      totalAmount += lineAmt;

      receiptItems.push({
        item_id: itemDef.id,
        item_name_ur: itemDef.name_ur,
        item_name_en: itemDef.name_en,
        quantity: qty,
        rate_at_time: rate,
        amount: lineAmt,
      });
    }

    if (totalPieces === 0) {
      return NextResponse.json({ error: 'At least one item must have quantity greater than zero' }, { status: 400 });
    }

    // Discount check (COL-06)
    const discountAmount = Math.max(0, Number(discount) || 0);
    if (discountAmount > 0 && session.role !== 'Administrator' && !body.discount_reason) {
      return NextResponse.json({ error: 'Discount requires Administrator approval or a specific reason' }, { status: 403 });
    }

    const netAmount = Math.max(0, totalAmount - discountAmount);
    const turnaroundDays = type === 'Sarkari' ? settings.sarkari_turnaround_days : settings.private_turnaround_days;
    const expectedDate = format(addDays(today, turnaroundDays), 'yyyy-MM-dd');

    // Generate unique sequential receipt number
    const receiptNo = await db.generateNextReceiptNo(type);

    const newReceipt: Receipt = {
      id: `rcp_${Date.now()}`,
      receipt_no: receiptNo,
      type,
      student_id: student.id,
      student_reg_no: student.reg_no,
      student_name: student.name,
      father_name: student.father_name,
      class_name: student.class_name,
      section: student.section,
      iqamat: student.iqamat,
      photo_url: student.photo_url,
      date_time: new Date().toISOString(),
      operator_id: session.userId,
      operator_name: session.fullName,
      total_pieces: totalPieces,
      total_amount: netAmount,
      discount: discountAmount,
      payment_status: type === 'Sarkari' ? 'Paid' : (payment_status || settings.default_payment_status),
      status: 'Received',
      expected_date: expectedDate,
      notes: notes || '',
      reprint_count: 0,
      items: receiptItems,
    };

    const saved = await db.createReceipt(newReceipt);

    // Audit log
    await db.addAuditLog({
      user_id: session.userId,
      user_name: session.fullName,
      action: 'CREATE',
      table_name: 'receipts',
      record_id: receiptNo,
      reason: admin_override
        ? `Created ${type} receipt with override: ${override_reason || 'Admin permitted'}`
        : `Created ${type} receipt for ${student.name} (${student.reg_no})`,
    });

    return NextResponse.json({
      success: true,
      receipt: saved,
      copies: settings.print_copies || 1,
      paper_width: settings.paper_width || '80mm',
    });
  } catch (error: any) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
