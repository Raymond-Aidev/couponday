import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { Card, Button } from '../../components/ui';
import { couponService } from '../../services/coupon.service';
import { Coupon, CouponStatus, CouponStackParamList } from '../../types';

type CouponListNavigationProp = NativeStackNavigationProp<CouponStackParamList, 'CouponList'>;

type TabType = 'active' | 'scheduled' | 'ended';

export const CouponListScreen: React.FC = () => {
  const navigation = useNavigation<CouponListNavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const {
    data: coupons,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponService.getCoupons(),
  });

  const getFilteredCoupons = (): Coupon[] => {
    if (!coupons) return [];

    switch (activeTab) {
      case 'active':
        return coupons.filter((c) => c.status === 'ACTIVE' || c.status === 'PAUSED');
      case 'scheduled':
        return coupons.filter((c) => c.status === 'SCHEDULED' || c.status === 'DRAFT');
      case 'ended':
        return coupons.filter((c) => c.status === 'EXPIRED' || c.status === 'DEPLETED');
    }
  };

  const getStatusColor = (status: CouponStatus) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'PAUSED':
        return colors.warning;
      case 'SCHEDULED':
        return colors.info;
      case 'DRAFT':
        return colors.gray400;
      case 'EXPIRED':
      case 'DEPLETED':
        return colors.error;
      default:
        return colors.gray500;
    }
  };

  const getStatusLabel = (status: CouponStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '운영중';
      case 'PAUSED':
        return '일시정지';
      case 'SCHEDULED':
        return '예약됨';
      case 'DRAFT':
        return '임시저장';
      case 'EXPIRED':
        return '만료';
      case 'DEPLETED':
        return '소진';
      default:
        return status;
    }
  };

  const getCouponTypeLabel = (type: Coupon['type']) => {
    switch (type) {
      case 'DISCOUNT_AMOUNT':
        return '금액할인';
      case 'DISCOUNT_RATE':
        return '비율할인';
      case 'FREE_ITEM':
        return '무료증정';
      case 'BUNDLE':
        return '번들';
      default:
        return type;
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.type === 'DISCOUNT_AMOUNT' && coupon.discountValue) {
      return `${coupon.discountValue.toLocaleString()}원 할인`;
    }
    if (coupon.type === 'DISCOUNT_RATE' && coupon.discountValue) {
      return `${coupon.discountValue}% 할인`;
    }
    if (coupon.type === 'FREE_ITEM' && coupon.freeItemName) {
      return `${coupon.freeItemName} 무료`;
    }
    return '';
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const format = (d: Date) =>
      `${d.getMonth() + 1}/${d.getDate()}`;
    return `${format(startDate)} - ${format(endDate)}`;
  };

  const renderCouponItem = ({ item }: { item: Coupon }) => (
    <TouchableOpacity onPress={() => navigation.navigate('CouponDetail', { couponId: item.id })}>
      <Card variant="elevated" style={styles.couponCard}>
        <View style={styles.couponHeader}>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
          <Text style={styles.couponType}>{getCouponTypeLabel(item.type)}</Text>
        </View>

        <Text style={styles.couponName}>{item.name}</Text>
        <Text style={styles.couponDiscount}>{formatDiscount(item)}</Text>

        <View style={styles.couponFooter}>
          <View style={styles.couponStats}>
            <Text style={styles.statsLabel}>사용</Text>
            <Text style={styles.statsValue}>
              {item.currentRedemptions}
              {item.maxRedemptions ? ` / ${item.maxRedemptions}` : ''}
            </Text>
          </View>

          <View style={styles.couponStats}>
            <Text style={styles.statsLabel}>기간</Text>
            <Text style={styles.statsValue}>
              {formatDateRange(item.validFrom, item.validUntil)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎫</Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'active'
          ? '운영중인 쿠폰이 없습니다'
          : activeTab === 'scheduled'
          ? '예약된 쿠폰이 없습니다'
          : '종료된 쿠폰이 없습니다'}
      </Text>
      <Text style={styles.emptyDescription}>
        새로운 쿠폰을 만들어 고객을 유치해보세요
      </Text>
      <Button
        title="쿠폰 만들기"
        onPress={() => navigation.navigate('CouponCreate')}
        style={styles.createButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>쿠폰 관리</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CouponCreate')}
        >
          <Text style={styles.addButtonText}>+ 새 쿠폰</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['active', 'scheduled', 'ended'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'active' ? '운영중' : tab === 'scheduled' ? '예약' : '종료'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getFilteredCoupons()}
        renderItem={renderCouponItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  couponCard: {
    marginBottom: spacing.sm,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  couponType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  couponName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  couponDiscount: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  couponFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  couponStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  statsValue: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  createButton: {
    minWidth: 140,
  },
});
