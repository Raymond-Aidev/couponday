import { z } from 'zod';

// Store registration schema
export const storeRegisterSchema = z.object({
  businessNumber: z
    .string()
    .regex(/^\d{10}$/, '사업자등록번호는 10자리 숫자여야 합니다'),
  phone: z
    .string()
    .regex(/^01[0-9]{8,9}$/, '올바른 휴대폰 번호를 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문자와 숫자를 포함해야 합니다'
    ),
  ownerName: z
    .string()
    .min(2, '대표자명을 입력해주세요')
    .max(50),
  storeName: z
    .string()
    .min(2, '상호명을 입력해주세요')
    .max(100),
  categoryId: z.string().uuid('카테고리를 선택해주세요'),
  address: z.string().min(5, '주소를 입력해주세요'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type StoreRegisterInput = z.infer<typeof storeRegisterSchema>;

// Store login schema
export const storeLoginSchema = z.object({
  phone: z.string().regex(/^01[0-9]{8,9}$/, '올바른 휴대폰 번호를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

export type StoreLoginInput = z.infer<typeof storeLoginSchema>;

// Token refresh schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '리프레시 토큰이 필요합니다'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// Customer anonymous session schema
export const customerAnonymousSchema = z.object({
  deviceId: z.string().min(1, '디바이스 ID가 필요합니다'),
});

export type CustomerAnonymousInput = z.infer<typeof customerAnonymousSchema>;

// Customer social login schema
export const customerSocialSchema = z.object({
  provider: z.enum(['kakao', 'naver', 'apple', 'google']),
  token: z.string().min(1, '소셜 로그인 토큰이 필요합니다'),
});

export type CustomerSocialInput = z.infer<typeof customerSocialSchema>;
