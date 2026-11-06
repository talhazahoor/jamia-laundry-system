export type UserRole = 'Administrator' | 'Counter Operator' | 'Viewer';

export interface User {
  id: string;
  username: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at?: string;
}

export type StudentStatus = 'Active' | 'Left' | 'Suspended';
export type LaundryCategory = 'Sarkari' | 'Private';

export interface Student {
  id: string;
  reg_no: string;
  name: string;
  father_name: string;
  class_name: string; // Darja (e.g. Hifz, Oola, Sania, Salisa, Rabia, Khamisa, Sadisa, Aaliya, Daura-e-Hadith)
  section: string;
  iqamat: string; // Hostel / Room or Day Scholar
  photo_url?: string;
  contact?: string;
  status: StudentStatus;
  is_sarkari?: boolean;
  sarkari_start?: string;
  sarkari_end?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SarkariRegistration {
  id: string;
  student_id: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  active: boolean;
}

export interface LaundryItem {
  id: string;
  name_ur: string;
  name_en: string;
  display_order: number;
  private_rate: number;
  allowed_sarkari: boolean;
  allowed_private: boolean;
  active: boolean;
}

export interface RateHistory {
  id: string;
  item_id: string;
  old_rate: number;
  new_rate: number;
  changed_on: string;
  changed_by: string;
}

export type ReceiptType = 'Sarkari' | 'Private';
export type PaymentStatus = 'Paid' | 'Unpaid';
export type ReceiptStatus = 'Received' | 'In Process' | 'Ready' | 'Delivered' | 'Cancelled';

export interface ReceiptItem {
  id?: string;
  receipt_id?: string;
  item_id: string;
  item_name_ur: string;
  item_name_en: string;
  quantity: number;
  rate_at_time: number;
  amount: number;
}

export interface Receipt {
  id: string;
  receipt_no: string; // S-000123 or P-000456
  type: ReceiptType;
  student_id: string;
  student_reg_no?: string;
  student_name?: string;
  father_name?: string;
  class_name?: string;
  section?: string;
  iqamat?: string;
  photo_url?: string;
  date_time: string;
  operator_id: string;
  operator_name: string;
  total_pieces: number;
  total_amount: number;
  discount: number;
  payment_status: PaymentStatus;
  status: ReceiptStatus;
  expected_date: string;
  notes?: string;
  cancelled_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  is_duplicate?: boolean;
  reprint_count: number;
  items?: ReceiptItem[];
  delivered_on?: string;
  delivered_by?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  date_time: string;
  action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'REPRINT' | 'OVERRIDE' | 'LOGIN' | 'IMPORT' | 'DELIVERY';
  table_name: string;
  record_id: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
}

export interface SettingsMap {
  jamia_name: string;
  jamia_name_en: string;
  laundry_name: string;
  laundry_name_en: string;
  phone: string;
  address: string;
  sarkari_collection_days: number[]; // 2 for Tuesday, 5 for Friday
  sarkari_turnaround_days: number; // default 2
  private_turnaround_days: number; // default 1
  paper_width: '58mm' | '80mm';
  print_copies: 1 | 2;
  print_barcode: boolean;
  receipt_header: string;
  receipt_footer: string;
  default_payment_status: PaymentStatus;
  language: 'ur' | 'en';
  auto_lock_minutes: number;
}
