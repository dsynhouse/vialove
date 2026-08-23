import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5173'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  databasePath: required('DATABASE_PATH', './data/vialove.db'),
  // Any SMTP provider works here (Gmail, SendGrid, Resend, Postmark, SES, Mailtrap, ...).
  // Unset in local dev: sendMail() falls back to logging the message to the console.
  smtp: hasSmtp
    ? {
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT ?? 587),
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
        from: process.env.SMTP_FROM ?? 'vialove <no-reply@vialove.app>',
      }
    : null,
};
