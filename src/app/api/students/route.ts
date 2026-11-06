import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Student } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || undefined;

    const students = await db.getStudents(search);
    return NextResponse.json({ students });
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
    if (!body.reg_no || !body.name || !body.father_name || !body.class_name || !body.iqamat) {
      return NextResponse.json(
        { error: 'Required fields: reg_no, name, father_name, class_name, iqamat' },
        { status: 400 }
      );
    }

    const newStudent: Student = {
      id: body.id || `stu_${Date.now()}`,
      reg_no: body.reg_no.trim(),
      name: body.name.trim(),
      father_name: body.father_name.trim(),
      class_name: body.class_name.trim(),
      section: body.section?.trim() || '',
      iqamat: body.iqamat.trim(),
      photo_url: body.photo_url || '',
      contact: body.contact || '',
      status: body.status || 'Active',
      is_sarkari: !!body.is_sarkari,
      sarkari_start: body.sarkari_start || (body.is_sarkari ? '2026-01-01' : undefined),
      sarkari_end: body.sarkari_end || (body.is_sarkari ? '2026-12-31' : undefined),
    };

    const saved = await db.saveStudent(newStudent);

    await db.addAuditLog({
      user_id: session.userId,
      user_name: session.fullName,
      action: 'UPDATE',
      table_name: 'students',
      record_id: newStudent.reg_no,
      reason: `Student ${newStudent.reg_no} saved/updated`,
    });

    return NextResponse.json({ success: true, student: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
