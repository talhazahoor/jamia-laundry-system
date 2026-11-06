import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role === 'Viewer') {
      return NextResponse.json({ error: 'Unauthorized to mark deliveries' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body; // 'deliver' | 'bulk_ready'

    if (action === 'deliver') {
      const { receipt_no, remarks, collect_payment_now } = body;
      if (!receipt_no) {
        return NextResponse.json({ error: 'Receipt number is required' }, { status: 400 });
      }

      const receipt = await db.getReceiptByNo(receipt_no);
      if (!receipt) {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
      }

      if (receipt.status === 'Cancelled') {
        return NextResponse.json({ error: 'This receipt is cancelled and cannot be delivered' }, { status: 400 });
      }

      if (receipt.status === 'Delivered') {
        return NextResponse.json({
          error: `This receipt was already delivered on ${new Date(receipt.delivered_on || '').toLocaleString()} by ${receipt.delivered_by || 'Staff'}`
        }, { status: 400 });
      }

      // Check unpaid private bill (DLV-02)
      if (receipt.type === 'Private' && receipt.payment_status === 'Unpaid') {
        if (!collect_payment_now) {
          return NextResponse.json({
            error: 'This private receipt is UNPAID. Payment must be collected before delivery.',
            requiresPayment: true,
            totalAmount: receipt.total_amount,
          }, { status: 402 });
        }
        // Mark payment as paid
        await db.markPaymentPaid(receipt.id, session.fullName);
      }

      const delivered = await db.updateReceiptStatus(
        receipt.id,
        'Delivered',
        session.fullName,
        remarks || 'Handed over clean clothes to student'
      );

      return NextResponse.json({
        success: true,
        message: 'Clothes delivered successfully to student',
        receipt: delivered,
      });
    }

    if (action === 'bulk_ready') {
      // Bulk mark all Received/In Process Sarkari receipts from today as Ready
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const receipts = await db.getReceipts({ type: 'Sarkari' });
      const target = receipts.filter(
        r => (r.status === 'Received' || r.status === 'In Process') &&
             new Date(r.date_time).getTime() >= startOfToday.getTime()
      );

      for (const r of target) {
        await db.updateReceiptStatus(r.id, 'Ready', session.fullName, 'Bulk marked as ready for pickup');
      }

      return NextResponse.json({
        success: true,
        updatedCount: target.length,
        message: `Marked ${target.length} Sarkari receipts as Ready for pickup`,
      });
    }

    return NextResponse.json({ error: 'Invalid delivery action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
