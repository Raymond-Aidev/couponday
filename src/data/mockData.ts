import { Company, Disclosure, FinancialData, AnalysisData, StockHistory } from '../types';

// Mock 기업 데이터
export const mockCompanies: Company[] = [
  {
    id: '1',
    name: '삼성전자',
    code: '005930',
    market: 'KOSPI',
    sector: '전기전자',
    currentPrice: 71800,
    priceChange: 1200,
    priceChangeRate: 1.7,
    marketCap: 4289000000000000,
    volume: 15234567,
    description: '반도체, 스마트폰, 가전제품 등을 생산하는 글로벌 전자기업',
  },
  {
    id: '2',
    name: 'SK하이닉스',
    code: '000660',
    market: 'KOSPI',
    sector: '반도체',
    currentPrice: 145000,
    priceChange: -2500,
    priceChangeRate: -1.69,
    marketCap: 1056000000000000,
    volume: 8456123,
    description: '메모리 반도체 전문 기업',
  },
  {
    id: '3',
    name: 'NAVER',
    code: '035420',
    market: 'KOSPI',
    sector: '인터넷',
    currentPrice: 195500,
    priceChange: 3500,
    priceChangeRate: 1.82,
    marketCap: 320000000000000,
    volume: 654321,
    description: '대한민국 1위 포털 사이트 및 IT 플랫폼 기업',
  },
  {
    id: '4',
    name: '카카오',
    code: '035720',
    market: 'KOSPI',
    sector: '인터넷',
    currentPrice: 43200,
    priceChange: -800,
    priceChangeRate: -1.82,
    marketCap: 190000000000000,
    volume: 3456789,
    description: '메신저 및 다양한 플랫폼 서비스를 제공하는 IT 기업',
  },
  {
    id: '5',
    name: '현대차',
    code: '005380',
    market: 'KOSPI',
    sector: '자동차',
    currentPrice: 234000,
    priceChange: 5000,
    priceChangeRate: 2.18,
    marketCap: 500000000000000,
    volume: 987654,
    description: '글로벌 자동차 제조 기업',
  },
  {
    id: '6',
    name: 'LG에너지솔루션',
    code: '373220',
    market: 'KOSPI',
    sector: '전기전자',
    currentPrice: 410000,
    priceChange: 8000,
    priceChangeRate: 1.99,
    marketCap: 956000000000000,
    volume: 456789,
    description: '배터리 전문 기업',
  },
  {
    id: '7',
    name: '셀트리온',
    code: '068270',
    market: 'KOSPI',
    sector: '제약',
    currentPrice: 178000,
    priceChange: 3000,
    priceChangeRate: 1.71,
    marketCap: 238000000000000,
    volume: 234567,
    description: '바이오시밀러 전문 제약회사',
  },
  {
    id: '8',
    name: '엔씨소프트',
    code: '036570',
    market: 'KOSDAQ',
    sector: '게임',
    currentPrice: 243000,
    priceChange: -4000,
    priceChangeRate: -1.62,
    marketCap: 520000000000000,
    volume: 123456,
    description: '온라인 게임 개발 및 퍼블리싱 기업',
  },
  {
    id: '9',
    name: '펄어비스',
    code: '263750',
    market: 'KOSDAQ',
    sector: '게임',
    currentPrice: 45600,
    priceChange: 1200,
    priceChangeRate: 2.70,
    marketCap: 98000000000000,
    volume: 567890,
    description: '검은사막 등 온라인 게임 개발사',
  },
  {
    id: '10',
    name: '에코프로비엠',
    code: '247540',
    market: 'KOSDAQ',
    sector: '전기전자',
    currentPrice: 167000,
    priceChange: 2500,
    priceChangeRate: 1.52,
    marketCap: 236000000000000,
    volume: 345678,
    description: '2차전지 양극재 제조업체',
  },
];

