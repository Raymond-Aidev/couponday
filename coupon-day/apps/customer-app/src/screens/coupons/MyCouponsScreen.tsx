import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { couponService } from '../../services/coupon.service';
import { SavedCoupon } from '../../types';

type TabType = 'available' | 'used' | 'expired';

export const MyCouponsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [selectedCoupon, setSelectedCoupon] = useState<SavedCoupon | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const {
    data: coupons,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['my-coupons'],
    queryFn: couponService.getMyCoupons,
  });

  const getFilteredCoupons = (): SavedCoupon[] => {
    if (!coupons) return [];

    switch (activeTab) {
      case 'available':
        return coupons.filter((c) => c.status === 'ACTIVE');
      case 'used':
        return coupons.filter((c) => c.status === 'USED');
      case 'expired':
        return coupons.filter((c) => c.status === 'EXPIRED');
    }
  };

  const handleCouponPress = (coupon: SavedCoupon) => {
    if (coupon.status === 'ACTIVE') {
      setSelectedCoupon(coupon);
      setShowQRModal(true);
    }
  };

  const formatDiscount = (coupon: SavedCoupon) => {
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

  const formatExpiry = (coupon: SavedCoupon) => {
    const validUntil = new Date(coupon.validUntil);
    const now = new Date();
    const diffDays = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return '오늘 마감';
    if (diffDays === 1) return '내일 마감';
    if (diffDays <= 7) return `${diffDays}일 남음`;
    return `${validUntil.getMonth() + 1}/${validUntil.getDate()}까지`;
  };

  const renderCouponItem = ({ item }: { item: SavedCoupon }) => (
    <TouchableOpacity
      style={[styles.couponCard, item.status !== 'ACTIVE' && styles.couponCardInactive]}
      onPress={() => handleCouponPress(item)}
      activeOpacity={item.status === 'ACTIVE' ? 0.7 : 1}
    >
      <View style={styles.couponLeft}>
        <View
          style={[
            styles.discountBadge,
            item.status !== 'ACTIVE' && styles.discountBadgeInactive,
          ]}
        >
          <Text style={styles.discountValue}>{formatDiscount(item)}</Text>
          <Text style={styles.discountLabel}>할인</Text>
        </View>
      </View>

      <View style={styles.couponRight}>
        <Text style={styles.storeName}>{item.store.name}</Text>
        <Text style={styles.couponName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.couponFooter}>
          {item.status === 'ACTIVE' && (
            <Text style={styles.expiryText}>{formatExpiry(item)}</Text>
          )}
          {item.status === 'USED' && (
            <Text style={styles.usedText}>사용 완료</Text>
          )}
          {item.status === 'EXPIRED' && (
            <Text style={styles.expiredText}>기간 만료</Text>
          )}
        </View>
      </View>

      {item.status === 'ACTIVE' && (
        <View style={styles.qrHint}>
          <Text style={styles.qrHintText}>QR</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'available' ? '🎫' : activeTab === 'used' ? '✅' : '⏰'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'available'
          ? '저장된 쿠폰이 없어요'
          : activeTab === 'used'
          ? '사용한 쿠폰이 없어요'
          : '만료된 쿠폰이 없어요'}
      </Text>
      {activeTab === 'available' && (
        <Text style={styles.emptyDescription}>
          주변 가게에서 쿠폰을 받아보세요
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>내 쿠폰함</Text>
        <Text style={styles.couponCount}>
          {coupons?.filter((c) => c.status === 'ACTIVE').length || 0}개 보유
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['available', 'used', 'expired'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'available' ? '사용 가능' : tab === 'used' ? '사용 완료' : '기간 만료'}
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

      {/* QR Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>쿠폰 사용</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedCoupon && (
              <>
                <Text style={styles.modalStoreName}>{selectedCoupon.store.name}</Text>
                <Text style={styles.modalCouponName}>{selectedCoupon.name}</Text>

                <View style={styles.qrContainer}>
                  <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrPlaceholderText}>QR 코드</Text>
                    <Text style={styles.qrPlaceholderSubtext}>
                      직원에게 보여주세요
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalHint}>
                  QR 코드를 직원에게 보여주면 할인이 적용됩니다
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  couponCount: {
    ...typography.body2,
    color: colors.primary,
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
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  couponCardInactive: {
    opacity: 0.6,
  },
  couponLeft: {
    width: 90,
    backgroundColor: colors.primary,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {},
  discountBadgeInactive: {
    opacity: 0.7,
  },
  discountValue: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  discountLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
  },
  couponRight: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  storeName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  couponName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  couponFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '500',
  },
  usedText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },
  expiredText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '500',
  },
  qrHint: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  qrHintText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 10,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.gray400,
  },
  modalStoreName: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalCouponName: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  qrPlaceholderSubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  modalHint: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
