'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  Building2,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { authApi, setAccessToken } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { clsx } from 'clsx';

// Step 1: Business verification schema
const step1Schema = z.object({
  businessNumber: z
    .string()
    .min(1, '사업자등록번호를 입력해주세요')
    .regex(/^\d{10}$/, '사업자등록번호는 10자리 숫자입니다'),
});

// Step 2: Owner info schema
const step2Schema = z.object({
  ownerName: z.string().min(1, '대표자명을 입력해주세요'),
  phone: z
    .string()
    .min(1, '휴대폰 번호를 입력해주세요')
    .regex(/^01[0-9]{8,9}$/, '올바른 휴대폰 번호 형식이 아닙니다'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '비밀번호는 영문과 숫자를 포함해야 합니다'
    ),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
});

// Step 3: Store info schema
const step3Schema = z.object({
  storeName: z.string().min(1, '상호명을 입력해주세요'),
  categoryId: z.string().min(1, '업종을 선택해주세요'),
  address: z.string().min(1, '주소를 입력해주세요'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// Store categories (from DB)
const categories = [
  { id: 'korean', name: '한식', icon: '🍚' },
  { id: 'chinese', name: '중식', icon: '🥟' },
  { id: 'japanese', name: '일식', icon: '🍣' },
  { id: 'western', name: '양식', icon: '🍝' },
  { id: 'cafe', name: '카페/디저트', icon: '☕' },
  { id: 'chicken', name: '치킨', icon: '🍗' },
  { id: 'pizza', name: '피자', icon: '🍕' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { number: 1, title: '사업자 확인' },
    { number: 2, title: '계정 정보' },
    { number: 3, title: '점포 정보' },
  ];

  const handleStep1Submit = (data: Step1Data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: Step3Data) => {
    setIsSubmitting(true);
    setError(null);

    const finalData = { ...formData, ...data };

    try {
      const response = await authApi.register({
        businessNumber: finalData.businessNumber!,
        phone: finalData.phone!,
        password: finalData.password!,
        ownerName: finalData.ownerName!,
        storeName: finalData.storeName!,
        categoryId: finalData.categoryId!,
        address: finalData.address!,
        latitude: 37.5665, // TODO: Get from address geocoding
        longitude: 126.978,
      });

      if (response.success) {
        const { accessToken, refreshToken, store } = response.data;
        setAccessToken(accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Update auth store
        useAuthStore.setState({
          isAuthenticated: true,
          store: store as any,
        });

        router.replace('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-secondary-100 px-4 py-3">
        <div className="flex items-center">
          <Link href="/login" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-secondary-600" />
          </Link>
          <h1 className="flex-1 text-center text-lg font-semibold text-secondary-900">
            회원가입
          </h1>
          <div className="w-10" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  currentStep > step.number
                    ? 'bg-primary-500 text-white'
                    : currentStep === step.number
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-200 text-secondary-500'
                )}
              >
                {currentStep > step.number ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.number
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    'w-8 h-0.5 mx-1',
                    currentStep > step.number
                      ? 'bg-primary-500'
                      : 'bg-secondary-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-secondary-600">
            {steps[currentStep - 1].title}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-md mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {currentStep === 1 && (
          <Step1Form onSubmit={handleStep1Submit} defaultValues={formData} />
        )}
        {currentStep === 2 && (
          <Step2Form
            onSubmit={handleStep2Submit}
            onBack={() => setCurrentStep(1)}
            defaultValues={formData}
          />
        )}
        {currentStep === 3 && (
          <Step3Form
            onSubmit={handleStep3Submit}
            onBack={() => setCurrentStep(2)}
            defaultValues={formData}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

// Step 1: Business Number Verification
function Step1Form({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: Step1Data) => void;
  defaultValues: Partial<Step1Data>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  });

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-secondary-900 mb-2">
          사업자 등록번호 확인
        </h2>
        <p className="text-sm text-secondary-500">
          사업자등록번호로 본인 확인을 진행합니다
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('businessNumber')}
          type="text"
          placeholder="사업자등록번호 (- 없이 10자리)"
          leftIcon={<Building2 className="w-5 h-5" />}
          error={errors.businessNumber?.message}
          maxLength={10}
        />

        <div className="p-3 bg-secondary-50 rounded-lg">
          <p className="text-xs text-secondary-500">
            * 사업자등록번호는 국세청에서 확인됩니다.
            <br />* 등록된 사업자만 점포 등록이 가능합니다.
          </p>
        </div>

        <Button type="submit" fullWidth size="lg" rightIcon={<ChevronRight className="w-5 h-5" />}>
          다음
        </Button>
      </form>
    </Card>
  );
}

// Step 2: Owner Information
function Step2Form({
  onSubmit,
  onBack,
  defaultValues,
}: {
  onSubmit: (data: Step2Data) => void;
  onBack: () => void;
  defaultValues: Partial<Step2Data>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues,
  });

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-secondary-900 mb-2">
          계정 정보 입력
        </h2>
        <p className="text-sm text-secondary-500">
          로그인에 사용할 정보를 입력해주세요
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('ownerName')}
          type="text"
          placeholder="대표자명"
          leftIcon={<User className="w-5 h-5" />}
          error={errors.ownerName?.message}
        />

        <Input
          {...register('phone')}
          type="tel"
          placeholder="휴대폰 번호 (- 없이 입력)"
          leftIcon={<Phone className="w-5 h-5" />}
          error={errors.phone?.message}
        />

        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          placeholder="비밀번호 (8자 이상, 영문+숫자)"
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          }
          error={errors.password?.message}
        />

        <Input
          {...register('passwordConfirm')}
          type={showPasswordConfirm ? 'text' : 'password'}
          placeholder="비밀번호 확인"
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="p-1"
            >
              {showPasswordConfirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          }
          error={errors.passwordConfirm?.message}
        />

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            이전
          </Button>
          <Button type="submit" className="flex-1" rightIcon={<ChevronRight className="w-5 h-5" />}>
            다음
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Step 3: Store Information
function Step3Form({
  onSubmit,
  onBack,
  defaultValues,
  isSubmitting,
}: {
  onSubmit: (data: Step3Data) => void;
  onBack: () => void;
  defaultValues: Partial<Step3Data>;
  isSubmitting: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState(
    defaultValues.categoryId || ''
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues,
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setValue('categoryId', categoryId);
  };

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-secondary-900 mb-2">
          점포 정보 입력
        </h2>
        <p className="text-sm text-secondary-500">
          점포 기본 정보를 입력해주세요
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('storeName')}
          type="text"
          placeholder="상호명"
          leftIcon={<Building2 className="w-5 h-5" />}
          error={errors.storeName?.message}
        />

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            업종 선택
          </label>
          <input type="hidden" {...register('categoryId')} />
          <div className="grid grid-cols-4 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategorySelect(category.id)}
                className={clsx(
                  'p-3 rounded-xl border-2 text-center transition-all',
                  selectedCategory === category.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-secondary-200 hover:border-secondary-300'
                )}
              >
                <span className="text-2xl block mb-1">{category.icon}</span>
                <span className="text-xs text-secondary-600">{category.name}</span>
              </button>
            ))}
          </div>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        <Input
          {...register('address')}
          type="text"
          placeholder="주소 (도로명 주소)"
          leftIcon={<MapPin className="w-5 h-5" />}
          error={errors.address?.message}
        />

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            이전
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>
            가입 완료
          </Button>
        </div>
      </form>
    </Card>
  );
}
