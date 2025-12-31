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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { couponService } from '../../services/coupon.service';
import { RootStackParamList } from '../../types';

type CouponDetailRouteProp = RouteProp<RootStackParamList, 'CouponDetail'>;

export const CouponDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CouponDetailRouteProp>();
  const queryClient = useQueryClient();
  const { couponId } = route.params;

  const { data: coupon, isLoading } = useQuery({
    queryKey: ['coupon', couponId],
    queryFn: () => couponService.getCoupon(couponId),
  });

  const saveMutation = useMutation({
    mutationFn: () => couponService.saveCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon', couponId] });
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] });
      Alert.alert('쿠폰 저장 완료! 🎉', '내 쿠폰함에서 확인하세요', [
        { text: '확인' },
      ]);
    },
    onError: (error) => {
      Alert.alert('오류', error instanceof Error ? error.message : '쿠폰 저장에 실패했습니다');
    },
  });

  const handleSaveCoupon = () => {
    if (coupon?.isSaved) {
      Alert.alert('알림', '이미 저장된 쿠폰입니다');
      return;
    }
    saveMutation.mutate();
  };

  const formatDiscount = () => {
    if (!coupon) return '';
    if (coupon.type === 'DISCOUNT_AMOUNT' && coupon.discountValue) {
      return `${coupon.discountValue.toLocaleString()}원 할인`;
    }
    if (coupon.type === 'DISCOUNT_RATE' && coupon.discountValue) {
      return `${coupon.discountValue}% 할인`;
    }
    if (coupon.type === 'FREE_ITEM' && coupon.freeItemName) {
      return `${coupon.freeItemName} 무료 증정`;
    }
    return '';
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

  const formatDistance = () => {
    if (!coupon?.distance) return null;
    if (coupon.distance < 1000) {
      return `${Math.round(coupon.distance)}m`;
    }
    return `${(coupon.distance / 1000).toFixed(1)}km`;
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
        {/* Coupon Visual */}
        <View style={styles.couponVisual}>
          <View style={styles.discountBox}>
            <Text style={styles.discountValue}>{formatDiscount()}</Text>
          </View>
          <View style={styles.dividerLine} />
          <Text style={styles.couponName}>{coupon.name}</Text>
          {coupon.description && (
            <Text style={styles.couponDescription}>{coupon.description}</Text>
          )}
        </View>

        {/* Store Info */}
        <TouchableOpacity
          style={styles.storeCard}
          onPress={() =>
            navigation.navigate('StoreDetail' as never, { storeId: coupon.store.id } as never)
          }
        >
          <View style={styles.storeIcon}>
            <Text style={styles.storeIconText}>🏪</Text>
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{coupon.store.name}</Text>
            <Text style={styles.storeCategory}>{coupon.store.category.name}</Text>
          </View>
          <View style={styles.storeDistance}>
            {formatDistance() && (
              <Text style={styles.distanceText}>{formatDistance()}</Text>
            )}
            <Text style={styles.arrowText}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사용 조건</Text>

          <View style={styles.conditionItem}>
            <Text style={styles.conditionIcon}>📅</Text>
            <View style={styles.conditionContent}>
              <Text style={styles.conditionLabel}>유효 기간</Text>
              <Text style={styles.conditionValue}>
                {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validUntil)}
              </Text>
            </View>
          </View>

          {coupon.availableTimeStart && coupon.availableTimeEnd && (
            <View style={styles.conditionItem}>
              <Text style={styles.conditionIcon}>⏰</Text>
              <View style={styles.conditionContent}>
                <Text style={styles.conditionLabel}>사용 가능 시간</Text>
                <Text style={styles.conditionValue}>
                  {formatTime(coupon.availableTimeStart)} ~{' '}
                  {formatTime(coupon.availableTimeEnd)}
                </Text>
              </View>
            </View>
          )}

          {coupon.minOrderAmount && (
            <View style={styles.conditionItem}>
              <Text style={styles.conditionIcon}>💰</Text>
              <View style={styles.conditionContent}>
                <Text style={styles.conditionLabel}>최소 주문 금액</Text>
                <Text style={styles.conditionValue}>
                  {coupon.minOrderAmount.toLocaleString()}원 이상
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* How to Use */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사용 방법</Text>
          <View style={styles.howToUse}>
            <View style={styles.howToStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>쿠폰 저장하기</Text>
            </View>
            <View style={styles.howToStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>가게 방문하기</Text>
            </View>
            <View style={styles.howToStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>QR 코드 보여주기</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            coupon.isSaved && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveCoupon}
          disabled={saveMutation.isPending || coupon.isSaved}
        >
          <Text style={styles.saveButtonText}>
            {coupon.isSaved
              ? '✅ 저장됨'
              : saveMutation.isPending
              ? '저장 중...'
              : '🎫 쿠폰 저장하기'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  couponVisual: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  discountBox: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  discountValue: {
    ...typography.h2,
    color: colors.white,
  },
  dividerLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  couponName: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  couponDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  storeIconText: {
    fontSize: 24,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  storeCategory: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  storeDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  arrowText: {
    ...typography.h3,
    color: colors.gray400,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  conditionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  conditionContent: {
    flex: 1,
  },
  conditionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  conditionValue: {
    ...typography.body1,
    color: colors.textPrimary,
    marginTop: 2,
  },
  howToUse: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  howToStep: {
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepNumberText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '700',
  },
  stepText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 18,
  },
});
