import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

async function seed() {
  if (!connectionString) {
    console.error('DATABASE_URL is required to seed Neon');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  console.log('🌱 Seeding Neon PostgreSQL database with Jamia records...');

  try {
    // 1. Users
    const users = [
      {
        id: 'usr_admin',
        username: 'admin',
        password_hash: bcrypt.hashSync('admin123', 10),
        full_name: 'مولانا عبد الرحمٰن (مدیر لانڈری / Admin)',
        role: 'Administrator',
      },
      {
        id: 'usr_operator1',
        username: 'operator',
        password_hash: bcrypt.hashSync('operator123', 10),
        full_name: 'محمد احمد خان (کاؤنٹر آپریٹر 1)',
        role: 'Counter Operator',
      },
      {
        id: 'usr_viewer',
        username: 'accounts',
        password_hash: bcrypt.hashSync('viewer123', 10),
        full_name: 'قاری محمد اسلم (شعبہ حسابات / Viewer)',
        role: 'Viewer',
      },
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (id, username, password_hash, full_name, role, active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         ON CONFLICT (username) DO NOTHING`,
        [u.id, u.username, u.password_hash, u.full_name, u.role]
      );
    }
    console.log('✅ Users seeded');

    // 2. Items
    const items = [
      { id: 'itm_shalwar', name_ur: 'شلوار', name_en: 'Shalwar', display_order: 1, private_rate: 30, allowed_sarkari: true, allowed_private: true },
      { id: 'itm_qameez', name_ur: 'قمیض', name_en: 'Qameez', display_order: 2, private_rate: 40, allowed_sarkari: true, allowed_private: true },
      { id: 'itm_banyan', name_ur: 'بنیان', name_en: 'Banyan', display_order: 3, private_rate: 20, allowed_sarkari: true, allowed_private: true },
      { id: 'itm_imama', name_ur: 'عمامہ', name_en: 'Imama', display_order: 4, private_rate: 25, allowed_sarkari: true, allowed_private: true },
      { id: 'itm_bistar', name_ur: 'بستر', name_en: 'Bistar / Bedding', display_order: 5, private_rate: 60, allowed_sarkari: true, allowed_private: true },
      { id: 'itm_kambal', name_ur: 'کمبل', name_en: 'Kambal / Blanket', display_order: 6, private_rate: 150, allowed_sarkari: false, allowed_private: true },
      { id: 'itm_rumal_chaadar', name_ur: 'رومال / ٹوپی / تولیہ / چادر', name_en: 'Handkerchief / Cap / Towel / Shawl', display_order: 7, private_rate: 15, allowed_sarkari: true, allowed_private: true },
      { id: 'itm_other', name_ur: 'دیگر', name_en: 'Other', display_order: 8, private_rate: 30, allowed_sarkari: true, allowed_private: true },
    ];

    for (const item of items) {
      await pool.query(
        `INSERT INTO items (id, name_ur, name_en, display_order, private_rate, allowed_sarkari, allowed_private, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT (id) DO UPDATE SET
          name_ur = EXCLUDED.name_ur,
          name_en = EXCLUDED.name_en,
          private_rate = EXCLUDED.private_rate`,
        [item.id, item.name_ur, item.name_en, item.display_order, item.private_rate, item.allowed_sarkari, item.allowed_private]
      );
    }
    console.log('✅ Laundry items seeded');

    // 3. Students
    const students = [
      { id: 'stu_1001', reg_no: '1234', name: 'محمد علی', father_name: 'عبد اللہ', class_name: 'درجہ ثانیہ (Sania)', section: 'B', iqamat: 'ہاسٹل خالد بن ولید، کمرہ 12', contact: '0301-2345678', is_sarkari: true },
      { id: 'stu_1002', reg_no: '1235', name: 'حافظ بلال احمد', father_name: 'محمد صدیق', class_name: 'شعبہ حفظ القرآن', section: 'الف', iqamat: 'دارالارقم، کمرہ 4', contact: '0302-3456789', is_sarkari: true },
      { id: 'stu_1003', reg_no: '1236', name: 'اسامہ طارق', father_name: 'طارق محمود', class_name: 'درجہ اولیٰ (Oola)', section: 'A', iqamat: 'باب السلام، کمرہ 8', contact: '0303-4567890', is_sarkari: false },
      { id: 'stu_1004', reg_no: '1237', name: 'عبد الرحمٰن صدیقی', father_name: 'ابوبکر صدیقی', class_name: 'درجہ رابعہ (Rabia)', section: 'C', iqamat: 'ہاسٹل عثمان غنی، کمرہ 15', contact: '0304-5678901', is_sarkari: true },
      { id: 'stu_1005', reg_no: '1238', name: 'زبیر حسن', father_name: 'حسن رضا', class_name: 'دورۂ حدیث شریف (Daura)', section: 'A', iqamat: 'ڈے اسکالر (مقامی طالب علم)', contact: '0305-6789012', is_sarkari: false },
    ];

    for (const s of students) {
      await pool.query(
        `INSERT INTO students (id, reg_no, name, father_name, class_name, section, iqamat, photo_url, contact, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '', $8, 'Active', NOW(), NOW())
         ON CONFLICT (reg_no) DO UPDATE SET
          name = EXCLUDED.name,
          father_name = EXCLUDED.father_name,
          class_name = EXCLUDED.class_name,
          iqamat = EXCLUDED.iqamat`,
        [s.id, s.reg_no, s.name, s.father_name, s.class_name, s.section, s.iqamat, s.contact]
      );

      if (s.is_sarkari) {
        await pool.query(
          `INSERT INTO sarkari_registrations (id, student_id, academic_year, start_date, end_date, active)
           VALUES ($1, $2, '2026', '2026-01-01', '2026-12-31', true)
           ON CONFLICT DO NOTHING`,
          [`sar_${s.id}`, s.id]
        );
      }
    }
    console.log('✅ Students & Sarkari registrations seeded');

    // 4. Settings
    const settings = {
      jamia_name: 'جامعہ دارالعلوم اسلامیہ',
      jamia_name_en: 'Jamia Darul Uloom Islamia',
      laundry_name: 'مرکزی لانڈری ڈیپارٹمنٹ',
      laundry_name_en: 'Central Laundry Department',
      phone: '042-35800000 / 0300-1234567',
      address: 'مرکزی کیمپس، بالمقابل دارالاقامہ، لاہور',
      sarkari_collection_days: [2, 5],
      sarkari_turnaround_days: 2,
      private_turnaround_days: 1,
      paper_width: '80mm',
      print_copies: 1,
      print_barcode: true,
      receipt_header: 'JAMIA DARUL ULOOM LAUNDRY SERVICE',
      receipt_footer: 'کپڑے واپس لیتے وقت یہ پرچی دکھانا لازمی ہے۔ گمشدگی کی صورت میں فوراً مطلع فرمائیں۔',
      default_payment_status: 'Paid',
      language: 'ur',
      auto_lock_minutes: 30,
    };

    for (const [key, val] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, typeof val === 'object' ? JSON.stringify(val) : String(val)]
      );
    }
    console.log('✅ Settings seeded');

    // 5. Sample Receipts
    const receipts = [
      {
        id: 'rcp_101',
        receipt_no: 'S-000101',
        type: 'Sarkari',
        student_id: 'stu_1001',
        total_pieces: 4,
        total_amount: 0,
        discount: 0,
        payment_status: 'Paid',
        status: 'Ready',
        expected_date: '2026-11-08',
        notes: 'استری کی ضرورت ہے',
        items: [
          { item_id: 'itm_shalwar', item_name_ur: 'شلوار', item_name_en: 'Shalwar', quantity: 2, rate: 0, amount: 0 },
          { item_id: 'itm_qameez', item_name_ur: 'قمیض', item_name_en: 'Qameez', quantity: 2, rate: 0, amount: 0 },
        ]
      },
      {
        id: 'rcp_102',
        receipt_no: 'P-000201',
        type: 'Private',
        student_id: 'stu_1003',
        total_pieces: 4,
        total_amount: 140,
        discount: 0,
        payment_status: 'Paid',
        status: 'In Process',
        expected_date: '2026-11-07',
        notes: '',
        items: [
          { item_id: 'itm_shalwar', item_name_ur: 'شلوار', item_name_en: 'Shalwar', quantity: 2, rate: 30, amount: 60 },
          { item_id: 'itm_qameez', item_name_ur: 'قمیض', item_name_en: 'Qameez', quantity: 2, rate: 40, amount: 80 },
        ]
      }
    ];

    for (const r of receipts) {
      await pool.query(
        `INSERT INTO receipts (id, receipt_no, type, student_id, date_time, operator_id, operator_name, total_pieces, total_amount, discount, payment_status, status, expected_date, notes)
         VALUES ($1, $2, $3, $4, NOW(), 'usr_operator1', 'محمد احمد خان', $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (receipt_no) DO NOTHING`,
        [r.id, r.receipt_no, r.type, r.student_id, r.total_pieces, r.total_amount, r.discount, r.payment_status, r.status, r.expected_date, r.notes]
      );

      for (const itm of r.items) {
        await pool.query(
          `INSERT INTO receipt_items (id, receipt_id, item_id, item_name_ur, item_name_en, quantity, rate_at_time, amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [`ri_${r.id}_${itm.item_id}`, r.id, itm.item_id, itm.item_name_ur, itm.item_name_en, itm.quantity, itm.rate, itm.amount]
        );
      }
    }
    console.log('✅ Initial receipts seeded');

    console.log('🎉 Neon database is 100% seeded and operational!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
