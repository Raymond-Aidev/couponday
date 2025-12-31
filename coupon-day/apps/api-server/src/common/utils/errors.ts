export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error codes based on PRD spec
export const ErrorCodes = {
  // Auth errors
  AUTH_001: { code: 'AUTH_001', message: '인증이 필요합니다', status: 401 },
  AUTH_002: { code: 'AUTH_002', message: '토큰이 만료되었습니다', status: 401 },
  AUTH_003: { code: 'AUTH_003', message: '유효하지 않은 토큰입니다', status: 401 },
  AUTH_004: { code: 'AUTH_004', message: '잘못된 인증 정보입니다', status: 401 },

  // Coupon errors
  COUPON_001: { code: 'COUPON_001', message: '이미 저장한 쿠폰입니다', status: 409 },
  COUPON_002: { code: 'COUPON_002', message: '수량이 소진되었습니다', status: 410 },
  COUPON_003: { code: 'COUPON_003', message: '오늘 수량이 소진되었습니다', status: 410 },
  COUPON_004: { code: 'COUPON_004', message: '지금은 사용할 수 없는 시간입니다', status: 400 },
  COUPON_005: { code: 'COUPON_005', message: '이미 사용된 쿠폰입니다', status: 400 },
  COUPON_006: { code: 'COUPON_006', message: '만료된 쿠폰입니다', status: 410 },
  COUPON_007: { code: 'COUPON_007', message: '쿠폰을 찾을 수 없습니다', status: 404 },

  // Cross coupon / Token errors
  CROSS_001: { code: 'CROSS_001', message: '이미 쿠폰을 선택했습니다', status: 409 },
  CROSS_002: { code: 'CROSS_002', message: '토큰이 만료되었습니다', status: 410 },
  TOKEN_001: { code: 'TOKEN_001', message: '토큰을 찾을 수 없습니다', status: 404 },
  TOKEN_002: { code: 'TOKEN_002', message: '이미 사용된 토큰입니다', status: 400 },
  TOKEN_003: { code: 'TOKEN_003', message: '토큰 발급에 실패했습니다', status: 500 },

  // Partnership errors
  PARTNER_001: { code: 'PARTNER_001', message: '이미 파트너십이 존재합니다', status: 409 },
  PARTNER_002: {
    code: 'PARTNER_002',
    message: '자기 자신과는 파트너십을 맺을 수 없습니다',
    status: 400,
  },
  PARTNER_003: { code: 'PARTNER_003', message: '파트너십을 찾을 수 없습니다', status: 404 },
  PARTNER_004: { code: 'PARTNER_004', message: '파트너십이 활성 상태가 아닙니다', status: 400 },

  // Store errors
  STORE_001: { code: 'STORE_001', message: '점포를 찾을 수 없습니다', status: 404 },
  STORE_002: { code: 'STORE_002', message: '이미 등록된 사업자번호입니다', status: 409 },
  STORE_003: { code: 'STORE_003', message: '점포가 비활성 상태입니다', status: 400 },

  // Customer errors
  CUSTOMER_001: { code: 'CUSTOMER_001', message: '고객을 찾을 수 없습니다', status: 404 },
  CUSTOMER_002: { code: 'CUSTOMER_002', message: '이미 등록된 전화번호입니다', status: 409 },
  CUSTOMER_003: { code: 'CUSTOMER_003', message: '이미 등록된 디바이스입니다', status: 409 },

  // Item errors
  ITEM_001: { code: 'ITEM_001', message: '메뉴를 찾을 수 없습니다', status: 404 },
  ITEM_002: { code: 'ITEM_002', message: '현재 판매 불가능한 메뉴입니다', status: 400 },

  // Redemption errors
  REDEMPTION_001: { code: 'REDEMPTION_001', message: '사용 기록을 찾을 수 없습니다', status: 404 },
  REDEMPTION_002: { code: 'REDEMPTION_002', message: '사용 처리에 실패했습니다', status: 500 },

  // Validation errors
  VALIDATION_001: { code: 'VALIDATION_001', message: '입력값이 올바르지 않습니다', status: 400 },

  // Server errors
  SERVER_001: { code: 'SERVER_001', message: '서버 오류가 발생했습니다', status: 500 },
} as const;

export function createError(
  errorDef: (typeof ErrorCodes)[keyof typeof ErrorCodes],
  details?: unknown
): AppError {
  return new AppError(errorDef.code, errorDef.message, errorDef.status, details);
}
