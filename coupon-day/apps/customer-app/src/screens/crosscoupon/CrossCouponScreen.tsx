import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { tokenService } from '../../services/token.service';
import { CrossCouponOption, RootStackParamList } from '../../types';

type CrossCouponNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CrossCouponScreen: React.FC = () => {
  const navigation = useNavigation<CrossCouponNavigationProp>();
  const queryClient = useQueryClient();

  const [tokenCode, setTokenCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<CrossCouponOption[]>([]);

  const searchMutation = useMutation({
    mutationFn: (code: string) => tokenService.getAvailableCoupons(code),
    onSuccess: (data) => {
      setAvailableCoupons(data);
      setIsSearching(true);
    },
    onError: (error) => {
      Alert.alert('오류', error instanceof Error ? error.message : '토큰을 찾을 수 없습니다');
    },
  });

  const selectMutation = useMutation({
    mutationFn: (couponId: string) => tokenService.selectCoupon(tokenCode, couponId),
    onSuccess: (data) => {
      Alert.alert('쿠폰 선택 완료! 🎉', data.message, [
        {
          text: '확인',
          onPress: () => {
            setTokenCode('');
            setIsSearching(false);
            setAvailableCoupons([]);
          },
        },
      ]);
    },
    onError: (error) => {
      Alert.alert('오류', error instanceof Error ? error.message : '쿠폰 선택에 실패했습니다');
    },
  });

  const handleSearch = () => {
    if (tokenCode.length !== 8) {
      Alert.alert('알림', '8자리 토큰 코드를 입력해주세요');
      return;
    }
    searchMutation.mutate(tokenCode.toUpperCase());
  };

  const handleSelectCoupon = (coupon: CrossCouponOption) => {
    Alert.alert(
      '쿠폰 선택',
      `${coupon.providerStore.name}에서 사용할 수 있는 쿠폰을 선택하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '선택',
          onPress: () => selectMutation.mutate(coupon.id),
        },
      ]
    );
  };

  const handleReset = () => {
    setTokenCode('');
    setIsSearching(false);
    setAvailableCoupons([]);
  };

  const formatDiscount = (coupon: CrossCouponOption) => {
    if (coupon.discountType === 'FIXED' && coupon.discountValue) {
      return `${coupon.discountValue.toLocaleString()}원 할인`;
    }
    if (coupon.discountType === 'PERCENTAGE' && coupon.discountValue) {
      return `${coupon.discountValue}% 할인`;
    }
    return '혜택';
  };

  const renderCouponOption = ({ item }: { item: CrossCouponOption }) => (
    <TouchableOpacity
      style={styles.couponOption}
      onPress={() => handleSelectCoupon(item)}
      activeOpacity={0.7}
    >
      <View style={styles.couponOptionLeft}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{formatDiscount(item)}</Text>
        </View>
      </View>

      <View style={styles.couponOptionContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.providerStore.category.name}</Text>
        </View>
        <Text style={styles.storeName}>{item.providerStore.name}</Text>
        <Text style={styles.couponName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.couponDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <Text style={styles.storeAddress}>{item.providerStore.address}</Text>
      </View>

      <View style={styles.selectArrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>오늘의 선택</Text>
        <Text style={styles.subtitle}>식사 후 받은 토큰으로 혜택을 선택하세요</Text>
      </View>

      {!isSearching ? (
        <View style={styles.inputSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🎫</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>크로스 쿠폰이란?</Text>
              <Text style={styles.infoText}>
                식당에서 식사 후 받은 토큰 코드를 입력하면{'\n'}
                제휴 카페나 디저트 가게에서 할인 혜택을 받을 수 있어요
              </Text>
            </View>
          </View>

          <View style={styles.tokenInputContainer}>
            <Text style={styles.inputLabel}>토큰 코드 입력</Text>
            <TextInput
              style={styles.tokenInput}
              value={tokenCode}
              onChangeText={(text) => setTokenCode(text.toUpperCase())}
              placeholder="8자리 코드 입력"
              placeholderTextColor={colors.gray400}
              maxLength={8}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                tokenCode.length !== 8 && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={tokenCode.length !== 8 || searchMutation.isPending}
            >
              <Text style={styles.searchButtonText}>
                {searchMutation.isPending ? '검색 중...' : '혜택 찾기'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.howItWorks}>
            <Text style={styles.howItWorksTitle}>이용 방법</Text>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>파트너 식당에서 식사하기</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>토큰 코드 받기</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>원하는 혜택 선택하기</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>제휴 가게에서 혜택 사용하기</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>선택 가능한 혜택</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetButton}>다시 입력</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableCoupons}
            renderItem={renderCouponOption}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.couponsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>😢</Text>
                <Text style={styles.emptyTitle}>사용 가능한 혜택이 없어요</Text>
                <Text style={styles.emptyDescription}>
                  토큰이 만료되었거나 이미 사용된 토큰일 수 있어요
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  inputSection: {
    flex: 1,
    padding: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tokenInputContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tokenInput: {
    ...typography.h2,
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  searchButtonText: {
    ...typography.button,
    color: colors.white,
  },
  howItWorks: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  howItWorksTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  stepText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultsTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  resetButton: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  couponsList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  couponOption: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  couponOptionLeft: {
    width: 80,
    backgroundColor: colors.secondary,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {},
  discountText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  couponOptionContent: {
    flex: 1,
    padding: spacing.md,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryLight + '30',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  categoryText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '500',
  },
  storeName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  couponName: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  couponDescription: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  storeAddress: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  selectArrow: {
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  arrowText: {
    ...typography.h2,
    color: colors.gray400,
  },
  emptyContainer: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
});
