import { TOPIKQuestion, TestData } from '../types/topik';

export class TestExporter {
  exportToJSON(testData: TestData): string {
    return JSON.stringify(testData, null, 2);
  }

  exportToMarkdown(testData: TestData): string {
    const { metadata, questions } = testData;

    let markdown = `# TOPIK II 읽기 시험\n\n`;
    markdown += `## 시험 정보\n`;
    markdown += `- 시험 ID: ${metadata.testId}\n`;
    markdown += `- 생성 일시: ${new Date(metadata.createdAt).toLocaleString('ko-KR')}\n`;
    markdown += `- 문제 수: ${metadata.totalQuestions}문제\n`;
    markdown += `- 시험 시간: 70분\n`;
    markdown += `- 배점: 각 2점 (총 100점)\n\n`;
    markdown += `---\n\n`;

    questions.forEach(q => {
      markdown += `### ${q.number}번\n\n`;

      if (q.passage) {
        markdown += `${q.passage}\n\n`;
      }

      markdown += `**${q.question}**\n\n`;

      q.choices.forEach((choice, index) => {
        markdown += `${index + 1}. ${choice}\n`;
      });

      markdown += `\n`;
    });

    markdown += `---\n\n`;
    markdown += `## 정답표\n\n`;

    let answerLine = '';
    questions.forEach((q, index) => {
      answerLine += `${q.number}. ④${q.answer}`;
      if ((index + 1) % 10 === 0) {
        answerLine += '\n';
      } else if (index < questions.length - 1) {
        answerLine += ', ';
      }
    });

    markdown += answerLine + '\n';

    return markdown;
  }

  exportToHTML(testData: TestData): string {
    const { metadata, questions } = testData;

    let html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TOPIK II 읽기 시험 - ${metadata.testId}</title>
    <style>
        body {
            font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            margin: 0 0 20px 0;
        }
        .info {
            color: #666;
            line-height: 1.8;
        }
        .question {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .question-number {
            font-size: 1.2em;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 15px;
        }
        .passage {
            background: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #2563eb;
            margin-bottom: 15px;
            line-height: 1.8;
            white-space: pre-wrap;
        }
        .question-text {
            font-weight: 500;
            margin-bottom: 15px;
            font-size: 1.05em;
        }
        .choices {
            margin-left: 10px;
        }
        .choice {
            padding: 10px;
            margin: 8px 0;
            border-radius: 5px;
            transition: background-color 0.2s;
        }
        .choice:hover {
            background-color: #e5e7eb;
        }
        .answer-sheet {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-top: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .answer-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-top: 20px;
        }
        .answer-item {
            padding: 10px;
            background: #f3f4f6;
            border-radius: 5px;
            text-align: center;
        }
        @media print {
            body {
                background: white;
            }
            .question, .header, .answer-sheet {
                box-shadow: none;
                page-break-inside: avoid;
            }
            .answer-sheet {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>TOPIK II 읽기 시험</h1>
        <div class="info">
            <div><strong>시험 ID:</strong> ${metadata.testId}</div>
            <div><strong>생성 일시:</strong> ${new Date(metadata.createdAt).toLocaleString('ko-KR')}</div>
            <div><strong>문제 수:</strong> ${metadata.totalQuestions}문제</div>
            <div><strong>시험 시간:</strong> 70분</div>
            <div><strong>배점:</strong> 각 2점 (총 100점)</div>
        </div>
    </div>
`;

    questions.forEach(q => {
      html += `
    <div class="question">
        <div class="question-number">${q.number}번</div>
`;

      if (q.passage) {
        html += `        <div class="passage">${this.escapeHtml(q.passage)}</div>\n`;
      }

      html += `        <div class="question-text">${this.escapeHtml(q.question)}</div>
        <div class="choices">
`;

      q.choices.forEach((choice, index) => {
        html += `            <div class="choice">${index + 1}. ${this.escapeHtml(choice)}</div>\n`;
      });

      html += `        </div>
    </div>
`;
    });

    html += `
    <div class="answer-sheet">
        <h2>정답표</h2>
        <div class="answer-grid">
`;

    questions.forEach(q => {
      html += `            <div class="answer-item">${q.number}. ④${q.answer}</div>\n`;
    });

    html += `        </div>
    </div>
</body>
</html>`;

    return html;
  }

  exportAnswerSheet(questions: TOPIKQuestion[]): string {
    let sheet = '# TOPIK II 읽기 정답표\n\n';

    questions.forEach(q => {
      sheet += `${q.number}. 정답: ${q.answer}번`;
      if (q.explanation) {
        sheet += ` - ${q.explanation}`;
      }
      sheet += '\n';
    });

    return sheet;
  }

  downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
