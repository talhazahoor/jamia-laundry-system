-- Jamia Laundry Management System Schema
-- PostgreSQL DDL for Neon Serverless Database

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrator', 'Counter Operator', 'Viewer')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    reg_no VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    section VARCHAR(100),
    iqamat VARCHAR(255) NOT NULL,
    photo_url TEXT,
    contact VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Left', 'Suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sarkari_registrations (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(64) PRIMARY KEY,
    name_ur VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 1,
    private_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    allowed_sarkari BOOLEAN DEFAULT TRUE,
    allowed_private BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rate_history (
    id VARCHAR(64) PRIMARY KEY,
    item_id VARCHAR(64) REFERENCES items(id) ON DELETE CASCADE,
    old_rate NUMERIC(10, 2) NOT NULL,
    new_rate NUMERIC(10, 2) NOT NULL,
    changed_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS receipts (
    id VARCHAR(64) PRIMARY KEY,
    receipt_no VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Sarkari', 'Private')),
    student_id VARCHAR(64) REFERENCES students(id) ON DELETE RESTRICT,
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    operator_id VARCHAR(64) REFERENCES users(id),
    operator_name VARCHAR(255) NOT NULL,
    total_pieces INT NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid')),
    status VARCHAR(30) DEFAULT 'Received' CHECK (status IN ('Received', 'In Process', 'Ready', 'Delivered', 'Cancelled')),
    expected_date DATE NOT NULL,
    notes TEXT,
    cancelled_reason TEXT,
    cancelled_by VARCHAR(255),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    is_duplicate BOOLEAN DEFAULT FALSE,
    reprint_count INT DEFAULT 0,
    delivered_on TIMESTAMP WITH TIME ZONE,
    delivered_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS receipt_items (
    id VARCHAR(64) PRIMARY KEY,
    receipt_id VARCHAR(64) REFERENCES receipts(id) ON DELETE CASCADE,
    item_id VARCHAR(64) REFERENCES items(id),
    item_name_ur VARCHAR(255) NOT NULL,
    item_name_en VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    rate_at_time NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    receipt_id VARCHAR(64) REFERENCES receipts(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_by VARCHAR(255) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(64) PRIMARY KEY,
    receipt_id VARCHAR(64) REFERENCES receipts(id) ON DELETE CASCADE,
    delivered_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_by VARCHAR(255) NOT NULL,
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    user_name VARCHAR(255) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(reg_no);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_no ON receipts(receipt_no);
CREATE INDEX IF NOT EXISTS idx_receipts_student_id ON receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date_time ON receipts(date_time);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_time ON audit_logs(date_time);
