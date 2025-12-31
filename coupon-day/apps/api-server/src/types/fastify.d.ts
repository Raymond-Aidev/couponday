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
