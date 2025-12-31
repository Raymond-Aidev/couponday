'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, '전화번호를 입력해주세요')
    .regex(/^01[0-9]{8,9}$/, '올바른 전화번호 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.phone, data.password);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || '로그인에 실패했습니다. 다시 시도해주세요.'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-orange-50 px-4 py-8">
      {/* Login Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-white">CD</span>
          </div>
          <h1 className="text-xl font-bold text-secondary-900">쿠폰데이 점포</h1>
          <p className="text-secondary-500 text-sm mt-1">점포 관리를 시작하세요</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('phone')}
            type="tel"
            placeholder="전화번호 (- 없이 입력)"
            leftIcon={<Phone className="w-5 h-5" />}
            error={errors.phone?.message}
            autoComplete="tel"
          />

          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호"
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
            autoComplete="current-password"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
            로그인
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <a href="/register" className="text-sm text-primary-500 hover:underline">
            아직 계정이 없으신가요? 회원가입
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-secondary-400">
          © 2024 CouponDay. All rights reserved.
        </p>
      </div>
    </div>
  );
}