// Mock 공시 데이터
export const mockDisclosures: Disclosure[] = [
  {
    id: 'd1',
    companyId: '1',
    companyName: '삼성전자',
    title: '2024년 4분기 실적 발표',
    type: '정기공시',
    date: '2025-01-15',
    content: '2024년 4분기 영업이익 6.5조원, 전년대비 35% 증가',
  },
  {
    id: 'd2',
    companyId: '2',
    companyName: 'SK하이닉스',
    title: '신규 반도체 공장 건설 결정',
    type: '주요사항보고',
    date: '2025-01-20',
    content: '용인에 120조원 규모 신규 반도체 공장 건설 결정',
  },
  {
    id: 'd3',
    companyId: '3',
    companyName: 'NAVER',
    title: '자사주 매입 결정',
    type: '주요사항보고',
    date: '2025-01-18',
    content: '총 3,000억원 규모의 자사주 매입 결정',
  },
  {
    id: 'd4',
    companyId: '4',
    companyName: '카카오',
    title: '임원 인사 공시',
    type: '기타공시',
    date: '2025-01-22',
    content: '신규 대표이사 선임 및 조직 개편',
  },
  {
    id: 'd5',
    companyId: '5',
    companyName: '현대차',
    title: '전기차 신모델 출시 계획',
    type: '주요사항보고',
    date: '2025-01-25',
    content: '2025년 상반기 신규 전기차 3종 출시 예정',
  },
  {
    id: 'd6',
    companyId: '6',
    companyName: 'LG에너지솔루션',
    title: '북미 배터리 공장 증설',
    type: '주요사항보고',
    date: '2025-01-19',
    content: '미국 오하이오주 배터리 공장 생산능력 2배 확대',
  },
  {
    id: 'd7',
    companyId: '1',
    companyName: '삼성전자',
    title: '배당금 지급 결정',
    type: '정기공시',
    date: '2025-01-10',
    content: '주당 361원 현금배당 결정',
  },
  {
    id: 'd8',
    companyId: '8',
    companyName: '엔씨소프트',
    title: '신규 게임 출시 일정 공개',
    type: '기타공시',
    date: '2025-01-23',
    content: '트론 신규 게임 2025년 3분기 글로벌 출시',
  },
];

// Mock 재무 데이터
export const mockFinancialData: FinancialData[] = [
  {
    companyId: '1',
    year: 2024,
    quarter: 4,
    revenue: 67400000000000,
    operatingProfit: 6500000000000,
    netProfit: 5200000000000,
    totalAssets: 448000000000000,
    totalLiabilities: 115000000000000,
    equity: 333000000000000,
  },
  {
    companyId: '2',
    year: 2024,
    quarter: 4,
    revenue: 15600000000000,
    operatingProfit: 3400000000000,
    netProfit: 2800000000000,
    totalAssets: 89000000000000,
    totalLiabilities: 23000000000000,
    equity: 66000000000000,
  },
  {
    companyId: '3',
    year: 2024,
    quarter: 4,
    revenue: 2340000000000,
    operatingProfit: 340000000000,
    netProfit: 280000000000,
    totalAssets: 28900000000000,
    totalLiabilities: 8900000000000,
    equity: 20000000000000,
  },
];

// Mock 분석 데이터
export const mockAnalysisData: AnalysisData[] = [
  {
    companyId: '1',
    per: 18.5,
    pbr: 1.45,
    roe: 8.2,
    debtRatio: 34.5,
    currentRatio: 215.3,
    dividendYield: 2.1,
  },
  {
    companyId: '2',
    per: 22.3,
    pbr: 1.89,
    roe: 12.5,
    debtRatio: 34.8,
    currentRatio: 198.7,
    dividendYield: 1.8,
  },
  {
    companyId: '3',
    per: 28.4,
    pbr: 2.34,
    roe: 11.3,
    debtRatio: 44.5,
    currentRatio: 187.2,
    dividendYield: 0.9,
  },
  {
    companyId: '4',
    per: 15.2,
    pbr: 1.23,
    roe: 7.8,
    debtRatio: 38.9,
    currentRatio: 176.5,
    dividendYield: 1.2,
  },
  {
    companyId: '5',
    per: 9.8,
    pbr: 0.87,
    roe: 9.2,
    debtRatio: 156.7,
    currentRatio: 112.3,
    dividendYield: 3.5,
  },
];

// Mock 주가 이력 데이터
export const generateStockHistory = (basePrice: number): StockHistory[] => {
  const history: StockHistory[] = [];
  const days = 30;
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const changePercent = (Math.random() - 0.5) * 0.05;
    currentPrice = currentPrice * (1 + changePercent);

    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
    const close = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
    const high = Math.max(open, close) * (1 + Math.random() * 0.03);
    const low = Math.min(open, close) * (1 - Math.random() * 0.03);
    const volume = Math.floor(Math.random() * 10000000) + 1000000;

    history.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    });
  }

  return history;
};
