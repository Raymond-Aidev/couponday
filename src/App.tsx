import { useState, useMemo } from 'react';
import { MetaverseScene } from './components/MetaverseScene';
import { CompanyInfoPanel } from './components/CompanyInfoPanel';
import { DisclosureViewer } from './components/DisclosureViewer';
import { StockChart } from './components/StockChart';
import {
  mockCompanies,
  mockDisclosures,
  mockAnalysisData,
  generateStockHistory,
} from './data/mockData';
import { Company } from './types';

function App() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showChart, setShowChart] = useState(false);

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setShowChart(true);
  };

  const handleClosePanel = () => {
    setSelectedCompany(null);
    setShowChart(false);
  };

  const selectedAnalysisData = useMemo(() => {
    if (!selectedCompany) return undefined;
    return mockAnalysisData.find((data) => data.companyId === selectedCompany.id);
  }, [selectedCompany]);

  const stockHistory = useMemo(() => {
    if (!selectedCompany) return [];
    return generateStockHistory(selectedCompany.currentPrice);
  }, [selectedCompany]);

  const filteredDisclosures = useMemo(() => {
    if (!selectedCompany) return mockDisclosures;
    return mockDisclosures.filter((d) => d.companyId === selectedCompany.id);
  }, [selectedCompany]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 헤더 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '20px 40px',
          background: 'linear-gradient(to bottom, rgba(10, 10, 30, 0.95), transparent)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              color: '#4a90e2',
              textShadow: '0 0 10px rgba(74, 144, 226, 0.5)',
            }}
          >
            K-Stock Metaverse
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '14px' }}>
            코스피/코스닥 기업 공시 및 분석 데이터 메타버스
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ padding: '8px 16px', backgroundColor: 'rgba(74, 144, 226, 0.3)', borderRadius: '20px', color: 'white', fontSize: '14px' }}>
            총 {mockCompanies.length}개 기업
          </div>
          <div style={{ padding: '8px 16px', backgroundColor: 'rgba(74, 144, 226, 0.3)', borderRadius: '20px', color: 'white', fontSize: '14px' }}>
            최근 {mockDisclosures.length}건 공시
          </div>
        </div>
      </div>

      {/* 3D 메타버스 씬 */}
      <MetaverseScene companies={mockCompanies} onCompanyClick={handleCompanyClick} />

      {/* 공시 정보 뷰어 */}
      <DisclosureViewer
        disclosures={mockDisclosures}
        selectedCompanyId={selectedCompany?.id}
      />

      {/* 기업 정보 패널 */}
      {selectedCompany && !showChart && (
        <CompanyInfoPanel
          company={selectedCompany}
          analysisData={selectedAnalysisData}
          onClose={handleClosePanel}
        />
      )}

      {/* 주가 차트 패널 */}
      {selectedCompany && showChart && (
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
            minWidth: '800px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto',
            color: 'white',
            boxShadow: '0 0 30px rgba(74, 144, 226, 0.5)',
            zIndex: 1000,
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={handleClosePanel}
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

          {/* 기업 정보 헤더 */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#4a90e2' }}>
              {selectedCompany.name}
            </h2>
            <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#aaa' }}>
              <span>종목코드: {selectedCompany.code}</span>
              <span>시장: {selectedCompany.market}</span>
              <span>업종: {selectedCompany.sector}</span>
            </div>
          </div>

          {/* 현재 주가 */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>현재가</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {selectedCompany.currentPrice.toLocaleString()}원
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>전일대비</div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: selectedCompany.priceChange >= 0 ? '#00ff00' : '#ff0000',
                }}
              >
                {selectedCompany.priceChange >= 0 ? '+' : ''}
                {selectedCompany.priceChangeRate.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* 주가 차트 */}
          <StockChart data={stockHistory} companyName={selectedCompany.name} />

          {/* 투자 지표 */}
          {selectedAnalysisData && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '20px',
                borderRadius: '10px',
                marginTop: '20px',
              }}
            >
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>투자 지표</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>PER</div>
                  <div style={{ fontSize: '18px' }}>{selectedAnalysisData.per.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>PBR</div>
                  <div style={{ fontSize: '18px' }}>{selectedAnalysisData.pbr.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>ROE</div>
                  <div style={{ fontSize: '18px' }}>{selectedAnalysisData.roe.toFixed(2)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                    부채비율
                  </div>
                  <div style={{ fontSize: '18px' }}>
                    {selectedAnalysisData.debtRatio.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                    유동비율
                  </div>
                  <div style={{ fontSize: '18px' }}>
                    {selectedAnalysisData.currentRatio.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                    배당수익률
                  </div>
                  <div style={{ fontSize: '18px' }}>
                    {selectedAnalysisData.dividendYield.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 최근 공시 */}
          {filteredDisclosures.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '20px',
                borderRadius: '10px',
                marginTop: '20px',
              }}
            >
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>최근 공시</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredDisclosures.slice(0, 3).map((disclosure) => (
                  <div
                    key={disclosure.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '12px',
                      borderRadius: '6px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '5px',
                      }}
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        {disclosure.title}
                      </span>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>{disclosure.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#ccc' }}>{disclosure.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 사용 가이드 */}
      <div
        style={{
          position: 'fixed',
          top: '120px',
          right: '20px',
          backgroundColor: 'rgba(10, 10, 30, 0.8)',
          border: '1px solid #4a90e2',
          borderRadius: '10px',
          padding: '15px',
          color: 'white',
          fontSize: '12px',
          maxWidth: '250px',
          zIndex: 100,
        }}
      >
        <h4 style={{ margin: '0 0 10px 0', color: '#4a90e2' }}>사용 가이드</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>마우스로 드래그하여 화면 회전</li>
          <li>스크롤로 줌 인/아웃</li>
          <li>기업 큐브를 클릭하여 상세 정보 확인</li>
          <li>파란색: 코스피 / 분홍색: 코스닥</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
