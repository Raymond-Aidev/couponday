import { TOPIKQuestion, TestMetadata } from '../types/topik';

interface TestViewerProps {
  questions: TOPIKQuestion[];
  metadata: TestMetadata;
}

export default function TestViewer({ questions, metadata }: TestViewerProps) {
  return (
    <div className="space-y-6">
      {/* Metadata Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">시험 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">시험 ID:</span>
            <p className="font-mono text-gray-900">{metadata.testId}</p>
          </div>
          <div>
            <span className="text-gray-600">생성 일시:</span>
            <p className="text-gray-900">{new Date(metadata.createdAt).toLocaleString('ko-KR')}</p>
          </div>
          <div>
            <span className="text-gray-600">총 문제 수:</span>
            <p className="text-gray-900">{metadata.totalQuestions}문제</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionCard key={question.number} question={question} />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ question }: { question: TOPIKQuestion }) {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 3:
        return 'bg-green-100 text-green-800';
      case 4:
        return 'bg-blue-100 text-blue-800';
      case 5:
        return 'bg-purple-100 text-purple-800';
      case 6:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
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
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
            {question.number}
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(question.level)}`}>
              {question.level}급
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
              {getTypeLabel(question.type)}
            </span>
            {question.topic && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                {question.topic}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Passage */}
      {question.passage && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
            {question.passage}
          </pre>
        </div>
      )}

      {/* Question Text */}
      <div className="mb-4">
        <p className="text-lg font-semibold text-gray-900">{question.question}</p>
      </div>

      {/* Choices */}
      <div className="space-y-2">
        {question.choices.map((choice, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-2 transition ${
              index + 1 === question.answer
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start">
              <span className={`font-bold mr-3 ${
                index + 1 === question.answer ? 'text-green-700' : 'text-gray-600'
              }`}>
                {index + 1}.
              </span>
              <span className={`flex-1 ${
                index + 1 === question.answer ? 'text-green-900 font-medium' : 'text-gray-800'
              }`}>
                {choice}
              </span>
              {index + 1 === question.answer && (
                <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">
                  정답
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">해설:</span> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
