import fs from 'fs';
import path from 'path';
import { Pool } from '@neondatabase/serverless';
import {
  User,
  Student,
  LaundryItem,
  RateHistory,
  Receipt,
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

// Data file path for local offline fallback
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'laundry_db.json');

export interface LocalDatabaseSchema {
  users: User[];
  students: Student[];
  items: LaundryItem[];
  rate_history: RateHistory[];
  receipts: Receipt[];
  audit_logs: AuditLog[];
  settings: SettingsMap;
}

let neonPool: Pool | null = null;

if (process.env.DATABASE_URL) {
  try {
    neonPool = new Pool({ connectionString: process.env.DATABASE_URL });
  } catch (err) {
    console.error('Failed to initialize Neon pool:', err);
  }
}

function ensureLocalDbFile(): LocalDatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initialData: LocalDatabaseSchema = {
      users: DEFAULT_USERS,
      students: DEFAULT_STUDENTS,
      items: DEFAULT_ITEMS,
      rate_history: [],
      receipts: INITIAL_RECEIPTS,
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
      settings: DEFAULT_SETTINGS,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading local db file, re-creating:', e);
    const initialData: LocalDatabaseSchema = {
      users: DEFAULT_USERS,
      students: DEFAULT_STUDENTS,
      items: DEFAULT_ITEMS,
      rate_history: [],
      receipts: INITIAL_RECEIPTS,
      audit_logs: [],
      settings: DEFAULT_SETTINGS,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveLocalDb(data: LocalDatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Universal Database Client for Jamia Laundry Management System.
 * Supports both Neon PostgreSQL on Vercel and resilient offline local storage.
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

  // High-level API for Application Operations
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
      const res = await neonPool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
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

  async getStudents(searchQuery?: string): Promise<Student[]> {
    if (neonPool) {
      if (searchQuery) {
        const q = `%${searchQuery}%`;
        const res = await neonPool.query(
          `SELECT * FROM students WHERE reg_no ILIKE $1 OR name ILIKE $1 OR father_name ILIKE $1 OR class_name ILIKE $1 OR iqamat ILIKE $1 ORDER BY reg_no ASC`,
          [q]
        );
        return res.rows;
      }
      const res = await neonPool.query('SELECT * FROM students ORDER BY reg_no ASC');
      return res.rows;
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
      const res = await neonPool.query('SELECT * FROM students WHERE LOWER(reg_no) = LOWER($1) LIMIT 1', [regNo]);
      return res.rows[0] || null;
    }
    const data = ensureLocalDbFile();
    return data.students.find(s => s.reg_no.trim().toLowerCase() === regNo.trim().toLowerCase()) || null;
  },

  async saveStudent(student: Student): Promise<Student> {
    if (neonPool) {
      await neonPool.query(
        `INSERT INTO students (id, reg_no, name, father_name, class_name, section, iqamat, photo_url, contact, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
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

  async getItems(): Promise<LaundryItem[]> {
    if (neonPool) {
      const res = await neonPool.query('SELECT * FROM items ORDER BY display_order ASC');
      return res.rows;
    }
    const data = ensureLocalDbFile();
    return data.items.sort((a, b) => a.display_order - b.display_order);
  },

  async saveItem(item: LaundryItem, changedBy: string = 'Admin'): Promise<LaundryItem> {
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

  async getReceipts(filters?: {
    type?: string;
    status?: string;
    student_id?: string;
    from_date?: string;
    to_date?: string;
    operator_id?: string;
    payment_status?: string;
  }): Promise<Receipt[]> {
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
    const data = ensureLocalDbFile();
    return data.receipts.find(r => r.receipt_no.trim().toLowerCase() === receiptNo.trim().toLowerCase()) || null;
  },

  async getReceiptById(id: string): Promise<Receipt | null> {
    const data = ensureLocalDbFile();
    return data.receipts.find(r => r.id === id) || null;
  },

  async generateNextReceiptNo(type: 'Sarkari' | 'Private'): Promise<string> {
    const data = ensureLocalDbFile();
    const prefix = type === 'Sarkari' ? 'S-' : 'P-';
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

  async getSettings(): Promise<SettingsMap> {
    const data = ensureLocalDbFile();
    return data.settings;
  },

  async updateSettings(newSettings: Partial<SettingsMap>, updatedBy: string): Promise<SettingsMap> {
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

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const data = ensureLocalDbFile();
    return data.audit_logs.slice(0, limit);
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'date_time'>): Promise<void> {
    const data = ensureLocalDbFile();
    data.audit_logs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      date_time: new Date().toISOString(),
      ...log,
    });
    saveLocalDb(data);
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
