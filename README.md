# K-Stock Metaverse

코스피/코스닥 상장 기업의 공시 데이터와 분석 정보를 제공하는 3D 메타버스 서비스입니다.

## 주요 기능

- 🌌 **3D 메타버스 환경**: React Three Fiber를 활용한 인터랙티브 3D 공간
- 📊 **10개 주요 기업**: 삼성전자, SK하이닉스, NAVER, 카카오 등
- 📈 **실시간 주가 정보**: 현재가, 변동률, 시가총액, 거래량
- 📉 **30일 주가 차트**: Recharts를 사용한 인터랙티브 차트
- 📰 **공시 데이터**: 최근 공시 정보 뷰어 (정기공시, 주요사항보고 등)
- 💼 **투자 지표**: PER, PBR, ROE, 부채비율, 유동비율, 배당수익률
- 🎨 **시장별 색상 구분**: 코스피(파란색) / 코스닥(분홍색)
- 🖱️ **인터랙티브 컨트롤**: 마우스 드래그, 줌, 자동 회전

## 기술 스택

- **React 18** + **TypeScript**
- **Three.js** + **React Three Fiber** + **Drei** (3D 렌더링)
- **Recharts** (데이터 시각화)
- **Vite** (빌드 도구)

## 로컬에서 실행

### 1. 저장소 클론

```bash
git clone https://github.com/Raymond-Aidev/vite-react.git
cd vite-react
git checkout claude/metaverse-disclosure-service-011CUcoY7uHTg14yG7ATkecW
```

### 2. 의존성 설치

```bash
npm install --legacy-peer-deps
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 배포 방법

### Vercel 배포 (추천)

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 `Raymond-Aidev/vite-react` 선택
4. 브랜치: `claude/metaverse-disclosure-service-011CUcoY7uHTg14yG7ATkecW`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Install Command: `npm install --legacy-peer-deps`
8. Deploy 클릭!

### GitHub Pages 배포

1. GitHub 저장소 Settings > Pages
2. Source: "GitHub Actions" 선택
3. 코드를 푸시하면 자동으로 배포됩니다

배포 URL: `https://raymond-aidev.github.io/vite-react/`

### Netlify 배포

1. [Netlify](https://netlify.com)에 로그인
2. "Add new site" > "Import an existing project"
3. GitHub 저장소 선택
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Deploy!

## 사용 방법

1. **마우스 드래그**: 화면을 회전시켜 다양한 각도에서 기업들을 볼 수 있습니다
2. **스크롤**: 줌 인/아웃으로 거리를 조절할 수 있습니다
3. **기업 큐브 클릭**: 상세 정보와 주가 차트를 확인할 수 있습니다
4. **자동 회전**: 씬이 천천히 자동으로 회전합니다
5. **색상 구분**: 파란색(코스피) / 분홍색(코스닥)

## 프로젝트 구조

```
src/
├── components/
│   ├── MetaverseScene.tsx      # 3D 씬 관리
│   ├── CompanyCard3D.tsx        # 3D 기업 카드
│   ├── CompanyInfoPanel.tsx     # 기업 정보 패널
│   ├── DisclosureViewer.tsx     # 공시 뷰어
│   └── StockChart.tsx           # 주가 차트
├── data/
│   └── mockData.ts              # Mock 데이터
├── types/
│   └── index.ts                 # TypeScript 타입 정의
└── App.tsx                      # 메인 앱
```

## 라이선스

MIT

## 제작

Claude Code로 제작되었습니다.
