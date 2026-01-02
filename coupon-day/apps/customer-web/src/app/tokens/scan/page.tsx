'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, FlashlightOff, Flashlight, AlertCircle } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { clsx } from 'clsx';

export default function TokenScanPage() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Check camera permission
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then(() => setHasPermission(true))
        .catch(() => setHasPermission(false));
    }
  }, []);

  const handleScan = (result: any) => {
    if (!isScanning) return;

    try {
      const data = result[0]?.rawValue;
      if (!data) return;

      setIsScanning(false);

      // Try to parse as JSON first (our token format)
      try {
        const parsed = JSON.parse(data);
        if (parsed.tokenCode) {
          router.push(`/tokens/${parsed.tokenCode}`);
          return;
        }
      } catch {
        // Not JSON, try as plain token code
      }

      // If it's a URL with token code
      if (data.includes('/tokens/')) {
        const tokenCode = data.split('/tokens/').pop()?.split('?')[0];
        if (tokenCode) {
          router.push(`/tokens/${tokenCode}`);
          return;
        }
      }

      // Try as plain token code (alphanumeric string)
      if (/^[A-Za-z0-9-_]+$/.test(data) && data.length >= 6) {
        router.push(`/tokens/${data}`);
        return;
      }

      setError('유효하지 않은 QR 코드입니다');
      setIsScanning(true);
    } catch (e) {
      setError('QR 코드를 읽을 수 없습니다');
      setIsScanning(true);
    }
  };

  const handleError = (err: any) => {
    console.error('Scanner error:', err);
    if (err?.name === 'NotAllowedError') {
      setHasPermission(false);
    } else {
      setError('카메라를 시작할 수 없습니다');
    }
  };

  // Permission denied
  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-secondary-900 flex flex-col items-center justify-center p-6">
        <Camera className="w-16 h-16 text-secondary-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">카메라 권한이 필요합니다</h2>
        <p className="text-secondary-400 text-center mb-6">
          QR 코드를 스캔하려면 카메라 접근을 허용해주세요
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl"
        >
          다시 시도
        </button>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-3 text-secondary-400"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-900 relative">
      {/* Header */}
      <header
        className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="font-semibold text-white">QR 스캔</h1>
        <button
          onClick={() => setTorchOn(!torchOn)}
          className="w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center"
        >
          {torchOn ? (
            <Flashlight className="w-6 h-6 text-yellow-400" />
          ) : (
            <FlashlightOff className="w-6 h-6 text-white" />
          )}
        </button>
      </header>

      {/* Scanner */}
      <div className="relative w-full h-screen">
        {hasPermission && (
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={{
              facingMode: 'environment',
            }}
            styles={{
              container: {
                width: '100%',
                height: '100%',
              },
              video: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              },
            }}
            components={{
              torch: torchOn,
            }}
          />
        )}

        {/* Scan Frame Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top overlay */}
          <div className="absolute top-0 left-0 right-0 h-[30%] bg-black/60" />
          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-black/60" />
          {/* Left overlay */}
          <div className="absolute top-[30%] left-0 w-[15%] h-[40%] bg-black/60" />
          {/* Right overlay */}
          <div className="absolute top-[30%] right-0 w-[15%] h-[40%] bg-black/60" />

          {/* Frame corners */}
          <div className="absolute top-[30%] left-[15%] w-8 h-8 border-l-4 border-t-4 border-primary-500 rounded-tl-lg" />
          <div className="absolute top-[30%] right-[15%] w-8 h-8 border-r-4 border-t-4 border-primary-500 rounded-tr-lg" />
          <div className="absolute bottom-[30%] left-[15%] w-8 h-8 border-l-4 border-b-4 border-primary-500 rounded-bl-lg" />
          <div className="absolute bottom-[30%] right-[15%] w-8 h-8 border-r-4 border-b-4 border-primary-500 rounded-br-lg" />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        <p className="text-white font-medium mb-2">토큰 QR 코드를 스캔하세요</p>
        <p className="text-secondary-400 text-sm">
          매장에서 받은 토큰 QR 코드를 프레임 안에 맞춰주세요
        </p>
      </div>

      {/* Error Toast */}
      {error && (
        <div
          className="absolute top-24 left-4 right-4 z-30 animate-fade-in"
          style={{ top: 'calc(env(safe-area-inset-top) + 80px)' }}
        >
          <div className="bg-red-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Manual Input Link */}
      <div className="absolute bottom-24 left-0 right-0 text-center">
        <button
          onClick={() => {
            const code = prompt('토큰 코드를 입력하세요');
            if (code && code.trim()) {
              router.push(`/tokens/${code.trim()}`);
            }
          }}
          className="text-primary-400 text-sm underline"
        >
          코드 직접 입력
        </button>
      </div>
    </div>
  );
}
