/**
 * Discount Calculator Service
 * PRD 4.3 - 조건부 할인 로직 (BOGO, BUNDLE, FREEBIE, CONDITIONAL)
 */

export type DiscountType = 'FIXED' | 'PERCENTAGE' | 'BOGO' | 'BUNDLE' | 'FREEBIE' | 'CONDITIONAL';

export interface DiscountCondition {
  // BOGO: Buy One Get One
  bogo?: {
    buyQuantity: number;      // 구매 수량
    getQuantity: number;      // 무료 수량
    targetItemId?: string;    // 특정 상품 (없으면 동일 상품)
    maxApplications?: number; // 최대 적용 횟수
  };

  // BUNDLE: 세트 할인
  bundle?: {
    items: Array<{
      itemId: string;
      quantity: number;
    }>;
    bundlePrice: number;      // 세트 가격
    originalPrice?: number;   // 정가 (표시용)
  };

  // FREEBIE: 증정품
  freebie?: {
    minOrderAmount?: number;  // 최소 주문 금액
    minQuantity?: number;     // 최소 주문 수량
    freebieItemId: string;    // 증정 상품 ID
    freebieQuantity: number;  // 증정 수량
  };

  // CONDITIONAL: 조건부 할인
  conditional?: {
    conditions: Array<{
      type: 'min_amount' | 'min_quantity' | 'time_range' | 'day_of_week' | 'first_purchase';
      value: any;
    }>;
    discount: {
      type: 'fixed' | 'percentage';
      value: number;
    };
  };
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DiscountResult {
  discountType: DiscountType;
  discountAmount: number;
  description: string;
  appliedItems?: string[];
  freeItems?: Array<{
    itemId: string;
    quantity: number;
  }>;
}

export class DiscountCalculatorService {
  /**
   * Calculate discount based on type and conditions
   */
  calculateDiscount(
    discountType: DiscountType,
    discountValue: number | null,
    discountCondition: DiscountCondition | null,
    orderItems: OrderItem[],
    orderTotal: number
  ): DiscountResult {
    switch (discountType) {
      case 'FIXED':
        return this.calculateFixed(discountValue ?? 0);

      case 'PERCENTAGE':
        return this.calculatePercentage(discountValue ?? 0, orderTotal);

      case 'BOGO':
        return this.calculateBogo(discountCondition?.bogo, orderItems);

      case 'BUNDLE':
        return this.calculateBundle(discountCondition?.bundle, orderItems);

      case 'FREEBIE':
        return this.calculateFreebie(discountCondition?.freebie, orderItems, orderTotal);

      case 'CONDITIONAL':
        return this.calculateConditional(discountCondition?.conditional, orderItems, orderTotal);

      default:
        return {
          discountType,
          discountAmount: 0,
          description: '알 수 없는 할인 유형',
        };
    }
  }

  /**
   * FIXED: 고정 금액 할인
   */
  private calculateFixed(value: number): DiscountResult {
    return {
      discountType: 'FIXED',
      discountAmount: value,
      description: `${value.toLocaleString()}원 할인`,
    };
  }

  /**
   * PERCENTAGE: 비율 할인
   */
  private calculatePercentage(value: number, orderTotal: number): DiscountResult {
    const discountAmount = Math.floor(orderTotal * (value / 100));
    return {
      discountType: 'PERCENTAGE',
      discountAmount,
      description: `${value}% 할인 (${discountAmount.toLocaleString()}원)`,
    };
  }

