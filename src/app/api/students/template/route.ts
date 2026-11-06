import { NextResponse } from 'next/server';

export async function GET() {
  const csvContent = [
    'reg_no,name,father_name,class_name,section,iqamat,contact,is_sarkari,status',
    '2001,محمد عثمان,محمد اکرم,درجہ ثالثہ,A,"ہاسٹل ابوبکر، کمرہ 5",03001234567,1,Active',
    '2002,احمد رضا,عبد الرشید,درجہ رابعہ,B,"ہاسٹل عثمان، کمرہ 12",03002345678,0,Active',
    '2003,حافظ طلحہ,محمد سلیم,شعبہ تجوید,الف,"دارالارقم، کمرہ 3",03003456789,1,Active',
  ].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="jamia_students_import_template.csv"',
    },
  });
}
