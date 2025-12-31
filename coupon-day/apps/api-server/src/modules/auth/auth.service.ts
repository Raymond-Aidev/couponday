import * as bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';
import { env } from '../../config/env.js';
import type { JwtPayload } from '../../common/guards/auth.guard.js';
import type {
  StoreRegisterInput,
  StoreLoginInput,
  CustomerAnonymousInput,
} from './auth.schema.js';

const SALT_ROUNDS = 12;

export class AuthService {
  constructor(private app: FastifyInstance) {}

  // Generate tokens
  private generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
    const accessToken = this.app.jwt.sign(payload, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
    const refreshToken = this.app.jwt.sign(
      { ...payload, isRefresh: true },
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );
    return { accessToken, refreshToken };
  }

  // Store registration
  async registerStore(input: StoreRegisterInput) {
    // Check if business number already exists
    const existingStore = await prisma.store.findUnique({
      where: { businessNumber: input.businessNumber },
    });
    if (existingStore) {
      throw createError(ErrorCodes.STORE_002);
    }

    // Check if phone already exists
    const existingAccount = await prisma.storeAccount.findUnique({
      where: { phone: input.phone },
    });
    if (existingAccount) {
      throw createError(ErrorCodes.STORE_002, { field: 'phone' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create store and account in transaction
    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          businessNumber: input.businessNumber,
          name: input.storeName,
          categoryId: input.categoryId,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
          status: 'ACTIVE',
        },
      });

      const account = await tx.storeAccount.create({
        data: {
          storeId: store.id,
          phone: input.phone,
          passwordHash,
          ownerName: input.ownerName,
          role: 'OWNER',
        },
      });

      return { store, account };
    });

    // Generate tokens
    const tokens = this.generateTokens({
      sub: result.account.id,
      type: 'store',
      storeId: result.store.id,
    });

    return {
      ...tokens,
      store: {
        id: result.store.id,
        name: result.store.name,
        businessNumber: result.store.businessNumber,
      },
      account: {
        id: result.account.id,
        ownerName: result.account.ownerName,
        phone: result.account.phone,
      },
    };
  }

  // Store login
  async loginStore(input: StoreLoginInput) {
    const account = await prisma.storeAccount.findUnique({
      where: { phone: input.phone },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
            status: true,
          },
        },
      },
    });

    if (!account) {
      throw createError(ErrorCodes.AUTH_004);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(input.password, account.passwordHash);
    if (!isValidPassword) {
      throw createError(ErrorCodes.AUTH_004);
    }

    // Check if account is active
    if (!account.isActive) {
      throw createError(ErrorCodes.AUTH_001, { reason: 'Account is deactivated' });
    }

    // Check if store is active
    if (account.store.status !== 'ACTIVE') {
      throw createError(ErrorCodes.AUTH_001, { reason: 'Store is not active' });
    }

    // Update last login
    await prisma.storeAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = this.generateTokens({
      sub: account.id,
      type: 'store',
      storeId: account.store.id,
    });

    return {
      ...tokens,
      store: account.store,
      account: {
        id: account.id,
        ownerName: account.ownerName,
        phone: account.phone,
      },
    };
  }

  // Refresh token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.app.jwt.verify<JwtPayload & { isRefresh?: boolean }>(refreshToken);

      if (!decoded.isRefresh) {
        throw createError(ErrorCodes.AUTH_003);
      }

      // Generate new tokens
      const tokens = this.generateTokens({
        sub: decoded.sub,
        type: decoded.type,
        storeId: decoded.storeId,
      });

      return tokens;
    } catch {
      throw createError(ErrorCodes.AUTH_002);
    }
  }

  // Customer anonymous session
  async createAnonymousSession(input: CustomerAnonymousInput) {
    // Find or create customer by device ID
    let customer = await prisma.customer.findUnique({
      where: { deviceId: input.deviceId },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          deviceId: input.deviceId,
        },
      });
    }

    // Update last active
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastActiveAt: new Date() },
    });

    // Generate tokens
    const tokens = this.generateTokens({
      sub: customer.id,
      type: 'customer',
    });

    return {
      ...tokens,
      customer: {
        id: customer.id,
        nickname: customer.nickname,
        isAnonymous: !customer.phone,
      },
    };
  }
}
