import fs from 'fs';
import path from 'path';
import os from 'os';
import { Pool } from '@neondatabase/serverless';
import {
  User,
  Student,
  LaundryItem,
  RateHistory,
  Receipt,
  ReceiptItem,
  AuditLog,
  SettingsMap
} from '@/types';
import {
  DEFAULT_USERS,
  DEFAULT_ITEMS,
  DEFAULT_STUDENTS,
  DEFAULT_SETTINGS,
  INITIAL_RECEIPTS
} from './seed-data';

// Determine writable directory for local storage (handles /tmp in AWS/Vercel serverless)
function getWritableDataPath(): { dir: string; file: string } {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  const baseDir = isServerless ? os.tmpdir() : process.cwd();
  const dir = path.join(baseDir, '.data');
  const file = path.join(dir, 'laundry_db.json');
  return { dir, file };
}

export interface LocalDatabaseSchema {
  users: User[];
  students: Student[];
  items: LaundryItem[];
  rate_history: RateHistory[];
  receipts: Receipt[];
  audit_logs: AuditLog[];
  settings: SettingsMap;
}

// In-memory fallback if file system is read-only
let memoryDb: LocalDatabaseSchema | null = null;

let neonPool: Pool | null = null;

if (process.env.DATABASE_URL) {
  try {
    neonPool = new Pool({ connectionString: process.env.DATABASE_URL });
  } catch (err) {
    console.error('Failed to initialize Neon pool:', err);
  }
}

function getInitialLocalData(): LocalDatabaseSchema {
  return {
    users: [...DEFAULT_USERS],
    students: [...DEFAULT_STUDENTS],
    items: [...DEFAULT_ITEMS],
    rate_history: [],
    receipts: [...INITIAL_RECEIPTS],
    audit_logs: [
      {
        id: 'log_001',
        user_id: 'usr_admin',
        user_name: 'Administrator',
        date_time: new Date().toISOString(),
        action: 'LOGIN',
        table_name: 'system',
        record_id: 'sys',
        reason: 'System initialized successfully'
      }
    ],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function ensureLocalDbFile(): LocalDatabaseSchema {
  if (memoryDb) return memoryDb;

  const { dir, file } = getWritableDataPath();
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(file)) {
      const initialData = getInitialLocalData();
      fs.writeFileSync(file, JSON.stringify(initialData, null, 2), 'utf-8');
      memoryDb = initialData;
      return initialData;
    }

    const content = fs.readFileSync(file, 'utf-8');
    memoryDb = JSON.parse(content);
    return memoryDb!;
  } catch (e) {
    console.warn('Filesystem read-only or error, using in-memory store:', e);
    if (!memoryDb) {
      memoryDb = getInitialLocalData();
    }
    return memoryDb;
  }
}

function saveLocalDb(data: LocalDatabaseSchema) {
  memoryDb = data;
  try {
    const { dir, file } = getWritableDataPath();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // Silently continue with memoryDb in read-only environment
  }
}

/**
 * Universal Database Client for Jamia Laundry Management System.
 * Fully supports Neon PostgreSQL in production, with fallback to local persistent/in-memory store.
 */
