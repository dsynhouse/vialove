import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = env.smtp
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null;

/**
 * Sends an email if SMTP is configured; otherwise logs it to the console.
 * This keeps auth flows (password reset, etc.) fully testable in local dev
 * without requiring real email infrastructure.
 */
export async function sendMail(to: string, subject: string, text: string, html?: string) {
  if (!transporter) {
    console.log('\n--- No SMTP configured, logging email instead ---');
    console.log(`To: ${to}\nSubject: ${subject}\n\n${text}`);
    console.log('--------------------------------------------------\n');
    return;
  }

  await transporter.sendMail({
    from: env.smtp!.from,
    to,
    subject,
    text,
    html,
  });
}
