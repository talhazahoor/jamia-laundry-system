import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { reg_no: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const regNo = params.reg_no;
    const student = await db.getStudentByRegNo(regNo);

    if (!student) {
      return NextResponse.json({ found: false, error: 'طالب علم کا ریکارڈ نہیں ملا (Student not found)' }, { status: 404 });
    }

    if (student.status !== 'Active') {
      return NextResponse.json({
        found: true,
        active: false,
        student,
        error: `طالب علم فعال نہیں ہے (حالت: ${student.status})۔ کپڑے وصول نہیں کیے جا سکتے۔ (Student is not Active)`
      }, { status: 400 });
    }

    const settings = await db.getSettings();
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const isSarkariCollectionDay = settings.sarkari_collection_days.includes(dayOfWeek);

    // Check if student has valid Sarkari registration for this year
    let isSarkariEligible = !!student.is_sarkari;
    if (student.sarkari_end) {
      const endDate = new Date(student.sarkari_end);
      if (today > endDate) {
        isSarkariEligible = false;
      }
    }

    // Check pending undelivered receipts for this student
    const allStudentReceipts = await db.getReceipts({ student_id: student.id });
    const pendingReceipts = allStudentReceipts.filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled');

    // Check if student already submitted Sarkari laundry today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const existingTodaySarkari = allStudentReceipts.some(
      r => r.type === 'Sarkari' &&
           r.status !== 'Cancelled' &&
           new Date(r.date_time).getTime() >= startOfToday.getTime()
    );

    return NextResponse.json({
      found: true,
      active: true,
      student,
      isSarkariEligible,
      isSarkariCollectionDay,
      defaultType: (isSarkariEligible && isSarkariCollectionDay) ? 'Sarkari' : 'Private',
      hasExistingTodaySarkari: existingTodaySarkari,
      pendingReceipts,
      totalPendingPieces: pendingReceipts.reduce((sum, r) => sum + r.total_pieces, 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
