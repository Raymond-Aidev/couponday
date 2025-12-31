import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { Card, Button } from '../../components/ui';
import { couponService } from '../../services/coupon.service';
import { CouponStackParamList, CouponStatus } from '../../types';

type CouponDetailRouteProp = RouteProp<CouponStackParamList, 'CouponDetail'>;
type CouponDetailNavigationProp = NativeStackNavigationProp<CouponStackParamList, 'CouponDetail'>;

export const CouponDetailScreen: React.FC = () => {
  const route = useRoute<CouponDetailRouteProp>();
  const navigation = useNavigation<CouponDetailNavigationProp>();
  const queryClient = useQueryClient();
  const { couponId } = route.params;

  const { data: coupon, isLoading } = useQuery({
    queryKey: ['coupon', couponId],
    queryFn: () => couponService.getCoupon(couponId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: CouponStatus) => couponService.updateCouponStatus(couponId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon', couponId] });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  const handleStatusChange = (newStatus: CouponStatus) => {
    const statusLabel = newStatus === 'ACTIVE' ? '활성화' : newStatus === 'PAUSED' ? '일시정지' : newStatus;
    Alert.alert(
      '상태 변경',
      `쿠폰을 ${statusLabel}하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => statusMutation.mutate(newStatus),
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    return timeStr.slice(0, 5);
  };

  const getDaysLabel = (days: number[] | null) => {
    if (!days || days.length === 0) return '매일';
    if (days.length === 7) return '매일';

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return days.map((d) => dayNames[d]).join(', ');
  };

  if (isLoading || !coupon) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: CouponStatus) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'PAUSED':
        return colors.warning;
      case 'SCHEDULED':
        return colors.info;
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>쿠폰 상세</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status and Title */}
        <Card variant="elevated" style={styles.mainCard}>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusBadge, { backgroundColor: getStatusColor(coupon.status) }]}
            >
              <Text style={styles.statusText}>{getStatusLabel(coupon.status)}</Text>
            </View>
          </View>

          <Text style={styles.couponName}>{coupon.name}</Text>
          {coupon.description && (
            <Text style={styles.couponDescription}>{coupon.description}</Text>
          )}

          <View style={styles.discountBox}>
            {coupon.type === 'DISCOUNT_AMOUNT' && (
              <Text style={styles.discountValue}>
                {coupon.discountValue?.toLocaleString()}원 할인
              </Text>
            )}
            {coupon.type === 'DISCOUNT_RATE' && (
              <Text style={styles.discountValue}>{coupon.discountValue}% 할인</Text>
            )}
            {coupon.type === 'FREE_ITEM' && (
              <Text style={styles.discountValue}>{coupon.freeItemName} 무료</Text>
            )}
          </View>
        </Card>

        {/* Usage Stats */}
        <Card variant="outlined" style={styles.statsCard}>
          <Text style={styles.sectionTitle}>사용 현황</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coupon.currentRedemptions}</Text>
              <Text style={styles.statLabel}>사용됨</Text>
            </View>
            {coupon.maxRedemptions && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{coupon.maxRedemptions}</Text>
                  <Text style={styles.statLabel}>최대</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {coupon.maxRedemptions - coupon.currentRedemptions}
                  </Text>
                  <Text style={styles.statLabel}>남음</Text>
                </View>
              </>
            )}
          </View>

          {coupon.maxRedemptions && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        (coupon.currentRedemptions / coupon.maxRedemptions) * 100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((coupon.currentRedemptions / coupon.maxRedemptions) * 100)}% 사용
              </Text>
            </View>
          )}
        </Card>

        {/* Period */}
        <Card variant="outlined" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>운영 기간</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>시작일</Text>
            <Text style={styles.infoValue}>{formatDate(coupon.validFrom)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>종료일</Text>
            <Text style={styles.infoValue}>{formatDate(coupon.validUntil)}</Text>
          </View>
        </Card>

        {/* Time & Days */}
        <Card variant="outlined" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>사용 가능 시간</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>시간대</Text>
            <Text style={styles.infoValue}>
              {coupon.availableTimeStart && coupon.availableTimeEnd
                ? `${formatTime(coupon.availableTimeStart)} - ${formatTime(coupon.availableTimeEnd)}`
                : '종일'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>요일</Text>
            <Text style={styles.infoValue}>{getDaysLabel(coupon.availableDays)}</Text>
          </View>
        </Card>

        {/* Conditions */}
        {coupon.minOrderAmount && (
          <Card variant="outlined" style={styles.infoCard}>
            <Text style={styles.sectionTitle}>사용 조건</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>최소 주문 금액</Text>
              <Text style={styles.infoValue}>
                {coupon.minOrderAmount.toLocaleString()}원
              </Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {coupon.status === 'ACTIVE' && (
            <Button
              title="일시정지"
              variant="outline"
              onPress={() => handleStatusChange('PAUSED')}
              fullWidth
              style={styles.actionButton}
            />
          )}

          {coupon.status === 'PAUSED' && (
            <Button
              title="다시 시작"
              onPress={() => handleStatusChange('ACTIVE')}
              fullWidth
              style={styles.actionButton}
            />
          )}

          {(coupon.status === 'ACTIVE' || coupon.status === 'PAUSED') && (
            <Button
              title="성과 분석"
              variant="secondary"
              onPress={() => navigation.navigate('CouponPerformance', { couponId })}
              fullWidth
              style={styles.actionButton}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    ...typography.body1,
    color: colors.primary,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  mainCard: {
    marginBottom: spacing.md,
  },
  statusRow: {
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  couponName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  couponDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  discountBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  discountValue: {
    ...typography.h3,
    color: colors.primaryDark,
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray200,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: 0,
  },
});
