# Jamia Laundry Management System (جامعہ لانڈری مینجمنٹ سسٹم)
### Clothes Collection, Thermal Receipt Printing, Billing and Reporting System
Built with **React & Node.js (Next.js 14 App Router)**, tailored for **Vercel** serverless deployment and **Neon** serverless PostgreSQL.

---

## 🌟 Key Highlights & PRD Coverage

- **Fast Clothes Collection (کاؤنٹر وصولی - Section 3.4)**:
  - Sub-second lookup by Registration Number with student photo, father's name (ولدیت), Class/Darja, Section, and Iqamat.
  - Automatic category detection: **Sarkari** (Free) if registered for the year AND today is a collection day (Tuesday & Friday default); otherwise **Private** (Paid per piece).
  - Admin override with mandatory logged reason if Sarkari laundry is submitted on non-collection days (SAR-04).
  - Duplicate day warning (COL-10) and pending uncollected receipts alert.
  - Full keyboard shortcuts (<kbd>Enter</kbd> navigation, <kbd>F9</kbd> or <kbd>Ctrl+P</kbd> to Save & Print, <kbd>Esc</kbd> to clear).
- **Thermal Mini Receipt Printing (Section 3.5)**:
  - 58 mm and 80 mm ESC/POS thermal printer layout with CSS print media queries.
  - Authentic Urdu Nastaliq/Naskh typography with Right-to-Left (RTL) formatting.
  - Unique sequential receipt numbers (`S-000101` for Sarkari, `P-000201` for Private).
  - Scannable QR code & barcode for delivery tracking.
  - One-click reprint with prominent `*** DUPLICATE ***` stamp and logged counter (RCP-06).
  - Dual-copy option: Student Copy + Clothes Bag Tag / Laundry Copy.
- **Processing and Return to Student (کپڑوں کی واپسی - Section 3.6)**:
  - Barcode / QR scanner receipt lookup (DLV-01) with student photo and item breakdown.
  - Unpaid Private bill enforcement: prompts operator to collect payment before delivery (DLV-02).
  - Bulk status update: mark today's Sarkari receipts as "Ready" for pickup with one click (DLV-03).
- **Laundry Items and Rate Management (Section 3.3)**:
  - Default madrasa items: شلوار (Shalwar), قمیض (Qameez), بنیان (Banyan), عمامہ (Imama), بستر (Bistar), کمبل (Kambal - Private only), رومال / ٹوپی / چادر, دیگر.
  - Configurable rates in PKR and display order; rate changes apply only to new receipts while preserving history (ITM-04).
- **Student Database & Bulk Import (Section 3.1)**:
  - Bulk import from Excel (.xlsx) / CSV with downloadable template and error preview (STU-02).
  - Re-import updates existing students matched by registration no without duplicates or losing laundry history (STU-04).
  - Integrated webcam snapshot capture for missing student photos (STU-03).
- **Reports R1 to R13 (Section 3.8)**:
  - R1: Daily Collection Report (item pieces breakdown, Sarkari vs Private, counter cash collected).
  - R2: Weekly / Date-range Summary.
  - R3: Student-wise Laundry History.
  - R4: Item-wise Volume Report.
  - R5: Sarkari Collection-day Load Report (Tuesday & Friday breakdown by class and hostel).
  - R6: Private Revenue Report (billed, collected, unpaid, discounts).
  - R7: Unpaid / Outstanding Balances Report.
  - R8: Pending Delivery Aging Report (highlights orders pending > 3 days).
  - R13: Bag / Load Sheet for laundry washing department.
  - Full Audit Log Trail (EDT-03 / USR-03).
  - Export to Excel (`.xlsx`) and formal A4 printable layout.
- **Offline / Local Counter Resilience (NFR-02)**:
  - Seamlessly runs in local offline counter mode with local file persistence in `.data/laundry_db.json` when internet is disconnected.
  - Automatically switches to Neon PostgreSQL when `DATABASE_URL` is configured.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 2. Install & Start
