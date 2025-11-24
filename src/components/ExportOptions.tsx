import { useState } from 'react';
import { TestData } from '../types/topik';
import { TestExporter } from '../lib/exporter';

interface ExportOptionsProps {
  testData: TestData;
}

export default function ExportOptions({ testData }: ExportOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const exporter = new TestExporter();

  const handleExport = (format: 'json' | 'markdown' | 'html') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `TOPIK_II_${timestamp}`;

    switch (format) {
      case 'json': {
        const content = exporter.exportToJSON(testData);
        exporter.downloadFile(content, `${filename}.json`, 'application/json');
        break;
      }
      case 'markdown': {
        const content = exporter.exportToMarkdown(testData);
        exporter.downloadFile(content, `${filename}.md`, 'text/markdown');
        break;
      }
      case 'html': {
        const content = exporter.exportToHTML(testData);
        exporter.downloadFile(content, `${filename}.html`, 'text/html');
        break;
      }
    }

    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        내보내기
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="font-semibold text-gray-900">JSON</div>
                  <div className="text-xs text-gray-500">데이터 형식</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('markdown')}
                className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-semibold text-gray-900">Markdown</div>
                  <div className="text-xs text-gray-500">텍스트 문서</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('html')}
                className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <div>
                  <div className="font-semibold text-gray-900">HTML</div>
                  <div className="text-xs text-gray-500">웹 페이지</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