export const db = {
  isNeonEnabled(): boolean {
    return !!process.env.DATABASE_URL && !!neonPool;
  },

  async query(text: string, params: any[] = []): Promise<any> {
    if (neonPool) {
      return await neonPool.query(text, params);
    }
    throw new Error('Neon database is not configured. Use local adapter.');
  },

  // Users
  async getUsers(): Promise<User[]> {
    if (neonPool) {
      const res = await neonPool.query('SELECT * FROM users ORDER BY created_at ASC');
      return res.rows;
    }
    const data = ensureLocalDbFile();
    return data.users;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    if (neonPool) {
      const res = await neonPool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username]);
      return res.rows[0] || null;
    }
    const data = ensureLocalDbFile();
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async createUser(user: User): Promise<User> {
    if (neonPool) {
      await neonPool.query(
        `INSERT INTO users (id, username, password_hash, full_name, role, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, user.username, user.password_hash, user.full_name, user.role, user.active, user.created_at || new Date().toISOString()]
      );
      return user;
    }
    const data = ensureLocalDbFile();
    data.users.push(user);
    saveLocalDb(data);
    return user;
  },

  async updateUser(user: Partial<User> & { id: string }): Promise<void> {
    if (neonPool) {
      const sets: string[] = [];
      const values: any[] = [];
      let i = 1;
      if (user.full_name !== undefined) { sets.push(`full_name = $${i++}`); values.push(user.full_name); }
      if (user.role !== undefined) { sets.push(`role = $${i++}`); values.push(user.role); }
      if (user.active !== undefined) { sets.push(`active = $${i++}`); values.push(user.active); }
      if (user.password_hash !== undefined) { sets.push(`password_hash = $${i++}`); values.push(user.password_hash); }
      values.push(user.id);
      if (sets.length > 0) {
        await neonPool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${i}`, values);
      }
      return;
    }
    const data = ensureLocalDbFile();
    const idx = data.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...user };
      saveLocalDb(data);
    }
  },

  // Students
  async getStudents(searchQuery?: string): Promise<Student[]> {
    if (neonPool) {
      let sql = `
        SELECT s.*,
          COALESCE(sr.active, false) as is_sarkari,
          sr.start_date as sarkari_start,
          sr.end_date as sarkari_end
        FROM students s
        LEFT JOIN sarkari_registrations sr ON s.id = sr.student_id AND sr.active = true
      `;
      const params: any[] = [];
      if (searchQuery) {
        sql += ` WHERE s.reg_no ILIKE $1 OR s.name ILIKE $1 OR s.father_name ILIKE $1 OR s.class_name ILIKE $1 OR s.iqamat ILIKE $1`;
        params.push(`%${searchQuery}%`);
      }
      sql += ` ORDER BY s.reg_no ASC`;
      const res = await neonPool.query(sql, params);
      return res.rows.map(r => ({
        ...r,
        is_sarkari: !!r.is_sarkari,
      }));
    }
    const data = ensureLocalDbFile();
    if (!searchQuery) return data.students;
    const q = searchQuery.toLowerCase().trim();
    return data.students.filter(s =>
      s.reg_no.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.father_name.toLowerCase().includes(q) ||
      s.class_name.toLowerCase().includes(q) ||
      s.iqamat.toLowerCase().includes(q)
    );
  },

  async getStudentByRegNo(regNo: string): Promise<Student | null> {
    if (neonPool) {
      const sql = `
        SELECT s.*,
          COALESCE(sr.active, false) as is_sarkari,
          sr.start_date as sarkari_start,
          sr.end_date as sarkari_end
        FROM students s
        LEFT JOIN sarkari_registrations sr ON s.id = sr.student_id AND sr.active = true
        WHERE LOWER(s.reg_no) = LOWER($1)
        LIMIT 1
      `;
      const res = await neonPool.query(sql, [regNo]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        ...r,
        is_sarkari: !!r.is_sarkari,
      };
    }
    const data = ensureLocalDbFile();
    return data.students.find(s => s.reg_no.trim().toLowerCase() === regNo.trim().toLowerCase()) || null;
  },

  async saveStudent(student: Student): Promise<Student> {
    if (neonPool) {
      await neonPool.query(
        `INSERT INTO students (id, reg_no, name, father_name, class_name, section, iqamat, photo_url, contact, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         ON CONFLICT (reg_no) DO UPDATE SET
          name = EXCLUDED.name,
          father_name = EXCLUDED.father_name,
          class_name = EXCLUDED.class_name,
          section = EXCLUDED.section,
          iqamat = EXCLUDED.iqamat,
          photo_url = COALESCE(NULLIF(EXCLUDED.photo_url, ''), students.photo_url),
          contact = EXCLUDED.contact,
          status = EXCLUDED.status,
          updated_at = NOW()`,
        [
          student.id,
          student.reg_no,
          student.name,
          student.father_name,
          student.class_name,
          student.section || '',
          student.iqamat,
          student.photo_url || '',
          student.contact || '',
          student.status || 'Active',
        ]
      );

      // Handle Sarkari registration
      if (student.is_sarkari !== undefined) {
        await neonPool.query(
          `INSERT INTO sarkari_registrations (id, student_id, academic_year, start_date, end_date, active)
           VALUES ($1, $2, '2026', '2026-01-01', '2026-12-31', $3)
           ON CONFLICT (id) DO UPDATE SET active = EXCLUDED.active`,
          [`sar_${student.id}`, student.id, !!student.is_sarkari]
        );
      }
      return student;
    }

    const data = ensureLocalDbFile();
    const existingIndex = data.students.findIndex(s => s.reg_no.toLowerCase() === student.reg_no.toLowerCase());
    if (existingIndex !== -1) {
      data.students[existingIndex] = {
        ...data.students[existingIndex],
        ...student,
        photo_url: student.photo_url || data.students[existingIndex].photo_url,
        updated_at: new Date().toISOString()
      };
    } else {
      data.students.push({
        ...student,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    saveLocalDb(data);
    return student;
  },

  async bulkUpsertStudents(studentsList: Student[]): Promise<{ added: number; updated: number }> {
    let added = 0;
    let updated = 0;

    if (neonPool) {
      for (const item of studentsList) {
        const existing = await neonPool.query('SELECT id FROM students WHERE LOWER(reg_no) = LOWER($1)', [item.reg_no]);
        if (existing.rows.length > 0) {
          updated++;
        } else {
          added++;
        }
        await this.saveStudent(item);
      }
      return { added, updated };
    }

    const data = ensureLocalDbFile();
    for (const item of studentsList) {
      const idx = data.students.findIndex(s => s.reg_no.toLowerCase() === item.reg_no.toLowerCase());
      if (idx !== -1) {
        data.students[idx] = {
          ...data.students[idx],
          ...item,
          photo_url: item.photo_url || data.students[idx].photo_url,
          updated_at: new Date().toISOString()
        };
        updated++;
      } else {
        data.students.push({
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        added++;
      }
    }
    saveLocalDb(data);
    return { added, updated };
  },

  // Items & Rates
  async getItems(): Promise<LaundryItem[]> {
    if (neonPool) {
      const res = await neonPool.query('SELECT * FROM items ORDER BY display_order ASC');
      return res.rows.map(r => ({
        ...r,
        private_rate: Number(r.private_rate),
      }));
    }
    const data = ensureLocalDbFile();
    return data.items.sort((a, b) => a.display_order - b.display_order);
  },

  async saveItem(item: LaundryItem, changedBy: string = 'Admin'): Promise<LaundryItem> {
    if (neonPool) {
      const existing = await neonPool.query('SELECT private_rate FROM items WHERE id = $1', [item.id]);
      if (existing.rows.length > 0) {
        const oldRate = Number(existing.rows[0].private_rate);
        if (oldRate !== item.private_rate) {
          await neonPool.query(
            `INSERT INTO rate_history (id, item_id, old_rate, new_rate, changed_on, changed_by)
             VALUES ($1, $2, $3, $4, NOW(), $5)`,
            [`rh_${Date.now()}`, item.id, oldRate, item.private_rate, changedBy]
          );
        }
      }

      await neonPool.query(
        `INSERT INTO items (id, name_ur, name_en, display_order, private_rate, allowed_sarkari, allowed_private, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
          name_ur = EXCLUDED.name_ur,
          name_en = EXCLUDED.name_en,
          display_order = EXCLUDED.display_order,
          private_rate = EXCLUDED.private_rate,
          allowed_sarkari = EXCLUDED.allowed_sarkari,
          allowed_private = EXCLUDED.allowed_private,
          active = EXCLUDED.active`,
        [item.id, item.name_ur, item.name_en, item.display_order, item.private_rate, item.allowed_sarkari, item.allowed_private, item.active]
      );
      return item;
    }

    const data = ensureLocalDbFile();
    const idx = data.items.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      const oldRate = data.items[idx].private_rate;
      if (oldRate !== item.private_rate) {
        data.rate_history.push({
          id: `rh_${Date.now()}`,
          item_id: item.id,
          old_rate: oldRate,
          new_rate: item.private_rate,
          changed_on: new Date().toISOString(),
          changed_by: changedBy,
        });
      }
      data.items[idx] = { ...data.items[idx], ...item };
    } else {
      data.items.push(item);
    }
    saveLocalDb(data);
    return item;
  },

  // Receipts
  async getReceipts(filters?: {
    type?: string;
    status?: string;
    student_id?: string;
    from_date?: string;
    to_date?: string;
    operator_id?: string;
    payment_status?: string;
  }): Promise<Receipt[]> {
    if (neonPool) {
      let sql = `
        SELECT r.*,
          s.reg_no as student_reg_no,
          s.name as student_name,
          s.father_name,
          s.class_name,
          s.section,
          s.iqamat,
          s.photo_url
        FROM receipts r
        JOIN students s ON r.student_id = s.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let i = 1;

      if (filters?.type && filters.type !== 'All') {
        sql += ` AND LOWER(r.type) = LOWER($${i++})`;
        params.push(filters.type);
      }
      if (filters?.status && filters.status !== 'All') {
        sql += ` AND LOWER(r.status) = LOWER($${i++})`;
        params.push(filters.status);
      }
      if (filters?.payment_status && filters.payment_status !== 'All') {
        sql += ` AND LOWER(r.payment_status) = LOWER($${i++})`;
        params.push(filters.payment_status);
      }
      if (filters?.student_id) {
        sql += ` AND (r.student_id = $${i} OR s.reg_no = $${i++})`;
        params.push(filters.student_id);
      }
      if (filters?.operator_id && filters.operator_id !== 'All') {
        sql += ` AND r.operator_id = $${i++}`;
        params.push(filters.operator_id);
      }
      if (filters?.from_date) {
        sql += ` AND r.date_time >= $${i++}::timestamp`;
        params.push(filters.from_date);
      }
      if (filters?.to_date) {
        sql += ` AND r.date_time <= ($${i++}::timestamp + interval '1 day' - interval '1 second')`;
        params.push(filters.to_date);
      }

      sql += ` ORDER BY r.date_time DESC`;
      const res = await neonPool.query(sql, params);

      // Fetch items for these receipts
      const receiptsList: Receipt[] = [];
      for (const row of res.rows) {
        const itemRows = await neonPool.query(
          `SELECT * FROM receipt_items WHERE receipt_id = $1`,
          [row.id]
        );
        receiptsList.push({
          ...row,
          total_amount: Number(row.total_amount),
          discount: Number(row.discount),
          items: itemRows.rows.map(ri => ({
            ...ri,
            rate_at_time: Number(ri.rate_at_time),
            amount: Number(ri.amount),
          })),
        });
      }
      return receiptsList;
    }

    const data = ensureLocalDbFile();
    let result = [...data.receipts];

    if (filters?.type && filters.type !== 'All') {
      result = result.filter(r => r.type.toLowerCase() === filters.type?.toLowerCase());
    }
    if (filters?.status && filters.status !== 'All') {
      result = result.filter(r => r.status.toLowerCase() === filters.status?.toLowerCase());
    }
    if (filters?.payment_status && filters.payment_status !== 'All') {
      result = result.filter(r => r.payment_status.toLowerCase() === filters.payment_status?.toLowerCase());
    }
    if (filters?.student_id) {
      result = result.filter(r => r.student_id === filters.student_id || r.student_reg_no === filters.student_id);
    }
    if (filters?.operator_id && filters.operator_id !== 'All') {
      result = result.filter(r => r.operator_id === filters.operator_id);
    }
    if (filters?.from_date) {
      const from = new Date(filters.from_date).getTime();
      result = result.filter(r => new Date(r.date_time).getTime() >= from);
    }
    if (filters?.to_date) {
      const to = new Date(filters.to_date).getTime() + (24 * 3600 * 1000) - 1;
      result = result.filter(r => new Date(r.date_time).getTime() <= to);
    }

    return result.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
  },

  async getReceiptByNo(receiptNo: string): Promise<Receipt | null> {
    if (neonPool) {
      const sql = `
        SELECT r.*,
          s.reg_no as student_reg_no,
          s.name as student_name,
          s.father_name,
          s.class_name,
          s.section,
          s.iqamat,
          s.photo_url
        FROM receipts r
        JOIN students s ON r.student_id = s.id
        WHERE LOWER(r.receipt_no) = LOWER($1)
        LIMIT 1
      `;
      const res = await neonPool.query(sql, [receiptNo]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      const itemsRes = await neonPool.query(`SELECT * FROM receipt_items WHERE receipt_id = $1`, [row.id]);
      return {
        ...row,
        total_amount: Number(row.total_amount),
        discount: Number(row.discount),
        items: itemsRes.rows.map(ri => ({
          ...ri,
          rate_at_time: Number(ri.rate_at_time),
          amount: Number(ri.amount),
        })),
      };
    }
    const data = ensureLocalDbFile();
    return data.receipts.find(r => r.receipt_no.trim().toLowerCase() === receiptNo.trim().toLowerCase()) || null;
  },

  async getReceiptById(id: string): Promise<Receipt | null> {
    if (neonPool) {
      const sql = `
        SELECT r.*,
          s.reg_no as student_reg_no,
          s.name as student_name,
          s.father_name,
          s.class_name,
          s.section,
          s.iqamat,
          s.photo_url
        FROM receipts r
        JOIN students s ON r.student_id = s.id
        WHERE r.id = $1
        LIMIT 1
      `;
      const res = await neonPool.query(sql, [id]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      const itemsRes = await neonPool.query(`SELECT * FROM receipt_items WHERE receipt_id = $1`, [row.id]);
      return {
        ...row,
        total_amount: Number(row.total_amount),
        discount: Number(row.discount),
        items: itemsRes.rows.map(ri => ({
          ...ri,
          rate_at_time: Number(ri.rate_at_time),
          amount: Number(ri.amount),
        })),
      };
    }
    const data = ensureLocalDbFile();
    return data.receipts.find(r => r.id === id) || null;
  },

  async generateNextReceiptNo(type: 'Sarkari' | 'Private'): Promise<string> {
    const prefix = type === 'Sarkari' ? 'S-' : 'P-';

    if (neonPool) {
      const res = await neonPool.query(
        `SELECT receipt_no FROM receipts WHERE receipt_no LIKE $1 ORDER BY date_time DESC LIMIT 50`,
        [`${prefix}%`]
      );
      const nums = res.rows.map(r => {
        const numPart = parseInt(r.receipt_no.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      });
      const maxNum = nums.length > 0 ? Math.max(...nums) : (type === 'Sarkari' ? 100 : 200);
      return `${prefix}${(maxNum + 1).toString().padStart(6, '0')}`;
    }

    const data = ensureLocalDbFile();
    const matchingReceipts = data.receipts
      .filter(r => r.receipt_no.startsWith(prefix))
      .map(r => {
        const numPart = parseInt(r.receipt_no.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      });
    const maxNum = matchingReceipts.length > 0 ? Math.max(...matchingReceipts) : (type === 'Sarkari' ? 100 : 200);
    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
  },

  async createReceipt(receipt: Receipt): Promise<Receipt> {
    if (neonPool) {
      await neonPool.query(
        `INSERT INTO receipts (
          id, receipt_no, type, student_id, date_time, operator_id, operator_name,
          total_pieces, total_amount, discount, payment_status, status, expected_date, notes, reprint_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          receipt.id,
          receipt.receipt_no,
          receipt.type,
          receipt.student_id,
          receipt.date_time || new Date().toISOString(),
          receipt.operator_id,
          receipt.operator_name,
          receipt.total_pieces,
          receipt.total_amount,
          receipt.discount,
          receipt.payment_status,
          receipt.status || 'Received',
          receipt.expected_date,
          receipt.notes || '',
          receipt.reprint_count || 0
        ]
      );

      if (receipt.items) {
        for (const itm of receipt.items) {
          await neonPool.query(
            `INSERT INTO receipt_items (id, receipt_id, item_id, item_name_ur, item_name_en, quantity, rate_at_time, amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              `ri_${receipt.id}_${itm.item_id}`,
              receipt.id,
              itm.item_id,
              itm.item_name_ur,
              itm.item_name_en,
              itm.quantity,
              itm.rate_at_time,
              itm.amount
            ]
          );
        }
      }
      return receipt;
    }

    const data = ensureLocalDbFile();
    data.receipts.unshift(receipt);
    saveLocalDb(data);
    return receipt;
  },

  async updateReceiptStatus(
    id: string,
    status: Receipt['status'],
    updatedBy: string,
    remarks?: string
  ): Promise<Receipt | null> {
    if (neonPool) {
      const deliveredOn = status === 'Delivered' ? new Date().toISOString() : null;
      const deliveredBy = status === 'Delivered' ? updatedBy : null;

      await neonPool.query(
        `UPDATE receipts
         SET status = $1, delivered_on = COALESCE($2, delivered_on), delivered_by = COALESCE($3, delivered_by)
         WHERE id = $4`,
        [status, deliveredOn, deliveredBy, id]
      );

      await this.addAuditLog({
        user_id: updatedBy,
        user_name: updatedBy,
        action: status === 'Delivered' ? 'DELIVERY' : 'UPDATE',
        table_name: 'receipts',
        record_id: id,
        new_value: status,
        reason: remarks || `Status changed to ${status}`,
      });

      return await this.getReceiptById(id);
    }

    const data = ensureLocalDbFile();
    const idx = data.receipts.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const oldStatus = data.receipts[idx].status;
    data.receipts[idx].status = status;

    if (status === 'Delivered') {
      data.receipts[idx].delivered_on = new Date().toISOString();
      data.receipts[idx].delivered_by = updatedBy;
    }

    data.audit_logs.unshift({
      id: `log_${Date.now()}`,
      user_id: updatedBy,
      user_name: updatedBy,
      date_time: new Date().toISOString(),
      action: status === 'Delivered' ? 'DELIVERY' : 'UPDATE',
      table_name: 'receipts',
      record_id: data.receipts[idx].receipt_no,
      old_value: oldStatus,
      new_value: status,
      reason: remarks || `Status changed to ${status}`,
    });

    saveLocalDb(data);
    return data.receipts[idx];
  },

  async cancelReceipt(id: string, reason: string, cancelledBy: string): Promise<Receipt | null> {
    if (neonPool) {
      await neonPool.query(
        `UPDATE receipts
         SET status = 'Cancelled', cancelled_reason = $1, cancelled_by = $2, cancelled_at = NOW()
         WHERE id = $3`,
        [reason, cancelledBy, id]
      );

      await this.addAuditLog({
        user_id: cancelledBy,
        user_name: cancelledBy,
        action: 'CANCEL',
        table_name: 'receipts',
        record_id: id,
        new_value: 'Cancelled',
        reason: reason,
      });

      return await this.getReceiptById(id);
    }

    const data = ensureLocalDbFile();
    const idx = data.receipts.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const receipt = data.receipts[idx];
    const oldStatus = receipt.status;
    receipt.status = 'Cancelled';
    receipt.cancelled_reason = reason;
    receipt.cancelled_by = cancelledBy;
    receipt.cancelled_at = new Date().toISOString();

    data.audit_logs.unshift({
      id: `log_${Date.now()}`,
      user_id: cancelledBy,
      user_name: cancelledBy,
      date_time: new Date().toISOString(),
      action: 'CANCEL',
      table_name: 'receipts',
      record_id: receipt.receipt_no,
      old_value: oldStatus,
      new_value: 'Cancelled',
      reason: reason,
    });

    saveLocalDb(data);
    return receipt;
  },

  async markDuplicateReprint(id: string, operatorName: string): Promise<Receipt | null> {
    if (neonPool) {
      await neonPool.query(
        `UPDATE receipts
         SET is_duplicate = true, reprint_count = COALESCE(reprint_count, 0) + 1
         WHERE id = $1`,
        [id]
      );

      await this.addAuditLog({
        user_id: operatorName,
        user_name: operatorName,
        action: 'REPRINT',
        table_name: 'receipts',
        record_id: id,
        reason: 'Receipt duplicate printed',
      });

      return await this.getReceiptById(id);
    }

    const data = ensureLocalDbFile();
    const idx = data.receipts.findIndex(r => r.id === id);
    if (idx === -1) return null;

    data.receipts[idx].reprint_count = (data.receipts[idx].reprint_count || 0) + 1;
    data.receipts[idx].is_duplicate = true;

    data.audit_logs.unshift({
      id: `log_${Date.now()}`,
      user_id: operatorName,
      user_name: operatorName,
      date_time: new Date().toISOString(),
      action: 'REPRINT',
      table_name: 'receipts',
      record_id: data.receipts[idx].receipt_no,
      reason: `Reprinted receipt (Copy #${data.receipts[idx].reprint_count})`,
    });

    saveLocalDb(data);
    return data.receipts[idx];
  },

  async markPaymentPaid(id: string, receivedBy: string): Promise<Receipt | null> {
    if (neonPool) {
      await neonPool.query(
        `UPDATE receipts SET payment_status = 'Paid' WHERE id = $1`,
        [id]
      );

      await this.addAuditLog({
        user_id: receivedBy,
        user_name: receivedBy,
        action: 'UPDATE',
        table_name: 'receipts',
        record_id: id,
        old_value: 'Unpaid',
        new_value: 'Paid',
        reason: 'Payment collected at counter',
      });

      return await this.getReceiptById(id);
    }

    const data = ensureLocalDbFile();
    const idx = data.receipts.findIndex(r => r.id === id);
    if (idx === -1) return null;

    data.receipts[idx].payment_status = 'Paid';
    data.audit_logs.unshift({
      id: `log_${Date.now()}`,
      user_id: receivedBy,
      user_name: receivedBy,
      date_time: new Date().toISOString(),
      action: 'UPDATE',
      table_name: 'receipts',
      record_id: data.receipts[idx].receipt_no,
      old_value: 'Unpaid',
      new_value: 'Paid',
      reason: 'Payment collected at counter',
    });

    saveLocalDb(data);
    return data.receipts[idx];
  },

  // Settings
  async getSettings(): Promise<SettingsMap> {
    if (neonPool) {
      const res = await neonPool.query('SELECT * FROM settings');
      const map: any = { ...DEFAULT_SETTINGS };
      res.rows.forEach(r => {
        try {
          map[r.key] = JSON.parse(r.value);
        } catch {
          map[r.key] = r.value;
        }
      });
      return map as SettingsMap;
    }
    const data = ensureLocalDbFile();
    return data.settings;
  },

  async updateSettings(newSettings: Partial<SettingsMap>, updatedBy: string): Promise<SettingsMap> {
    if (neonPool) {
      for (const [key, val] of Object.entries(newSettings)) {
        await neonPool.query(
          `INSERT INTO settings (key, value)
           VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, typeof val === 'object' ? JSON.stringify(val) : String(val)]
        );
      }

      await this.addAuditLog({
        user_id: updatedBy,
        user_name: updatedBy,
        action: 'UPDATE',
        table_name: 'settings',
        record_id: 'all',
        reason: 'Settings updated',
      });

      return await this.getSettings();
    }

    const data = ensureLocalDbFile();
    data.settings = { ...data.settings, ...newSettings };
    data.audit_logs.unshift({
      id: `log_${Date.now()}`,
      user_id: updatedBy,
      user_name: updatedBy,
      date_time: new Date().toISOString(),
      action: 'UPDATE',
      table_name: 'settings',
      record_id: 'all',
      reason: 'Settings updated',
    });
    saveLocalDb(data);
    return data.settings;
  },

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    if (neonPool) {
      const res = await neonPool.query(
        `SELECT * FROM audit_logs ORDER BY date_time DESC LIMIT $1`,
        [limit]
      );
      return res.rows;
    }
    const data = ensureLocalDbFile();
    return data.audit_logs.slice(0, limit);
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'date_time'>): Promise<void> {
    if (neonPool) {
      try {
        await neonPool.query(
          `INSERT INTO audit_logs (id, user_id, user_name, date_time, action, table_name, record_id, old_value, new_value, reason)
           VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)`,
          [
            `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            log.user_id,
            log.user_name,
            log.action,
            log.table_name,
            log.record_id,
            log.old_value || null,
            log.new_value || null,
            log.reason || null
          ]
        );
        return;
      } catch (err) {
        console.error('Failed to write audit log to Neon:', err);
      }
    }

    try {
      const data = ensureLocalDbFile();
      data.audit_logs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        date_time: new Date().toISOString(),
        ...log,
      });
      saveLocalDb(data);
    } catch {
      // Ignore if read only
    }
  },

  async backupDatabase(): Promise<{ timestamp: string; data: LocalDatabaseSchema }> {
    const data = ensureLocalDbFile();
    return {
      timestamp: new Date().toISOString(),
      data,
    };
  },

  async restoreDatabase(restoredData: LocalDatabaseSchema, operatorName: string): Promise<boolean> {
    if (!restoredData.users || !restoredData.students || !restoredData.receipts) {
      throw new Error('Invalid backup structure');
    }
    saveLocalDb(restoredData);
    await this.addAuditLog({
      user_id: operatorName,
      user_name: operatorName,
      action: 'UPDATE',
      table_name: 'system',
      record_id: 'restore',
      reason: 'Full database restored from backup',
    });
    return true;
  }
};
