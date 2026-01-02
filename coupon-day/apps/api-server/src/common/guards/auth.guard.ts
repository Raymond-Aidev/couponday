import type { FastifyRequest, FastifyReply } from 'fastify';
import { createError, ErrorCodes } from '../utils/errors.js';
import '../../types/fastify.js';

export interface JwtPayload {
  sub: string;
  type: 'store' | 'customer';
  storeId?: string;
  iat: number;
  exp: number;
}

export async function storeAuthGuard(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();

    const user = request.user;
    if (user.type !== 'store') {
      throw createError(ErrorCodes.AUTH_001);
    }
  } catch {
    throw createError(ErrorCodes.AUTH_001);
  }
}

export async function customerAuthGuard(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();

    const user = request.user;
    if (user.type !== 'customer') {
      throw createError(ErrorCodes.AUTH_001);
    }
  } catch {
    throw createError(ErrorCodes.AUTH_001);
  }
}

export async function optionalAuthGuard(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    // Optional auth - don't throw error
  }
}

export async function optionalStoreAuthGuard(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
    // Only set user if it's a store type, otherwise leave undefined
    if (request.user?.type !== 'store') {
      (request as any).user = undefined;
    }
  } catch {
    // Optional auth - don't throw error
    (request as any).user = undefined;
  }
}
