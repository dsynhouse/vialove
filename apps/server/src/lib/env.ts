import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5173'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  databasePath: required('DATABASE_PATH', './data/vialove.db'),
};
