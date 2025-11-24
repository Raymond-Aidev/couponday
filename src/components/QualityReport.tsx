import { QualityReport as QualityReportType } from '../types/topik';

interface QualityReportProps {
  report: QualityReportType;
}

export default function QualityReport({ report }: QualityReportProps) {
  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`rounded-lg shadow-md p-6 ${
        report.isValid ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
      }`}>
        <div className="flex items-center gap-3">
          {report.isValid ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {report.isValid ? '품질 검증 통과' : '품질 검증 실패'}
            </h2>
            <p className="text-gray-700">
              총 {report.totalQuestions}개 문제 검증 완료
            </p>
          </div>
        </div>

        {report.errors.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-red-900">발견된 문제:</h3>
            <ul className="list-disc list-inside space-y-1">
              {report.errors.map((error, index) => (
                <li key={index} className="text-red-800">{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Question Type Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">문제 유형 분포</h3>
        <div className="space-y-3">
          {Object.entries(report.questionTypes).map(([type, count]) => (
            <div key={type} className="flex items-center">
              <div className="w-48 text-sm text-gray-700">{getTypeLabel(type)}</div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${(count / report.totalQuestions) * 100}%` }}
                  >
                    {count > 0 && `${count}개`}
                  </div>
                </div>
              </div>
              <div className="w-16 text-right text-sm font-semibold text-gray-900">
                {((count / report.totalQuestions) * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">난이도 분포</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(report.difficultyDistribution).map(([level, count]) => (
            <div key={level} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{count}</div>
              <div className="text-sm text-gray-700 mt-1">{level}급</div>
              <div className="text-xs text-gray-500 mt-1">
                {((count / report.totalQuestions) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">정답 분포</h3>
        <p className="text-sm text-gray-600 mb-4">
          각 번호당 20-30% (10-15개)가 적절합니다
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(report.answerDistribution).map(([answer, count]) => {
            const percentage = (count / report.totalQuestions) * 100;
            const isBalanced = percentage >= 20 && percentage <= 30;

            return (
              <div
                key={answer}
                className={`rounded-lg p-4 text-center ${
                  isBalanced
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500'
                }`}
              >
                <div className={`text-3xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {count}
                </div>
                <div className="text-sm text-gray-700 mt-1">{answer}번</div>
                <div className={`text-xs mt-1 font-semibold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                  {percentage.toFixed(1)}%
                </div>
                {isBalanced && (
                  <div className="mt-2">
                    <svg className="w-5 h-5 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">통계 요약</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">문제 유형</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {Object.keys(report.questionTypes).length}개
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">난이도 범위</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              3-6급
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">검증 상태</div>
            <div className={`text-2xl font-bold mt-1 ${report.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {report.isValid ? '통과' : '실패'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    grammar_blank: '문법 빈칸',
    synonym: '유의어',
    text_type: '글의 종류',
    content_match: '내용 일치',
    sequence: '순서 배열',
    context_blank: '문맥 빈칸',
    short_passage: '짧은 지문',
    news_title: '제목 찾기',
    long_blank: '긴 글 빈칸',
    content_match_long: '긴 글 내용 일치',
    main_idea: '중심 생각',
    sentence_insert: '문장 삽입',
    emotion_passage: '감정 파악',
    blank_and_topic: '빈칸과 주제',
    attitude_content: '태도 파악',
    purpose_blank_content: '목적 파악'
  };
  return labels[type] || type;
}
