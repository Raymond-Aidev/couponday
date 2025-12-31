import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { Coupon } from '../../types';

interface CouponCardProps {
  coupon: Coupon;
  onPress?: () => void;
  compact?: boolean;
}

export const CouponCard: React.FC<CouponCardProps> = ({ coupon, onPress, compact = false }) => {
  const formatDiscount = () => {
    if (coupon.type === 'DISCOUNT_AMOUNT' && coupon.discountValue) {
      return `${coupon.discountValue.toLocaleString()}원`;
    }
    if (coupon.type === 'DISCOUNT_RATE' && coupon.discountValue) {
      return `${coupon.discountValue}%`;
    }
    if (coupon.type === 'FREE_ITEM' && coupon.freeItemName) {
      return coupon.freeItemName;
    }
    return '';
  };

  const formatDistance = () => {
    if (!coupon.distance) return null;
    if (coupon.distance < 1000) {
      return `${Math.round(coupon.distance)}m`;
    }
    return `${(coupon.distance / 1000).toFixed(1)}km`;
  };

  const formatExpiry = () => {
    const validUntil = new Date(coupon.validUntil);
    const now = new Date();
    const diffDays = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return '오늘 마감';
    if (diffDays === 1) return '내일 마감';
    if (diffDays <= 7) return `${diffDays}일 남음`;
    return `${validUntil.getMonth() + 1}/${validUntil.getDate()}까지`;
  };

  const getDiscountLabel = () => {
    switch (coupon.type) {
      case 'DISCOUNT_AMOUNT':
        return '할인';
      case 'DISCOUNT_RATE':
        return '할인';
      case 'FREE_ITEM':
        return '무료';
      default:
        return '';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.compactDiscountBadge}>
          <Text style={styles.compactDiscountValue}>{formatDiscount()}</Text>
          <Text style={styles.compactDiscountLabel}>{getDiscountLabel()}</Text>
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactStoreName} numberOfLines={1}>
            {coupon.store.name}
          </Text>
          <Text style={styles.compactCouponName} numberOfLines={1}>
            {coupon.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountValue}>{formatDiscount()}</Text>
          <Text style={styles.discountLabel}>{getDiscountLabel()}</Text>
        </View>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerCircleTop} />
        <View style={styles.dividerLine} />
        <View style={styles.dividerCircleBottom} />
      </View>

      <View style={styles.rightSection}>
        <View style={styles.storeInfo}>
          <Text style={styles.categoryBadge}>{coupon.store.category.name}</Text>
          {formatDistance() && (
            <Text style={styles.distance}>{formatDistance()}</Text>
          )}
        </View>

        <Text style={styles.storeName} numberOfLines={1}>
          {coupon.store.name}
        </Text>
        <Text style={styles.couponName} numberOfLines={2}>
          {coupon.name}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.expiry}>{formatExpiry()}</Text>
          {coupon.minOrderAmount && (
            <Text style={styles.minOrder}>
              {coupon.minOrderAmount.toLocaleString()}원 이상
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    overflow: 'hidden',
  },
  leftSection: {
    width: 100,
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    alignItems: 'center',
  },
  discountValue: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  discountLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  divider: {
    width: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    marginVertical: -8,
  },
  dividerCircleTop: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginTop: -8,
  },
  dividerLine: {
    flex: 1,
    width: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
    borderStyle: 'dashed',
  },
  dividerCircleBottom: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: -8,
  },
  rightSection: {
    flex: 1,
    padding: spacing.md,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  distance: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  storeName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  couponName: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expiry: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '500',
  },
  minOrder: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...shadows.sm,
  },
  compactDiscountBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  compactDiscountValue: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.white,
  },
  compactDiscountLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
    fontSize: 10,
  },
  compactContent: {
    flex: 1,
  },
  compactStoreName: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  compactCouponName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
