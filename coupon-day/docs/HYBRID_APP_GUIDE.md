# 쿠폰데이 하이브리드 앱 빌드 가이드

## 개요

쿠폰데이는 Next.js + Capacitor 기반의 하이브리드 앱입니다.
웹앱을 iOS/Android 네이티브 앱으로 빌드할 수 있습니다.

## 프로젝트 구조

```
apps/
├── store-web/      # 점포용 웹앱 (포트 3001)
├── customer-web/   # 고객용 웹앱 (포트 3002)
└── api-server/     # API 서버 (포트 3000)
```

## 개발 환경 설정

### 1. 전체 의존성 설치

```bash
cd coupon-day
pnpm install
```

### 2. 개발 서버 실행

```bash
# API 서버
cd apps/api-server && pnpm dev

# 점포용 웹앱 (별도 터미널)
cd apps/store-web && pnpm dev

# 고객용 웹앱 (별도 터미널)
cd apps/customer-web && pnpm dev
```

### 3. 접속 주소

- API 서버: http://localhost:3000
- API 문서: http://localhost:3000/docs
- 점포용 웹: http://localhost:3001
- 고객용 웹: http://localhost:3002

## iOS 앱 빌드

### 사전 요구사항

- macOS
- Xcode 15+ (App Store에서 설치)
- CocoaPods: `sudo gem install cocoapods`

### 빌드 단계

```bash
cd apps/store-web  # 또는 customer-web

# 1. 프로덕션 빌드
pnpm build

# 2. iOS 플랫폼 추가 (최초 1회)
npx cap add ios

# 3. 웹 빌드를 네이티브로 동기화
npx cap sync ios

# 4. Xcode에서 프로젝트 열기
npx cap open ios
```

### Xcode에서 앱 실행

1. Xcode가 열리면 좌측에서 프로젝트 선택
2. 상단에서 시뮬레이터 또는 연결된 기기 선택
3. ▶️ 버튼 클릭하여 실행

### App Store 배포

1. **인증서 설정**: Apple Developer Program 가입 필요
2. **Signing & Capabilities**: Team 선택
3. **Archive**: Product > Archive
4. **App Store Connect**: 앱 정보 입력 후 업로드

## Android 앱 빌드

### 사전 요구사항

- Android Studio (https://developer.android.com/studio)
- JDK 17+

### 빌드 단계

```bash
cd apps/store-web  # 또는 customer-web

# 1. 프로덕션 빌드
pnpm build

# 2. Android 플랫폼 추가 (최초 1회)
npx cap add android

# 3. 웹 빌드를 네이티브로 동기화
npx cap sync android

# 4. Android Studio에서 프로젝트 열기
npx cap open android
```

### Android Studio에서 앱 실행

1. Gradle sync 완료 대기
2. 상단에서 에뮬레이터 또는 연결된 기기 선택
3. ▶️ 버튼 클릭하여 실행

### Google Play 배포

1. **Build > Generate Signed Bundle / APK**
2. **키스토어 생성** (최초 1회)
3. **AAB 파일 생성**
4. **Google Play Console**에서 앱 등록 및 업로드

## PWA (Progressive Web App)

웹브라우저에서 바로 설치 가능한 PWA도 지원합니다.

### 특징

- 오프라인 지원 (Service Worker)
- 홈 화면 추가 가능
- 푸시 알림 지원

### 설치 방법 (사용자)

**iOS Safari:**
1. 사이트 방문
2. 공유 버튼 탭
3. "홈 화면에 추가" 선택

**Android Chrome:**
1. 사이트 방문
2. 메뉴 > "앱 설치" 또는 "홈 화면에 추가"

## 환경변수 설정

### 프로덕션 환경

`apps/store-web/.env.production`:
```
NEXT_PUBLIC_API_URL=https://api.couponday.co.kr
```

`apps/customer-web/.env.production`:
```
NEXT_PUBLIC_API_URL=https://api.couponday.co.kr
```

## 네이티브 기능 (Capacitor 플러그인)

### 현재 설치된 플러그인

| 플러그인 | 용도 |
|---------|------|
| @capacitor/app | 앱 라이프사이클, 딥링크 |
| @capacitor/haptics | 햅틱 피드백 (진동) |
| @capacitor/keyboard | 키보드 이벤트 |
| @capacitor/status-bar | 상태바 스타일 |
| @capacitor/splash-screen | 스플래시 화면 |
| @capacitor/push-notifications | 푸시 알림 |
| @capacitor/camera | 카메라/QR 스캔 |

### 햅틱 피드백 사용 예시

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const handleClick = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
};
```

## 아이콘 및 스플래시 이미지

### 아이콘 규격

`public/icons/` 폴더에 다음 크기의 아이콘 필요:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### 아이콘 생성 도구

```bash
# capacitor-assets 사용 (권장)
npm install -g @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#f97316'
```

또는 온라인 도구:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

## 트러블슈팅

### iOS 빌드 오류

```bash
# CocoaPods 캐시 정리
cd ios/App && pod deintegrate && pod install
```

### Android 빌드 오류

```bash
# Gradle 캐시 정리
cd android && ./gradlew clean
```

### 웹뷰 디버깅

**iOS:**
Safari > 개발자 > [기기명] > [앱명]

**Android:**
Chrome > chrome://inspect > Remote Target

## 자동화 스크립트

### 전체 빌드

```bash
# store-web
cd apps/store-web
pnpm build:mobile  # next build && cap sync

# customer-web
cd apps/customer-web
pnpm build:mobile
```

## 테스트 계정

개발 환경에서 사용 가능한 테스트 계정:

**점포용 앱:**
- 전화번호: 01012345678
- 비밀번호: test1234

**고객용 앱:**
- 비회원으로 자동 세션 생성
