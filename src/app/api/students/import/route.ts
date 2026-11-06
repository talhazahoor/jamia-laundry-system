import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Student } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json({ error: 'Admin permission required for bulk import' }, { status: 403 });
    }

    const { students: incomingData } = await req.json();

    if (!Array.isArray(incomingData) || incomingData.length === 0) {
      return NextResponse.json({ error: 'No student records supplied' }, { status: 400 });
    }

    const errors: { row: number; reg_no?: string; error: string }[] = [];
    const validStudents: Student[] = [];
    const seenRegNos = new Set<string>();

    incomingData.forEach((row: any, idx: number) => {
      const rowNum = idx + 1;
      const regNo = String(row.reg_no || row['Registration No'] || '').trim();
      const name = String(row.name || row['Student Name'] || '').trim();
      const fatherName = String(row.father_name || row["Father's Name"] || row['Wildiyat'] || '').trim();
      const className = String(row.class_name || row['Class'] || row['Darja'] || '').trim();
      const iqamat = String(row.iqamat || row['Residence'] || '').trim();

      if (!regNo) {
        errors.push({ row: rowNum, error: 'Registration number is missing' });
        return;
      }

      if (seenRegNos.has(regNo.toLowerCase())) {
        errors.push({ row: rowNum, reg_no: regNo, error: `Duplicate registration no ${regNo} in import file` });
        return;
      }
      seenRegNos.add(regNo.toLowerCase());

      if (!name) {
        errors.push({ row: rowNum, reg_no: regNo, error: 'Student name is missing' });
        return;
      }
      if (!fatherName) {
        errors.push({ row: rowNum, reg_no: regNo, error: "Father's name (Wildiyat) is missing" });
        return;
      }
      if (!className) {
        errors.push({ row: rowNum, reg_no: regNo, error: 'Class / Darja is missing' });
        return;
      }
      if (!iqamat) {
        errors.push({ row: rowNum, reg_no: regNo, error: 'Iqamat (Residence) is missing' });
        return;
      }

      const isSarkariVal = row.is_sarkari ?? row['Sarkari'] ?? row['Laundry Category'];
      const isSarkari = isSarkariVal === true || isSarkariVal === '1' || isSarkariVal === 1 || String(isSarkariVal).toLowerCase() === 'sarkari';

      validStudents.push({
        id: `stu_${Date.now()}_${idx}`,
        reg_no: regNo,
        name,
        father_name: fatherName,
        class_name: className,
        section: String(row.section || row['Section'] || '').trim(),
        iqamat,
        contact: String(row.contact || row['Contact No'] || '').trim(),
        photo_url: String(row.photo_url || '').trim(),
        status: (row.status === 'Suspended' || row.status === 'Left') ? row.status : 'Active',
        is_sarkari: isSarkari,
        sarkari_start: isSarkari ? '2026-01-01' : undefined,
        sarkari_end: isSarkari ? '2026-12-31' : undefined,
      });
    });

    if (errors.length > 0 && validStudents.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Import failed due to validation errors',
        errors,
      }, { status: 400 });
    }

    const { added, updated } = await db.bulkUpsertStudents(validStudents);

    await db.addAuditLog({
      user_id: session.userId,
      user_name: session.fullName,
      action: 'IMPORT',
      table_name: 'students',
      record_id: 'bulk',
      reason: `Bulk imported students: ${added} added, ${updated} updated (${errors.length} skipped with errors)`,
    });

    return NextResponse.json({
      success: true,
      added,
      updated,
      skippedErrors: errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
