'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Ticket, Clock, ChevronRight, Gift, QrCode } from 'lucide-react';
import { tokenApi, MealToken } from '@/lib/api';
import { clsx } from 'clsx';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function TokensPage() {
  const router = useRouter();

  const { data: tokensData, isLoading } = useQuery({
    queryKey: ['my-tokens'],
    queryFn: () => tokenApi.getMyTokens(),
  });

  const tokens = tokensData?.data || [];

  // Group tokens by status
  const activeTokens = tokens.filter((t) => t.status === 'ISSUED');
  const selectedTokens = tokens.filter((t) => t.status === 'SELECTED');
  const usedTokens = tokens.filter((t) => t.status === 'REDEEMED' || t.status === 'EXPIRED');

  return (
    <div className="min-h-screen bg-secondary-50 pb-24">
      {/* Header */}
      <header
        className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30 border-b border-secondary-100"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-secondary-700" />
        </button>
        <h1 className="flex-1 font-semibold text-secondary-900">오늘의 선택</h1>
        <Link
          href="/tokens/scan"
          className="w-10 h-10 flex items-center justify-center -mr-2"
        >
          <QrCode className="w-6 h-6 text-primary-500" />
        </Link>
      </header>

      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 mx-4 mt-4 rounded-2xl text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold">크로스 쿠폰</h2>
            <p className="text-sm text-primary-100">
              방문 매장에서 받은 토큰으로 파트너 매장 쿠폰을 선택하세요!
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-secondary-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-500">받은 토큰이 없어요</p>
          <p className="text-sm text-secondary-400 mt-1">
            매장에서 결제 시 토큰을 받을 수 있어요
          </p>
          <Link
            href="/tokens/scan"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl"
          >
            <QrCode className="w-5 h-5" />
            QR 스캔하기
          </Link>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {/* Active Tokens */}
          {activeTokens.length > 0 && (
            <section>
              <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
                선택 대기 중 ({activeTokens.length})
              </h3>
              <div className="space-y-3">
                {activeTokens.map((token) => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </div>
            </section>
          )}

          {/* Selected Tokens */}
          {selectedTokens.length > 0 && (
            <section>
              <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                쿠폰 선택 완료 ({selectedTokens.length})
              </h3>
              <div className="space-y-3">
                {selectedTokens.map((token) => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </div>
            </section>
          )}

          {/* Used/Expired Tokens */}
          {usedTokens.length > 0 && (
            <section>
              <h3 className="font-semibold text-secondary-500 mb-3">
                사용 완료/만료 ({usedTokens.length})
              </h3>
              <div className="space-y-3">
                {usedTokens.map((token) => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TokenCard({ token }: { token: MealToken }) {
  const expiresAt = new Date(token.expiresAt);
  const now = new Date();
  const hoursLeft = differenceInHours(expiresAt, now);
  const minutesLeft = differenceInMinutes(expiresAt, now);
  const isExpiringSoon = hoursLeft < 2 && token.status === 'ISSUED';

  const statusConfig = {
    ISSUED: { label: '선택 대기', color: 'bg-primary-100 text-primary-600' },
    SELECTED: { label: '선택 완료', color: 'bg-green-100 text-green-600' },
    REDEEMED: { label: '사용 완료', color: 'bg-secondary-100 text-secondary-500' },
    EXPIRED: { label: '만료됨', color: 'bg-red-100 text-red-500' },
  };

  const status = statusConfig[token.status];
  const isActive = token.status === 'ISSUED' || token.status === 'SELECTED';

  return (
    <Link href={`/tokens/${token.tokenCode}`}>
      <div
        className={clsx(
          'bg-white rounded-2xl p-4 border transition-all',
          isActive
            ? 'border-secondary-100 hover:shadow-md'
            : 'border-secondary-200 opacity-60'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              isActive ? 'bg-primary-100' : 'bg-secondary-100'
            )}
          >
            <Gift className={clsx('w-6 h-6', isActive ? 'text-primary-500' : 'text-secondary-400')} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full', status.color)}>
                {status.label}
              </span>
              {isExpiringSoon && (
                <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
                  <Clock className="w-3 h-3" />
                  {hoursLeft > 0 ? `${hoursLeft}시간` : `${minutesLeft}분`}
                </span>
              )}
            </div>

            <p className="font-medium text-secondary-900 mt-1">
              {token.partnership.distributorStore.name}
            </p>
            <p className="text-sm text-secondary-500">
              → {token.partnership.providerStore.name} 쿠폰 선택 가능
            </p>

            {token.selectedCrossCoupon && (
              <p className="text-sm text-primary-500 font-medium mt-1">
                선택: {token.selectedCrossCoupon.name}
              </p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-secondary-400 flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
