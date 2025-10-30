import { Disclosure } from '../types';

interface DisclosureViewerProps {
  disclosures: Disclosure[];
  selectedCompanyId?: string;
}

export const DisclosureViewer = ({
  disclosures,
  selectedCompanyId,
}: DisclosureViewerProps) => {
  const filteredDisclosures = selectedCompanyId
    ? disclosures.filter((d) => d.companyId === selectedCompanyId)
    : disclosures;

  const getTypeColor = (type: string) => {
    switch (type) {
      case '정기공시':
        return '#4a90e2';
      case '주요사항보고':
        return '#e2904a';
      case '발행공시':
        return '#4ae290';
      case '지분공시':
        return '#e24a90';
      default:
        return '#888';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        maxHeight: '250px',
        backgroundColor: 'rgba(10, 10, 30, 0.95)',
        border: '2px solid #4a90e2',
        borderRadius: '15px',
        padding: '20px',
        color: 'white',
        overflow: 'auto',
        boxShadow: '0 0 30px rgba(74, 144, 226, 0.5)',
        zIndex: 100,
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#4a90e2' }}>
        최근 공시 정보 {selectedCompanyId && '(선택된 기업)'}
      </h3>

      {filteredDisclosures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>
          공시 정보가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredDisclosures.map((disclosure) => (
            <div
              key={disclosure.id}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '15px',
                borderRadius: '8px',
                borderLeft: `4px solid ${getTypeColor(disclosure.type)}`,
                display: 'grid',
                gridTemplateColumns: '150px 120px 1fr',
                gap: '15px',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {disclosure.companyName}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>{disclosure.date}</div>
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    backgroundColor: getTypeColor(disclosure.type),
                    color: 'white',
                  }}
                >
                  {disclosure.type}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {disclosure.title}
                </div>
                <div style={{ fontSize: '13px', color: '#ccc' }}>{disclosure.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