  /**
   * BOGO: Buy One Get One Free
   */
  private calculateBogo(
    bogo: DiscountCondition['bogo'],
    orderItems: OrderItem[]
  ): DiscountResult {
    if (!bogo) {
      return {
        discountType: 'BOGO',
        discountAmount: 0,
        description: 'BOGO 조건이 설정되지 않았습니다',
      };
    }

    let totalDiscount = 0;
    let applications = 0;
    const appliedItems: string[] = [];

    for (const item of orderItems) {
      // Target specific item or any item
      if (bogo.targetItemId && item.itemId !== bogo.targetItemId) {
        continue;
      }

      // Check if enough quantity for BOGO
      const eligibleSets = Math.floor(item.quantity / (bogo.buyQuantity + bogo.getQuantity));
      const maxSets = bogo.maxApplications
        ? Math.min(eligibleSets, bogo.maxApplications - applications)
        : eligibleSets;

      if (maxSets > 0) {
        const discount = maxSets * bogo.getQuantity * item.price;
        totalDiscount += discount;
        applications += maxSets;
        appliedItems.push(item.itemId);
      }

      if (bogo.maxApplications && applications >= bogo.maxApplications) {
        break;
      }
    }

    return {
      discountType: 'BOGO',
      discountAmount: totalDiscount,
      description: `${bogo.buyQuantity}+${bogo.getQuantity} 이벤트`,
      appliedItems,
    };
  }

  /**
   * BUNDLE: 세트 할인
   */
  private calculateBundle(
    bundle: DiscountCondition['bundle'],
    orderItems: OrderItem[]
  ): DiscountResult {
    if (!bundle) {
      return {
        discountType: 'BUNDLE',
        discountAmount: 0,
        description: '번들 조건이 설정되지 않았습니다',
      };
    }

    // Check if all bundle items are in order
    const orderItemMap = new Map(orderItems.map(item => [item.itemId, item]));

    let minBundleSets = Infinity;
    let originalTotal = 0;
    const bundleItemIds: string[] = [];

    for (const bundleItem of bundle.items) {
      const orderItem = orderItemMap.get(bundleItem.itemId);
      if (!orderItem || orderItem.quantity < bundleItem.quantity) {
        // Not enough items for bundle
        return {
          discountType: 'BUNDLE',
          discountAmount: 0,
          description: '번들 조건을 충족하지 않습니다',
        };
      }

      const possibleSets = Math.floor(orderItem.quantity / bundleItem.quantity);
      minBundleSets = Math.min(minBundleSets, possibleSets);
      originalTotal += orderItem.price * bundleItem.quantity;
      bundleItemIds.push(bundleItem.itemId);
    }

    if (minBundleSets === 0 || minBundleSets === Infinity) {
      return {
        discountType: 'BUNDLE',
        discountAmount: 0,
        description: '번들 조건을 충족하지 않습니다',
      };
    }

    const discountPerBundle = originalTotal - bundle.bundlePrice;
    const totalDiscount = discountPerBundle * minBundleSets;

    return {
      discountType: 'BUNDLE',
      discountAmount: Math.max(0, totalDiscount),
      description: `세트 할인 ${minBundleSets}세트 적용`,
      appliedItems: bundleItemIds,
    };
  }

  /**
   * FREEBIE: 증정품
   */
  private calculateFreebie(
    freebie: DiscountCondition['freebie'],
    orderItems: OrderItem[],
    orderTotal: number
  ): DiscountResult {
    if (!freebie) {
      return {
        discountType: 'FREEBIE',
        discountAmount: 0,
        description: '증정 조건이 설정되지 않았습니다',
      };
    }

    // Check minimum order amount
    if (freebie.minOrderAmount && orderTotal < freebie.minOrderAmount) {
      return {
        discountType: 'FREEBIE',
        discountAmount: 0,
        description: `${freebie.minOrderAmount.toLocaleString()}원 이상 주문 시 증정`,
      };
    }

    // Check minimum quantity
    if (freebie.minQuantity) {
      const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < freebie.minQuantity) {
        return {
          discountType: 'FREEBIE',
          discountAmount: 0,
          description: `${freebie.minQuantity}개 이상 주문 시 증정`,
        };
      }
    }

    return {
      discountType: 'FREEBIE',
      discountAmount: 0, // Freebie doesn't reduce order total
      description: `증정품 ${freebie.freebieQuantity}개 제공`,
      freeItems: [{
        itemId: freebie.freebieItemId,
        quantity: freebie.freebieQuantity,
      }],
    };
  }