```bash
# Clone the repository
git clone <repo-url>
cd mysterious-einstein

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-seeded Login Accounts

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **Administrator** | Full access: items, rates, users, settings, overrides, audit logs, backup & restore |
| `operator` | `operator123` | **Counter Operator** | High-speed collection counter, delivery return, receipts reprint |
| `accounts` | `viewer123` | **Viewer** | View dashboards, financial summaries, and reports |

---

## 🗄️ Setting Up Neon PostgreSQL

1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech).
2. Copy your Neon connection string (e.g. `postgresql://user:pass@ep-sample-1234.us-east-2.aws.neon.tech/neondb?sslmode=require`).
3. Add it to your `.env.local` or environment settings:
   ```env
   DATABASE_URL=postgresql://user:pass@ep-sample-1234.us-east-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=your-secure-secret-key-2026
   ```
4. Run the database migration script:
   ```bash
   npm run db:init
   ```
   This executes the DDL in `src/lib/schema.sql` on your Neon cluster, creating all tables and indexes.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import this repository.
4. In the **Environment Variables** section, add:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `JWT_SECRET`: A secure string for session cookies.
5. Click **Deploy**. Vercel will build and launch the application on its global edge network.

---

## 🖨️ Thermal Receipt Printer Setup

1. **USB / ESC-POS Mini Printers (58 mm or 80 mm)**:
   - In **Settings** (`/settings`), choose **80mm** (standard) or **58mm** (portable mini).
   - In browser print dialog, set margins to **None** and paper size to 80mm roll.
   - The system utilizes `@media print` CSS rules formatted for thermal receipts with Urdu Nastaliq typography and high-density barcodes.
2. **Reprinting**:
   - In **Receipts** (`/receipts`), click the printer icon next to any receipt to reprint. The reprint will automatically be marked `*** DUPLICATE (Copy #N) ***` and logged in the audit trail.

---

## 📂 Project Structure

```
├── .data/                  # Resilient local persistent storage (offline fallback)
├── scripts/
│   └── init-db.mjs         # Neon PostgreSQL schema migration runner
├── src/
│   ├── app/
│   │   ├── api/            # Serverless Node.js API endpoints
│   │   │   ├── auth/       # Login, logout, session verification
│   │   │   ├── backup/     # Full database backup & restore
│   │   │   ├── deliveries/ # Return clothes & mark delivered
│   │   │   ├── items/      # Items & rate list
│   │   │   ├── receipts/   # Collection, billing & printing
│   │   │   ├── reports/    # Reports R1 to R13
│   │   │   ├── settings/   # Jamia details, days & printer config
│   │   │   ├── students/   # Student directory & Excel bulk import
│   │   │   └── users/      # Role-based user management
│   │   ├── counter/        # Fast collection counter (F1)
│   │   ├── deliveries/     # Deliveries & return (F2)
│   │   ├── items/          # Items & rate management
│   │   ├── login/          # Secure authentication screen
│   │   ├── receipts/       # All receipts & duplicate reprint
│   │   ├── reports/        # Interactive Reports Hub
│   │   ├── settings/       # System settings & backup
│   │   ├── students/       # Student management & photo webcam
│   │   ├── users/          # User accounts & role permissions
│   │   ├── globals.css     # Thermal print & Urdu font stylesheets
│   │   ├── layout.tsx      # App wrapper & RTL font setup
│   │   └── page.tsx        # Dashboard (DSH-01, DSH-02)
│   ├── components/
│   │   ├── Navbar.tsx              # Top navigation & collection day badge
│   │   ├── ThermalReceiptModal.tsx # 58mm/80mm thermal receipt viewer & printer
│   │   └── WebcamCaptureModal.tsx  # Webcam photo capture
│   ├── context/
│   │   └── AppContext.tsx          # Session, language & keyboard shortcut provider
│   ├── lib/
│   │   ├── auth.ts                 # JWT & bcrypt authentication routines
│   │   ├── db.ts                   # Universal Neon Postgres / local offline adapter
│   │   ├── i18n.ts                 # Bilingual Urdu & English dictionary
│   │   ├── schema.sql              # PostgreSQL DDL for Neon
│   │   ├── seed-data.ts            # Realistic Jamia seed dataset
│   │   └── thermal-printer.ts      # ESC/POS commands & QR code generator
│   └── types/
│       └── index.ts                # TypeScript interfaces
├── vercel.json             # Vercel deployment specification
└── package.json            # Node.js dependencies & scripts
```
