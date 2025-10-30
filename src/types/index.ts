// 시장 타입
export type MarketType = 'KOSPI' | 'KOSDAQ';

// 기업 정보
export interface Company {
  id: string;
  name: string;
  code: string;
  market: MarketType;
  sector: string;
  currentPrice: number;
  priceChange: number;
  priceChangeRate: number;
  marketCap: number;
  volume: number;
  description: string;
}

// 공시 타입
export type DisclosureType =
  | '정기공시'
  | '주요사항보고'
  | '발행공시'
  | '지분공시'
  | '기타공시';

// 공시 데이터
export interface Disclosure {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  type: DisclosureType;
  date: string;
  content: string;
  url?: string;
}

// 재무 데이터
export interface FinancialData {
  companyId: string;
  year: number;
  quarter: number;
  revenue: number;
  operatingProfit: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
}

// 주가 이력
export interface StockHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 분석 데이터
export interface AnalysisData {
  companyId: string;
  per: number; // 주가수익비율
  pbr: number; // 주가순자산비율
  roe: number; // 자기자본이익률
  debtRatio: number; // 부채비율
  currentRatio: number; // 유동비율
  dividendYield: number; // 배당수익률
}

// 3D 포지션
export interface Position3D {
  x: number;
  y: number;
  z: number;
}
