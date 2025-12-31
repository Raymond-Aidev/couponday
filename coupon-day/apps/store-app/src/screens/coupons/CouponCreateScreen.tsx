import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Card, Button, Input } from '../../components/ui';
import { couponService } from '../../services/coupon.service';
import { CouponType, CouponCreateInput } from '../../types';

type Step = 'type' | 'discount' | 'period' | 'conditions' | 'review';

export const CouponCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('type');
  const [formData, setFormData] = useState<Partial<CouponCreateInput>>({
    name: '',
    description: '',
    type: 'DISCOUNT_AMOUNT',
    discountValue: undefined,
    freeItemName: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    maxRedemptions: undefined,
    minOrderAmount: undefined,
    availableTimeStart: undefined,
    availableTimeEnd: undefined,
    availableDays: undefined,
  });

  const createMutation = useMutation({
    mutationFn: (input: CouponCreateInput) => couponService.createCoupon(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      Alert.alert('성공', '쿠폰이 생성되었습니다', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error) => {
      Alert.alert('오류', error instanceof Error ? error.message : '쿠폰 생성에 실패했습니다');
    },
  });

  const couponTypes: { type: CouponType; label: string; icon: string; description: string }[] = [
    {
      type: 'DISCOUNT_AMOUNT',
      label: '금액 할인',
      icon: '💰',
      description: '고정 금액을 할인해드려요',
    },
    {
      type: 'DISCOUNT_RATE',
      label: '비율 할인',
      icon: '📊',
      description: '주문 금액의 일정 비율을 할인해드려요',
    },
    {
      type: 'FREE_ITEM',
      label: '무료 증정',
      icon: '🎁',
      description: '특정 메뉴를 무료로 제공해드려요',
    },
  ];

  const getStepNumber = () => {
    switch (step) {
      case 'type':
        return 1;
      case 'discount':
        return 2;
      case 'period':
        return 3;
      case 'conditions':
        return 4;
      case 'review':
        return 5;
    }
  };

  const handleNext = () => {
    switch (step) {
      case 'type':
        setStep('discount');
        break;
      case 'discount':
        if (!formData.name) {
          Alert.alert('입력 필요', '쿠폰 이름을 입력해주세요');
          return;
        }
        if (formData.type === 'FREE_ITEM' && !formData.freeItemName) {
          Alert.alert('입력 필요', '무료 제공 메뉴를 입력해주세요');
          return;
        }
        if (formData.type !== 'FREE_ITEM' && !formData.discountValue) {
          Alert.alert('입력 필요', '할인 금액/비율을 입력해주세요');
          return;
        }
        setStep('period');
        break;
      case 'period':
        setStep('conditions');
        break;
      case 'conditions':
        setStep('review');
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'type':
        navigation.goBack();
        break;
      case 'discount':
        setStep('type');
        break;
      case 'period':
        setStep('discount');
        break;
      case 'conditions':
        setStep('period');
        break;
      case 'review':
        setStep('conditions');
        break;
    }
  };

  const handleCreate = () => {
    createMutation.mutate(formData as CouponCreateInput);
  };

  const renderTypeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>쿠폰 종류 선택</Text>
      <Text style={styles.stepDescription}>어떤 종류의 쿠폰을 만들까요?</Text>

      {couponTypes.map((item) => (
        <TouchableOpacity
          key={item.type}
          style={[
            styles.typeCard,
            formData.type === item.type && styles.typeCardSelected,
          ]}
          onPress={() => setFormData({ ...formData, type: item.type })}
        >
          <Text style={styles.typeIcon}>{item.icon}</Text>
          <View style={styles.typeContent}>
            <Text style={styles.typeLabel}>{item.label}</Text>
            <Text style={styles.typeDescription}>{item.description}</Text>
          </View>
          <View
            style={[
              styles.typeRadio,
              formData.type === item.type && styles.typeRadioSelected,
            ]}
          >
            {formData.type === item.type && <View style={styles.typeRadioInner} />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDiscountStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>쿠폰 정보</Text>
      <Text style={styles.stepDescription}>쿠폰 이름과 할인 내용을 입력해주세요</Text>

      <Input
        label="쿠폰 이름"
        placeholder="예: 점심특가 2000원 할인"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <Input
        label="쿠폰 설명 (선택)"
        placeholder="쿠폰에 대한 설명을 입력해주세요"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        multiline
      />

      {formData.type === 'DISCOUNT_AMOUNT' && (
        <Input
          label="할인 금액"
          placeholder="할인 금액을 입력하세요"
          value={formData.discountValue?.toString() || ''}
          onChangeText={(text) =>
            setFormData({ ...formData, discountValue: parseInt(text) || undefined })
          }
          keyboardType="number-pad"
          helper="원"
        />
      )}

      {formData.type === 'DISCOUNT_RATE' && (
        <Input
          label="할인 비율"
          placeholder="할인 비율을 입력하세요"
          value={formData.discountValue?.toString() || ''}
          onChangeText={(text) =>
            setFormData({ ...formData, discountValue: parseInt(text) || undefined })
          }
          keyboardType="number-pad"
          helper="% (1~100)"
        />
      )}

      {formData.type === 'FREE_ITEM' && (
        <Input
          label="무료 제공 메뉴"
          placeholder="예: 아메리카노"
          value={formData.freeItemName}
          onChangeText={(text) => setFormData({ ...formData, freeItemName: text })}
        />
      )}
    </View>
  );

  const renderPeriodStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>운영 기간</Text>
      <Text style={styles.stepDescription}>쿠폰 운영 기간을 설정해주세요</Text>

      <Input
        label="시작일"
        placeholder="YYYY-MM-DD"
        value={formData.validFrom}
        onChangeText={(text) => setFormData({ ...formData, validFrom: text })}
      />

      <Input
        label="종료일"
        placeholder="YYYY-MM-DD"
        value={formData.validUntil}
        onChangeText={(text) => setFormData({ ...formData, validUntil: text })}
      />

      <View style={styles.timeRow}>
        <View style={styles.timeInput}>
          <Input
            label="시작 시간 (선택)"
            placeholder="HH:MM"
            value={formData.availableTimeStart || ''}
            onChangeText={(text) =>
              setFormData({ ...formData, availableTimeStart: text || undefined })
            }
          />
        </View>
        <View style={styles.timeInput}>
          <Input
            label="종료 시간 (선택)"
            placeholder="HH:MM"
            value={formData.availableTimeEnd || ''}
            onChangeText={(text) =>
              setFormData({ ...formData, availableTimeEnd: text || undefined })
            }
          />
        </View>
      </View>
    </View>
  );

  const renderConditionsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>사용 조건</Text>
      <Text style={styles.stepDescription}>추가 조건을 설정해주세요 (선택)</Text>

      <Input
        label="최대 발급 수 (선택)"
        placeholder="무제한인 경우 비워두세요"
        value={formData.maxRedemptions?.toString() || ''}
        onChangeText={(text) =>
          setFormData({ ...formData, maxRedemptions: parseInt(text) || undefined })
        }
        keyboardType="number-pad"
      />

      <Input
        label="최소 주문 금액 (선택)"
        placeholder="조건 없음인 경우 비워두세요"
        value={formData.minOrderAmount?.toString() || ''}
        onChangeText={(text) =>
          setFormData({ ...formData, minOrderAmount: parseInt(text) || undefined })
        }
        keyboardType="number-pad"
        helper="원"
      />
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>최종 확인</Text>
      <Text style={styles.stepDescription}>입력하신 내용을 확인해주세요</Text>

      <Card variant="outlined" style={styles.reviewCard}>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>쿠폰 이름</Text>
          <Text style={styles.reviewValue}>{formData.name}</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>쿠폰 종류</Text>
          <Text style={styles.reviewValue}>
            {couponTypes.find((t) => t.type === formData.type)?.label}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>할인 내용</Text>
          <Text style={styles.reviewValue}>
            {formData.type === 'DISCOUNT_AMOUNT' &&
              `${formData.discountValue?.toLocaleString()}원 할인`}
            {formData.type === 'DISCOUNT_RATE' && `${formData.discountValue}% 할인`}
            {formData.type === 'FREE_ITEM' && `${formData.freeItemName} 무료`}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>운영 기간</Text>
          <Text style={styles.reviewValue}>
            {formData.validFrom} ~ {formData.validUntil}
          </Text>
        </View>

        {formData.maxRedemptions && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>최대 발급 수</Text>
            <Text style={styles.reviewValue}>{formData.maxRedemptions}개</Text>
          </View>
        )}

        {formData.minOrderAmount && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>최소 주문 금액</Text>
            <Text style={styles.reviewValue}>
              {formData.minOrderAmount.toLocaleString()}원
            </Text>
          </View>
        )}
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.backButton}>← 뒤로</Text>
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <Text style={styles.stepIndicator}>{getStepNumber()} / 5</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${(getStepNumber() / 5) * 100}%` }]}
              />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'type' && renderTypeStep()}
          {step === 'discount' && renderDiscountStep()}
          {step === 'period' && renderPeriodStep()}
          {step === 'conditions' && renderConditionsStep()}
          {step === 'review' && renderReviewStep()}
        </ScrollView>

        <View style={styles.footer}>
          {step !== 'review' ? (
            <Button title="다음" onPress={handleNext} fullWidth />
          ) : (
            <Button
              title="쿠폰 생성하기"
              onPress={handleCreate}
              loading={createMutation.isPending}
              fullWidth
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    ...typography.body1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  typeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  typeDescription: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  typeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeRadioSelected: {
    borderColor: colors.primary,
  },
  typeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeInput: {
    flex: 1,
  },
  reviewCard: {
    marginTop: spacing.sm,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  reviewLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  reviewValue: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});
