import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const receipt = (await db.getReceiptById(params.id)) || (await db.getReceiptByNo(params.id));
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ receipt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body; // 'reprint' | 'pay' | 'update_status' | 'edit'

    const receipt = (await db.getReceiptById(params.id)) || (await db.getReceiptByNo(params.id));
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    if (action === 'reprint') {
      const updated = await db.markDuplicateReprint(receipt.id, session.fullName);
      return NextResponse.json({ success: true, receipt: updated, is_duplicate: true });
    }

    if (action === 'pay') {
      const updated = await db.markPaymentPaid(receipt.id, session.fullName);
      return NextResponse.json({ success: true, receipt: updated });
    }

    if (action === 'update_status') {
      const { status, remarks } = body;
      const updated = await db.updateReceiptStatus(receipt.id, status, session.fullName, remarks);
      return NextResponse.json({ success: true, receipt: updated });
    }

    // Full edit (EDT-01, EDT-02: Admin only with reason)
    if (action === 'edit') {
      if (session.role !== 'Administrator') {
        return NextResponse.json({ error: 'Only Administrator can edit a saved receipt' }, { status: 403 });
      }

      if (!body.reason) {
        return NextResponse.json({ error: 'Reason for edit is required' }, { status: 400 });
      }

      // Record audit
      await db.addAuditLog({
        user_id: session.userId,
        user_name: session.fullName,
        action: 'UPDATE',
        table_name: 'receipts',
        record_id: receipt.receipt_no,
        old_value: JSON.stringify(receipt),
        new_value: JSON.stringify(body.updatedData),
        reason: body.reason,
      });

      return NextResponse.json({ success: true, message: 'Receipt updated by Admin' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json({ error: 'Only Administrator can cancel a receipt' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reason = searchParams.get('reason');

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Cancellation reason is mandatory' }, { status: 400 });
    }

    const receipt = (await db.getReceiptById(params.id)) || (await db.getReceiptByNo(params.id));
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const cancelled = await db.cancelReceipt(receipt.id, reason, session.fullName);
    return NextResponse.json({ success: true, receipt: cancelled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
