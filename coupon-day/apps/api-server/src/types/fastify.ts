// Type definitions for Fastify JWT - re-export from .d.ts
// This file exists to allow proper TypeScript/Vitest imports

import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: Record<string, unknown>;
    user: {
      sub: string;
      type: 'store' | 'customer';
      storeId?: string;
      iat: number;
      exp: number;
    };
  }
}

export {};
