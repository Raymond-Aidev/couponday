'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Calendar, Clock, Tag, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { couponApi, CreateCouponInput } from '@/lib/api';
import Link from 'next/link';

const couponSchema = z.object({
  name: z.string().min(1, '쿠폰명을 입력하세요'),
  description: z.string().optional(),
  discountType: z.enum(['FIXED', 'PERCENT']),
  discountValue: z.number().min(1, '할인값을 입력하세요'),
  validFrom: z.string().min(1, '시작일을 선택하세요'),
  validUntil: z.string().min(1, '종료일을 선택하세요'),
  availableDays: z.array(z.number()).default([0, 1, 2, 3, 4, 5, 6]),
  availableTimeStart: z.string().optional(),
  availableTimeEnd: z.string().optional(),
  totalQuantity: z.number().optional(),
  dailyLimit: z.number().optional(),
  perUserLimit: z.number().optional(),
});

type CouponFormData = z.infer<typeof couponSchema>;

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

export default function CouponCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      discountType: 'FIXED',
      discountValue: 1000,
      availableDays: [0, 1, 2, 3, 4, 5, 6],
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const discountType = watch('discountType');

  const createMutation = useMutation({
    mutationFn: (data: CreateCouponInput) => couponApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      router.push('/coupons');
    },
  });

  const toggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(newDays);
    setValue('availableDays', newDays);
  };

  const onSubmit = (data: CouponFormData) => {
    const input: CreateCouponInput = {
      ...data,
      validFrom: new Date(data.validFrom).toISOString(),
      validUntil: new Date(data.validUntil).toISOString(),
      availableDays: selectedDays,
    };
    createMutation.mutate(input);
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/coupons" className="p-1">
            <ArrowLeft className="w-6 h-6 text-secondary-600" />
          </Link>
          <h1 className="text-lg font-semibold text-secondary-900">쿠폰 만들기</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-500" />
              <CardTitle>기본 정보</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                쿠폰명 *
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="예: 점심 특가 할인"
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                설명
              </label>
              <textarea
                {...register('description')}
                placeholder="쿠폰에 대한 설명을 입력하세요"
                rows={2}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Discount */}
        <Card>
          <CardHeader>
            <CardTitle>할인 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                할인 유형
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('discountType', 'FIXED')}
                  className={`py-3 rounded-lg border-2 transition-colors ${
                    discountType === 'FIXED'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 text-secondary-600'
                  }`}
                >
                  금액 할인
                </button>
                <button
                  type="button"
                  onClick={() => setValue('discountType', 'PERCENT')}
                  className={`py-3 rounded-lg border-2 transition-colors ${
                    discountType === 'PERCENT'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 text-secondary-600'
                  }`}
                >
                  비율 할인
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                할인 {discountType === 'FIXED' ? '금액' : '비율'} *
              </label>
              <div className="relative">
                <input
                  {...register('discountValue', { valueAsNumber: true })}
                  type="number"
                  placeholder={discountType === 'FIXED' ? '1000' : '10'}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500">
                  {discountType === 'FIXED' ? '원' : '%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              <CardTitle>유효 기간</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  시작일
                </label>
                <input
                  {...register('validFrom')}
                  type="date"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  종료일
                </label>
                <input
                  {...register('validUntil')}
                  type="date"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                사용 가능 요일
              </label>
              <div className="flex gap-2">
                {dayNames.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                      selectedDays.includes(index)
                        ? 'bg-primary-500 text-white'
                        : 'bg-secondary-100 text-secondary-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              <CardTitle>사용 시간 (선택)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  시작 시간
                </label>
                <input
                  {...register('availableTimeStart')}
                  type="time"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  종료 시간
                </label>
                <input
                  {...register('availableTimeEnd')}
                  type="time"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              <CardTitle>수량 제한 (선택)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                총 발급 수량
              </label>
              <input
                {...register('totalQuantity', { valueAsNumber: true })}
                type="number"
                placeholder="무제한"
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  일일 제한
                </label>
                <input
                  {...register('dailyLimit', { valueAsNumber: true })}
                  type="number"
                  placeholder="무제한"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  1인당 제한
                </label>
                <input
                  {...register('perUserLimit', { valueAsNumber: true })}
                  type="number"
                  placeholder="무제한"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="pb-8">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? '생성 중...' : '쿠폰 생성하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
