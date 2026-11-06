import QRCode from 'qrcode';
import { Receipt, SettingsMap } from '@/types';

export interface PrintReceiptOptions {
  copyType?: 'STUDENT COPY' | 'LAUNDRY / BAG TAG' | 'DUPLICATE';
  paperWidth?: '58mm' | '80mm';
}

export async function generateReceiptQRDataUrl(receiptNo: string): Promise<string> {
  try {
    return await QRCode.toDataURL(receiptNo, {
      margin: 1,
      width: 140,
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

/**
 * Generates an ESC/POS raw text representation for hardware serial/USB network printers
 */
export function generateEscPosCommands(receipt: Receipt, settings: SettingsMap, isDuplicate = false): string {
  const line = '------------------------------------------\n';
  let out = '';

  out += `\x1b\x40`; // Initialize
  out += `\x1b\x61\x01`; // Center
  out += `${settings.jamia_name_en}\n`;
  out += `${settings.laundry_name_en}\n`;
  out += `Phone: ${settings.phone}\n`;
  out += line;

  if (isDuplicate || receipt.reprint_count > 0) {
    out += `*** DUPLICATE REPRINT (Copy #${receipt.reprint_count || 1}) ***\n`;
    out += line;
  }

  out += `\x1b\x61\x00`; // Left align
  out += `Receipt: ${receipt.receipt_no.padEnd(16)} Date: ${new Date(receipt.date_time).toLocaleDateString()}\n`;
  out += `Type: ${receipt.type.toUpperCase().padEnd(19)} Time: ${new Date(receipt.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
  out += `Operator: ${receipt.operator_name}\n`;
  out += line;
  out += `Reg No: ${receipt.student_reg_no || ''}   Name: ${receipt.student_name || ''}\n`;
  out += `S/O: ${receipt.father_name || ''}   Class: ${receipt.class_name || ''}\n`;
  out += `Iqamat: ${receipt.iqamat || ''}\n`;
  out += line;

  if (receipt.type === 'Private') {
    out += `Item              Qty    Rate    Amount\n`;
    out += line;
    receipt.items?.forEach(i => {
      const name = i.item_name_en.substring(0, 16).padEnd(16);
      const qty = i.quantity.toString().padStart(4);
      const rate = i.rate_at_time.toString().padStart(7);
      const amt = i.amount.toString().padStart(9);
      out += `${name}${qty}${rate}${amt}\n`;
    });
    out += line;
    out += `Total Pieces: ${receipt.total_pieces}     Total: Rs ${receipt.total_amount}\n`;
    out += `Status: ${receipt.payment_status.toUpperCase()}\n`;
  } else {
    out += `Item              Qty\n`;
    out += line;
    receipt.items?.forEach(i => {
      const name = i.item_name_en.substring(0, 20).padEnd(20);
      const qty = i.quantity.toString().padStart(4);
      out += `${name}${qty}\n`;
    });
    out += line;
    out += `Total Pieces: ${receipt.total_pieces}     Charge: Rs 0 (SARKARI)\n`;
  }

  out += `Ready on: ${receipt.expected_date}\n`;
  if (receipt.notes) {
    out += `Notes: ${receipt.notes}\n`;
  }
  out += line;
  out += `\x1b\x61\x01`; // Center
  out += `${settings.receipt_footer}\n`;
  out += `\x1d\x56\x41\x03`; // Cut paper
  return out;
}
