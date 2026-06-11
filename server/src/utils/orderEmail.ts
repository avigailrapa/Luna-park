import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { smtpHost, smtpPort, smtpUser, smtpPass, nodeEnv } from '../config/env';
import { generateBarcodePng } from './barcode';
import type { IOrder } from '../models/Order';
import type { IUser } from '../models/User';

function getFromAddress(): string {
  if (smtpUser) {
    return `"לונה פארק" <${smtpUser}>`;
  }
  return 'לונה פארק <noreply@luna-park.local>';
}

const ticketsLogDir = path.join(__dirname, '../../logs/tickets');

let devTransporterPromise: Promise<Transporter> | null = null;

async function getDevTransporter(): Promise<Transporter> {
  if (!devTransporterPromise) {
    devTransporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      const transport = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log('Dev email: using Ethereal test account (no SMTP in .env)');
      return transport;
    })();
  }
  return devTransporterPromise;
}

function formatTicketType(order: IOrder): string {
  if (order.ticketType === 'full_day') {
    return 'יום שלם';
  }
  if (order.ticketType === 'hourly') {
    if (order.startHour != null && order.endHour != null) {
      const pad = (h: number) => String(h).padStart(2, '0');
      return `לפי שעה (${pad(order.startHour)}:00–${pad(order.endHour)}:00)`;
    }
    return `לפי שעה (${order.hoursAmount} שעות)`;
  }
  const ride = order.rideId as { name?: string } | null;
  const rideName = ride?.name || 'מתקן';
  return `מתקן: ${rideName}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildEmailHtml(userName: string, order: IOrder): string {
  const visitDate = formatDate(order.chosenDate);
  const ticketType = formatTicketType(order);
  const discountLine =
    order.discountApplied > 0
      ? `<p><strong>הנחה:</strong> ₪${order.discountApplied}</p>`
      : '';

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2>לונה פארק — אישור הזמנה</h2>
      <p>שלום ${userName},</p>
      <p>תודה על ההזמנה! הנה פרטי הכרטיס שלך:</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
        <p><strong>קוד כרטיס:</strong> ${order.ticketCode}</p>
        <p><strong>תאריך ביקור:</strong> ${visitDate}</p>
        <p><strong>סוג:</strong> ${ticketType}</p>
        <p><strong>מחיר בסיס:</strong> ₪${order.totalPrice}</p>
        ${discountLine}
        <p><strong>סה״כ שולם:</strong> ₪${order.finalPrice}</p>
        ${order.couponCode ? `<p><strong>קופון:</strong> ${order.couponCode}</p>` : ''}
        <p><strong>סטטוס:</strong> אושר</p>
      </div>
      <p>הציגו את הברקוד בכניסה לפארק:</p>
      <img src="cid:barcode" alt="ברקוד כניסה" style="max-width:100%;" />
      <p style="color:#666;font-size:14px;">שמרו על מייל זה או צלמו את הברקוד.</p>
    </div>
  `;
}

function getTransporter(): Transporter | null {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

async function saveTicketLocally(
  userEmail: string,
  order: IOrder,
  barcodeBuffer: Buffer,
  html: string,
): Promise<string> {
  if (!fs.existsSync(ticketsLogDir)) {
    fs.mkdirSync(ticketsLogDir, { recursive: true });
  }
  const base = path.join(ticketsLogDir, order.ticketCode!);
  fs.writeFileSync(`${base}.png`, barcodeBuffer);
  fs.writeFileSync(
    `${base}.html`,
    `<!DOCTYPE html><html lang="he" dir="rtl"><body>${html.replace('cid:barcode', `${order.ticketCode}.png`)}</body></html>`,
  );
  console.log(`Ticket saved locally for ${userEmail}: server/logs/tickets/${order.ticketCode}.html`);
  return `logs/tickets/${order.ticketCode}.html`;
}

export interface EmailResult {
  sent: boolean;
  reason?: string;
  recipient?: string;
  devMode?: boolean;
  previewUrl?: string | false;
  message?: string;
  error?: string;
  localPath?: string;
  hint?: string | null;
}

export async function sendOrderConfirmationEmail(
  user: IUser | null,
  order: IOrder,
  recipientEmail?: string,
): Promise<EmailResult> {
  const to = (recipientEmail || user?.email || '').trim().toLowerCase();
  if (!to || !order?.ticketCode) {
    return { sent: false, reason: 'missing_data' };
  }

  const barcodeBuffer = await generateBarcodePng(order.ticketCode);
  const html = buildEmailHtml(user?.name || 'אורח', order);
  const mailOptions = {
    from: getFromAddress(),
    to,
    subject: `לונה פארק — אישור הזמנה ${order.ticketCode}`,
    html,
    attachments: [
      {
        filename: `ticket-${order.ticketCode}.png`,
        content: barcodeBuffer,
        cid: 'barcode',
      },
    ],
  };

  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Order confirmation sent to ${to} (${order.ticketCode})`);
      return { sent: true, recipient: to, devMode: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to send order email to ${to}:`, message);
      const localPath = await saveTicketLocally(to, order, barcodeBuffer, html);
      const isAuthError = /badcredentials|username and password/i.test(message);
      const userMessage = isAuthError
        ? 'Gmail דחה את ההתחברות — ודאי ש-SMTP_USER הוא האימייל הנכון וש-SMTP_PASS היא סיסמת אפליקציה (16 תווים, בלי רווחים)'
        : `שגיאת שליחת מייל: ${message}`;
      return {
        sent: false,
        reason: 'smtp_error',
        error: message,
        localPath,
        recipient: to,
        message: userMessage,
      };
    }
  }

  if (nodeEnv === 'development' && (!smtpHost || !smtpUser || !smtpPass)) {
    try {
      const devTransport = await getDevTransporter();
      const info = await devTransport.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`Dev email preview for ${to}: ${previewUrl}`);
      return {
        sent: true,
        recipient: to,
        devMode: true,
        previewUrl: previewUrl || undefined,
        message: 'מייל דמו נשלח! לחצי לצפייה (המייל לא מגיע לאימייל אמיתי בפיתוח)',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Dev email failed:', message);
    }
  }

  const localPath = await saveTicketLocally(to, order, barcodeBuffer, html);
  return {
    sent: false,
    reason: 'smtp_not_configured',
    localPath,
    recipient: to,
    message: `הכרטיס נשמר בשרת: ${localPath}. להגדרת מייל אמיתי הוסיפי SMTP לקובץ server/.env`,
  };
}

export { generateBarcodePng };
