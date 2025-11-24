import { useState } from 'react';
import { useTestStore } from '../store/testStore';
import TestViewer from '../components/TestViewer';
import QualityReport from '../components/QualityReport';
import ExportOptions from '../components/ExportOptions';

export default function HomePage() {
  const { currentTest, qualityReport, isGenerating, error, generateTest, clearTest } = useTestStore();
  const [showReport, setShowReport] = useState(false);

  const handleGenerate = () => {
    generateTest();
    setShowReport(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TOPIK II 읽기 시험 생성기</h1>
              <p className="text-gray-600 mt-1">50개 문제를 자동으로 생성합니다</p>
            </div>
            {currentTest && (
              <button
                onClick={clearTest}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong className="font-bold">오류: </strong>
            <span>{error}</span>
          </div>
        )}

        {!currentTest ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <svg className="w-24 h-24 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">시험 문제 생성하기</h2>
                <p className="text-gray-600">
                  TOPIK II 읽기 시험 50문제를 자동으로 생성합니다.<br />
                  생성 후 JSON, Markdown, HTML 형식으로 내보낼 수 있습니다.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">포함되는 문제 유형:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 문법 빈칸 채우기 (1-2번)</li>
                  <li>• 유의어 선택 (3-4번)</li>
                  <li>• 글의 종류 파악 (5-8번)</li>
                  <li>• 내용 일치 (9-12번)</li>
                  <li>• 문장 순서 배열 (13-15번)</li>
                  <li>• 문맥 빈칸 (16-18번)</li>
                  <li>• 짧은 지문 독해 (19-27번)</li>
                  <li>• 긴 지문 독해 (28-50번)</li>
                </ul>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    생성 중...
                  </span>
                ) : (
                  '시험 생성하기'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowReport(!showReport)}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    showReport
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {showReport ? '문제 보기' : '품질 리포트 보기'}
                </button>

                <ExportOptions testData={currentTest} />

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  새로 생성
                </button>
              </div>
            </div>

            {/* Quality Report or Test Viewer */}
            {showReport && qualityReport ? (
              <QualityReport report={qualityReport} />
            ) : (
              <TestViewer questions={currentTest.questions} metadata={currentTest.metadata} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            TOPIK II 읽기 시험 자동 생성 시스템 | 학습 목적으로만 사용하세요
          </p>
        </div>
      </footer>
    </div>
  );
}