  /**
   * CONDITIONAL: 조건부 할인
   */
  private calculateConditional(
    conditional: DiscountCondition['conditional'],
    orderItems: OrderItem[],
    orderTotal: number
  ): DiscountResult {
    if (!conditional) {
      return {
        discountType: 'CONDITIONAL',
        discountAmount: 0,
        description: '조건부 할인 조건이 설정되지 않았습니다',
      };
    }

    // Check all conditions
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    for (const condition of conditional.conditions) {
      switch (condition.type) {
        case 'min_amount':
          if (orderTotal < condition.value) {
            return {
              discountType: 'CONDITIONAL',
              discountAmount: 0,
              description: `${condition.value.toLocaleString()}원 이상 주문 시 할인`,
            };
          }
          break;

        case 'min_quantity':
          const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
          if (totalQuantity < condition.value) {
            return {
              discountType: 'CONDITIONAL',
              discountAmount: 0,
              description: `${condition.value}개 이상 주문 시 할인`,
            };
          }
          break;

        case 'time_range':
          const { start, end } = condition.value as { start: string; end: string };
          if (currentTime < start || currentTime > end) {
            return {
              discountType: 'CONDITIONAL',
              discountAmount: 0,
              description: `${start}~${end} 시간대에만 할인`,
            };
          }
          break;

        case 'day_of_week':
          const allowedDays = condition.value as number[];
          if (!allowedDays.includes(currentDay)) {
            return {
              discountType: 'CONDITIONAL',
              discountAmount: 0,
              description: '해당 요일에만 할인 적용',
            };
          }
          break;

        case 'first_purchase':
          // This would need customer history check - skip for now
          break;
      }
    }

    // All conditions met, calculate discount
    let discountAmount: number;
    if (conditional.discount.type === 'fixed') {
      discountAmount = conditional.discount.value;
    } else {
      discountAmount = Math.floor(orderTotal * (conditional.discount.value / 100));
    }

    return {
      discountType: 'CONDITIONAL',
      discountAmount,
      description: conditional.discount.type === 'fixed'
        ? `${conditional.discount.value.toLocaleString()}원 할인`
        : `${conditional.discount.value}% 할인`,
    };
  }

  /**
   * Validate discount condition format
   */
  validateCondition(discountType: DiscountType, condition: DiscountCondition | null): { valid: boolean; error?: string } {
    switch (discountType) {
      case 'BOGO':
        if (!condition?.bogo) {
          return { valid: false, error: 'BOGO 조건이 필요합니다' };
        }
        if (condition.bogo.buyQuantity < 1 || condition.bogo.getQuantity < 1) {
          return { valid: false, error: '구매/증정 수량은 1 이상이어야 합니다' };
        }
        break;

      case 'BUNDLE':
        if (!condition?.bundle) {
          return { valid: false, error: '번들 조건이 필요합니다' };
        }
        if (!condition.bundle.items || condition.bundle.items.length < 2) {
          return { valid: false, error: '번들은 최소 2개 상품이 필요합니다' };
        }
        if (condition.bundle.bundlePrice < 0) {
          return { valid: false, error: '번들 가격은 0 이상이어야 합니다' };
        }
        break;

      case 'FREEBIE':
        if (!condition?.freebie) {
          return { valid: false, error: '증정 조건이 필요합니다' };
        }
        if (!condition.freebie.freebieItemId) {
          return { valid: false, error: '증정 상품 ID가 필요합니다' };
        }
        break;

      case 'CONDITIONAL':
        if (!condition?.conditional) {
          return { valid: false, error: '조건부 할인 조건이 필요합니다' };
        }
        if (!condition.conditional.conditions || condition.conditional.conditions.length === 0) {
          return { valid: false, error: '최소 1개의 조건이 필요합니다' };
        }
        if (!condition.conditional.discount) {
          return { valid: false, error: '할인 정보가 필요합니다' };
        }
        break;
    }

    return { valid: true };
  }
}
