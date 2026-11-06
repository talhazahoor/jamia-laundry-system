import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { format, differenceInDays } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('report') || 'daily';
    const fromDate = searchParams.get('from_date') || format(new Date(), 'yyyy-MM-dd');
    const toDate = searchParams.get('to_date') || fromDate;
    const studentId = searchParams.get('student_id') || undefined;
    const operatorId = searchParams.get('operator_id') || undefined;
    const category = searchParams.get('category') || 'All'; // 'Sarkari' | 'Private' | 'All'

    const allReceipts = await db.getReceipts({
      from_date: fromDate,
      to_date: toDate,
      type: category !== 'All' ? category : undefined,
      student_id: studentId,
      operator_id: operatorId !== 'All' ? operatorId : undefined,
    });

    const items = await db.getItems();
    const settings = await db.getSettings();

    // R1: Daily Collection Report
    if (reportType === 'daily') {
      const sarkariReceipts = allReceipts.filter(r => r.type === 'Sarkari' && r.status !== 'Cancelled');
      const privateReceipts = allReceipts.filter(r => r.type === 'Private' && r.status !== 'Cancelled');
      const cancelledReceipts = allReceipts.filter(r => r.status === 'Cancelled');

      const itemTotalsSarkari: Record<string, number> = {};
      const itemTotalsPrivate: Record<string, number> = {};
      items.forEach(i => {
        itemTotalsSarkari[i.id] = 0;
        itemTotalsPrivate[i.id] = 0;
      });

      sarkariReceipts.forEach(r => {
        r.items?.forEach(i => {
          itemTotalsSarkari[i.item_id] = (itemTotalsSarkari[i.item_id] || 0) + i.quantity;
        });
      });

      privateReceipts.forEach(r => {
        r.items?.forEach(i => {
          itemTotalsPrivate[i.item_id] = (itemTotalsPrivate[i.item_id] || 0) + i.quantity;
        });
      });

      const privateCashCollected = privateReceipts
        .filter(r => r.payment_status === 'Paid')
        .reduce((sum, r) => sum + r.total_amount, 0);

      const privateUnpaidTotal = privateReceipts
        .filter(r => r.payment_status === 'Unpaid')
        .reduce((sum, r) => sum + r.total_amount, 0);

      return NextResponse.json({
        report: 'daily',
        fromDate,
        toDate,
        settings,
        summary: {
          totalReceipts: allReceipts.length,
          sarkariCount: sarkariReceipts.length,
          privateCount: privateReceipts.length,
          cancelledCount: cancelledReceipts.length,
          totalPieces: allReceipts.filter(r => r.status !== 'Cancelled').reduce((sum, r) => sum + r.total_pieces, 0),
          sarkariPieces: sarkariReceipts.reduce((sum, r) => sum + r.total_pieces, 0),
          privatePieces: privateReceipts.reduce((sum, r) => sum + r.total_pieces, 0),
          privateCashCollected,
          privateUnpaidTotal,
        },
        itemTotals: {
          sarkari: itemTotalsSarkari,
          private: itemTotalsPrivate,
          itemsList: items,
        },
        receipts: allReceipts,
      });
    }

    // R2: Weekly / Date-range Summary
    if (reportType === 'weekly' || reportType === 'date_range') {
      const dayMap: Record<string, {
        date: string;
        sarkariReceipts: number;
        privateReceipts: number;
        sarkariPieces: number;
        privatePieces: number;
        revenue: number;
        unpaid: number;
      }> = {};

      allReceipts.filter(r => r.status !== 'Cancelled').forEach(r => {
        const d = r.date_time.split('T')[0];
        if (!dayMap[d]) {
          dayMap[d] = {
            date: d,
            sarkariReceipts: 0,
            privateReceipts: 0,
            sarkariPieces: 0,
            privatePieces: 0,
            revenue: 0,
            unpaid: 0,
          };
        }
        if (r.type === 'Sarkari') {
          dayMap[d].sarkariReceipts++;
          dayMap[d].sarkariPieces += r.total_pieces;
        } else {
          dayMap[d].privateReceipts++;
          dayMap[d].privatePieces += r.total_pieces;
          if (r.payment_status === 'Paid') {
            dayMap[d].revenue += r.total_amount;
          } else {
            dayMap[d].unpaid += r.total_amount;
          }
        }
      });

      const daySummary = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json({
        report: reportType,
        fromDate,
        toDate,
        settings,
        days: daySummary,
        totals: {
          totalReceipts: allReceipts.length,
          sarkariPieces: daySummary.reduce((s, d) => s + d.sarkariPieces, 0),
          privatePieces: daySummary.reduce((s, d) => s + d.privatePieces, 0),
          totalRevenue: daySummary.reduce((s, d) => s + d.revenue, 0),
          totalUnpaid: daySummary.reduce((s, d) => s + d.unpaid, 0),
        }
      });
    }

    // R3: Student-wise History
    if (reportType === 'student_history') {
      let student = null;
      if (studentId) {
        student = (await db.getStudentByRegNo(studentId)) || (await db.getStudents()).find(s => s.id === studentId);
      }
      return NextResponse.json({
        report: 'student_history',
        student,
        receipts: allReceipts,
        totalReceipts: allReceipts.length,
        totalPieces: allReceipts.reduce((sum, r) => sum + r.total_pieces, 0),
        totalBilled: allReceipts.reduce((sum, r) => sum + r.total_amount, 0),
        pendingCount: allReceipts.filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled').length,
      });
    }

    // R4: Item-wise Report
    if (reportType === 'item_wise') {
      const breakdown = items.map(itm => {
        let sarkariQty = 0;
        let privateQty = 0;
        let totalAmt = 0;

        allReceipts.filter(r => r.status !== 'Cancelled').forEach(r => {
          const match = r.items?.find(i => i.item_id === itm.id);
          if (match) {
            if (r.type === 'Sarkari') {
              sarkariQty += match.quantity;
            } else {
              privateQty += match.quantity;
              totalAmt += match.amount;
            }
          }
        });

        return {
          item_id: itm.id,
          name_ur: itm.name_ur,
          name_en: itm.name_en,
          rate: itm.private_rate,
          sarkariQty,
          privateQty,
          totalQty: sarkariQty + privateQty,
          totalAmt,
        };
      });

      return NextResponse.json({
        report: 'item_wise',
        fromDate,
        toDate,
        settings,
        items: breakdown,
        grandTotalPieces: breakdown.reduce((sum, b) => sum + b.totalQty, 0),
        grandTotalRevenue: breakdown.reduce((sum, b) => sum + b.totalAmt, 0),
      });
    }

    // R5: Sarkari Collection Day Report
    if (reportType === 'sarkari_days') {
      const sarkariReceipts = allReceipts.filter(r => r.type === 'Sarkari' && r.status !== 'Cancelled');
      
      const classMap: Record<string, { className: string; students: Set<string>; pieces: number }> = {};
      const hostelMap: Record<string, { hostel: string; students: Set<string>; pieces: number }> = {};

      sarkariReceipts.forEach(r => {
        const cls = r.class_name || 'Other';
        const hst = r.iqamat || 'Other';
        const stId = r.student_reg_no || r.student_id;

        if (!classMap[cls]) classMap[cls] = { className: cls, students: new Set(), pieces: 0 };
        classMap[cls].students.add(stId);
        classMap[cls].pieces += r.total_pieces;

        if (!hostelMap[hst]) hostelMap[hst] = { hostel: hst, students: new Set(), pieces: 0 };
        hostelMap[hst].students.add(stId);
        hostelMap[hst].pieces += r.total_pieces;
      });

      return NextResponse.json({
        report: 'sarkari_days',
        fromDate,
        toDate,
        settings,
        totalSarkariReceipts: sarkariReceipts.length,
        totalSarkariPieces: sarkariReceipts.reduce((s, r) => s + r.total_pieces, 0),
        classBreakdown: Object.values(classMap).map(c => ({
          className: c.className,
          studentCount: c.students.size,
          pieces: c.pieces,
        })),
        hostelBreakdown: Object.values(hostelMap).map(h => ({
          hostel: h.hostel,
          studentCount: h.students.size,
          pieces: h.pieces,
        })),
      });
    }

    // R6: Private Revenue Report
    if (reportType === 'revenue') {
      const privateReceipts = allReceipts.filter(r => r.type === 'Private' && r.status !== 'Cancelled');
      const totalBilled = privateReceipts.reduce((sum, r) => sum + r.total_amount + r.discount, 0);
      const totalDiscount = privateReceipts.reduce((sum, r) => sum + r.discount, 0);
      const netBilled = privateReceipts.reduce((sum, r) => sum + r.total_amount, 0);
      const cashCollected = privateReceipts.filter(r => r.payment_status === 'Paid').reduce((sum, r) => sum + r.total_amount, 0);
      const unpaidOutstanding = privateReceipts.filter(r => r.payment_status === 'Unpaid').reduce((sum, r) => sum + r.total_amount, 0);

      return NextResponse.json({
        report: 'revenue',
        fromDate,
        toDate,
        settings,
        summary: {
          totalBilled,
          totalDiscount,
          netBilled,
          cashCollected,
          unpaidOutstanding,
          receiptCount: privateReceipts.length,
        },
        receipts: privateReceipts,
      });
    }

    // R7: Unpaid / Outstanding Report
    if (reportType === 'unpaid') {
      const unpaidReceipts = (await db.getReceipts({ type: 'Private', payment_status: 'Unpaid' }))
        .filter(r => r.status !== 'Cancelled');

      return NextResponse.json({
        report: 'unpaid',
        settings,
        receipts: unpaidReceipts,
        totalUnpaidCount: unpaidReceipts.length,
        totalUnpaidAmount: unpaidReceipts.reduce((sum, r) => sum + r.total_amount, 0),
      });
    }

    // R8: Pending Delivery Report with Age
    if (reportType === 'pending_delivery') {
      const pending = (await db.getReceipts())
        .filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled')
        .map(r => {
          const ageDays = differenceInDays(new Date(), new Date(r.date_time));
          return {
            ...r,
            age_days: Math.max(0, ageDays),
            is_overdue: ageDays >= 3,
          };
        })
        .sort((a, b) => b.age_days - a.age_days);

      return NextResponse.json({
        report: 'pending_delivery',
        settings,
        receipts: pending,
        totalPending: pending.length,
        overdueCount: pending.filter(p => p.is_overdue).length,
      });
    }

    // R13: Bag / Load Sheet
    if (reportType === 'bag_sheet') {
      const todayReceipts = allReceipts.filter(r => r.status !== 'Cancelled');
      return NextResponse.json({
        report: 'bag_sheet',
        fromDate,
        toDate,
        settings,
        receipts: todayReceipts,
        totalPieces: todayReceipts.reduce((sum, r) => sum + r.total_pieces, 0),
      });
    }

    // Audit logs
    if (reportType === 'audit_logs') {
      const logs = await db.getAuditLogs(150);
      return NextResponse.json({
        report: 'audit_logs',
        logs,
      });
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
