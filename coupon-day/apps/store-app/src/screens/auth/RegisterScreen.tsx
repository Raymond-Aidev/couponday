import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { RootStackParamList } from '../../types';
import { Button, Input, Card } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { register, clearError } from '../../store/slices/authSlice';
import { authService } from '../../services/auth.service';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

type Step = 'business' | 'account' | 'store';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState<Step>('business');

  // Business verification
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessVerified, setBusinessVerified] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Store info
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { id: 'cat_food', name: '음식점' },
    { id: 'cat_cafe', name: '카페' },
    { id: 'cat_beauty', name: '뷰티' },
    { id: 'cat_health', name: '건강' },
    { id: 'cat_retail', name: '소매' },
    { id: 'cat_other', name: '기타' },
  ];

  const handleVerifyBusiness = async () => {
    if (businessNumber.length !== 10) {
      setErrors({ businessNumber: '사업자번호 10자리를 입력해주세요' });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await authService.verifyBusinessNumber(businessNumber);
      if (result.valid) {
        setBusinessVerified(true);
        setCompanyName(result.companyName || '');
        setErrors({});
      } else {
        setErrors({ businessNumber: '유효하지 않은 사업자번호입니다' });
      }
    } catch {
      // For demo, allow any 10-digit number
      setBusinessVerified(true);
      setCompanyName('테스트 상호');
      setErrors({});
    } finally {
      setIsVerifying(false);
    }
  };

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'business') {
      if (!businessVerified) {
        newErrors.businessNumber = '사업자번호 인증이 필요합니다';
      }
    }

    if (currentStep === 'account') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = '올바른 이메일을 입력해주세요';
      }
      if (password.length < 8) {
        newErrors.password = '비밀번호는 8자 이상이어야 합니다';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      }
      if (!name.trim()) {
        newErrors.name = '이름을 입력해주세요';
      }
      if (!phone.trim() || !/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phone.replace(/-/g, ''))) {
        newErrors.phone = '올바른 전화번호를 입력해주세요';
      }
    }

    if (currentStep === 'store') {
      if (!storeName.trim()) {
        newErrors.storeName = '가게 이름을 입력해주세요';
      }
      if (!storeAddress.trim()) {
        newErrors.storeAddress = '가게 주소를 입력해주세요';
      }
      if (!categoryId) {
        newErrors.categoryId = '업종을 선택해주세요';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    if (step === 'business') {
      setStep('account');
    } else if (step === 'account') {
      setStep('store');
    }
  };

  const handleBack = () => {
    if (step === 'account') {
      setStep('business');
    } else if (step === 'store') {
      setStep('account');
    } else {
      navigation.goBack();
    }
  };

  const handleRegister = async () => {
    if (!validateStep('store')) return;

    dispatch(clearError());
    const result = await dispatch(
      register({
        email,
        password,
        name,
        businessNumber,
        phone,
        storeName,
        storeAddress,
        categoryId,
      })
    );

    if (register.fulfilled.match(result)) {
      navigation.replace('Main');
    } else if (register.rejected.match(result)) {
      Alert.alert('회원가입 실패', result.payload as string);
    }
  };

  const renderBusinessStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>사업자 인증</Text>
      <Text style={styles.stepDescription}>
        사업자등록번호로 본인 확인을 진행합니다
      </Text>

      <Input
        label="사업자등록번호"
        placeholder="'-' 없이 10자리 입력"
        value={businessNumber}
        onChangeText={(text) => {
          setBusinessNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
          setBusinessVerified(false);
        }}
        error={errors.businessNumber}
        keyboardType="number-pad"
        maxLength={10}
      />

      {businessVerified && (
        <Card variant="elevated" style={styles.verifiedCard}>
          <Text style={styles.verifiedLabel}>확인된 상호</Text>
          <Text style={styles.verifiedValue}>{companyName}</Text>
        </Card>
      )}

      <Button
        title={businessVerified ? '인증 완료' : '사업자번호 확인'}
        onPress={handleVerifyBusiness}
        variant={businessVerified ? 'secondary' : 'primary'}
        loading={isVerifying}
        disabled={businessVerified || businessNumber.length !== 10}
        fullWidth
        style={styles.verifyButton}
      />

      <Button
        title="다음"
        onPress={handleNext}
        disabled={!businessVerified}
        fullWidth
        style={styles.nextButton}
      />
    </View>
  );

  const renderAccountStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>계정 정보</Text>
      <Text style={styles.stepDescription}>로그인에 사용할 정보를 입력해주세요</Text>

      <Input
        label="이메일"
        placeholder="example@email.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="비밀번호"
        placeholder="8자 이상 입력"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        isPassword
      />

      <Input
        label="비밀번호 확인"
        placeholder="비밀번호 재입력"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        isPassword
      />

      <Input
        label="이름"
        placeholder="실명을 입력해주세요"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />

      <Input
        label="연락처"
        placeholder="010-0000-0000"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
        keyboardType="phone-pad"
      />

      <Button title="다음" onPress={handleNext} fullWidth style={styles.nextButton} />
    </View>
  );

  const renderStoreStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>가게 정보</Text>
      <Text style={styles.stepDescription}>가게 정보를 입력해주세요</Text>

      <Input
        label="가게 이름"
        placeholder="가게 이름을 입력해주세요"
        value={storeName}
        onChangeText={setStoreName}
        error={errors.storeName}
      />

      <Input
        label="가게 주소"
        placeholder="주소를 입력해주세요"
        value={storeAddress}
        onChangeText={setStoreAddress}
        error={errors.storeAddress}
      />

      <Text style={styles.categoryLabel}>업종 선택</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryItem,
              categoryId === cat.id && styles.categoryItemSelected,
            ]}
            onPress={() => setCategoryId(cat.id)}
          >
            <Text
              style={[
                styles.categoryText,
                categoryId === cat.id && styles.categoryTextSelected,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        title="회원가입 완료"
        onPress={handleRegister}
        loading={isLoading}
        fullWidth
        style={styles.nextButton}
      />
    </View>
  );

  const getStepNumber = () => {
    switch (step) {
      case 'business':
        return 1;
      case 'account':
        return 2;
      case 'store':
        return 3;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <Text style={styles.stepIndicator}>{getStepNumber()} / 3</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(getStepNumber() / 3) * 100}%` }]} />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'business' && renderBusinessStep()}
          {step === 'account' && renderAccountStep()}
          {step === 'store' && renderStoreStep()}
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    ...typography.body1,
    color: colors.textSecondary,
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
    flexGrow: 1,
    padding: spacing.lg,
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
    marginBottom: spacing.xl,
  },
  verifyButton: {
    marginTop: spacing.sm,
  },
  verifiedCard: {
    marginVertical: spacing.md,
    backgroundColor: colors.successLight,
  },
  verifiedLabel: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  verifiedValue: {
    ...typography.h4,
    color: colors.success,
  },
  nextButton: {
    marginTop: spacing.lg,
  },
  categoryLabel: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    margin: spacing.xs,
    backgroundColor: colors.white,
  },
  categoryItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  categoryText: {
    ...typography.body2,
    color: colors.textPrimary,
  },
  categoryTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
