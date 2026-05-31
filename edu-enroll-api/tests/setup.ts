import { webcrypto } from 'crypto';
// Polyfill globalThis.crypto for Node <19
if (!globalThis.crypto) {
  (globalThis as unknown as Record<string, unknown>).crypto = webcrypto;
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
