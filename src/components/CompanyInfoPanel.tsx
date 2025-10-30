import { Company, AnalysisData } from '../types';

interface CompanyInfoPanelProps {
  company: Company | null;
  analysisData: AnalysisData | undefined;
  onClose: () => void;
}

export const CompanyInfoPanel = ({ company, analysisData, onClose }: CompanyInfoPanelProps) => {
  if (!company) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}조`;
    }
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(2)}억`;
    }
    return value.toLocaleString();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(10, 10, 30, 0.95)',
        border: '2px solid #4a90e2',
        borderRadius: '15px',
        padding: '30px',
        minWidth: '600px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        color: 'white',
        boxShadow: '0 0 30px rgba(74, 144, 226, 0.5)',
        zIndex: 1000,
      }}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '5px 10px',
        }}
      >
        ✕
      </button>

      {/* 기업 기본 정보 */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#4a90e2' }}>
          {company.name}
        </h2>
        <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#aaa' }}>
          <span>종목코드: {company.code}</span>
          <span>시장: {company.market}</span>
          <span>업종: {company.sector}</span>
        </div>
      </div>

      {/* 주가 정보 */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>주가 정보</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>현재가</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {company.currentPrice.toLocaleString()}원
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>전일대비</div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: company.priceChange >= 0 ? '#00ff00' : '#ff0000',
              }}
            >
              {company.priceChange >= 0 ? '+' : ''}
              {company.priceChange.toLocaleString()}원 (
              {company.priceChange >= 0 ? '+' : ''}
              {company.priceChangeRate.toFixed(2)}%)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>시가총액</div>
            <div style={{ fontSize: '18px' }}>{formatCurrency(company.marketCap)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>거래량</div>
            <div style={{ fontSize: '18px' }}>{company.volume.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 분석 데이터 */}
      {analysisData && (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>투자 지표</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>PER</div>
              <div style={{ fontSize: '18px' }}>{analysisData.per.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>PBR</div>
              <div style={{ fontSize: '18px' }}>{analysisData.pbr.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>ROE</div>
              <div style={{ fontSize: '18px' }}>{analysisData.roe.toFixed(2)}%</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>부채비율</div>
              <div style={{ fontSize: '18px' }}>{analysisData.debtRatio.toFixed(2)}%</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>유동비율</div>
              <div style={{ fontSize: '18px' }}>{analysisData.currentRatio.toFixed(2)}%</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                배당수익률
              </div>
              <div style={{ fontSize: '18px' }}>{analysisData.dividendYield.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* 기업 설명 */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '10px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>기업 개요</h3>
        <p style={{ margin: 0, lineHeight: '1.6', color: '#ddd' }}>{company.description}</p>
      </div>
    </div>
  );
};
