# formatter.py

import json
from typing import List
from datetime import datetime
from jinja2 import Template
from topik_generator import TOPIKQuestion


class TestFormatter:
    """다양한 형식으로 테스트 출력"""

    def __init__(self):
        pass

    def to_markdown(self, questions: List[TOPIKQuestion], filepath: str, include_answers: bool = True):
        """Markdown 형식으로 저장

        Args:
            questions: 문제 리스트
            filepath: 저장 경로
            include_answers: 정답 포함 여부
        """

        template_str = """# TOPIK II 읽기 시험

## 시험 정보
- 문제 수: {{ question_count }}문제
- 시간: 70분
- 배점: 각 2점 (총 100점)
- 생성일: {{ created_date }}

---

{% for q in questions %}
### {{ q.number }}번{% if q.topic %} [{{ q.topic }}]{% endif %}

{% if q.passage %}
**[지문]**

{{ q.passage }}

{% endif %}
**{{ q.question }}**

① {{ q.choices[0] }}
② {{ q.choices[1] }}
③ {{ q.choices[2] }}
④ {{ q.choices[3] }}

{% if q.explanation and include_answers %}
<details>
<summary>정답 및 해설</summary>

**정답:** {{ q.answer }}번

{{ q.explanation }}
</details>
{% endif %}

---

{% endfor %}

{% if include_answers %}
## 정답표

| 문제 | 정답 | 문제 | 정답 | 문제 | 정답 | 문제 | 정답 | 문제 | 정답 |
|------|------|------|------|------|------|------|------|------|------|
{% for i in range(0, question_count, 5) %}
| {{ i+1 }} | {{ questions[i].answer }} | {% if i+1 < question_count %}{{ i+2 }} | {{ questions[i+1].answer }}{% endif %} | {% if i+2 < question_count %}{{ i+3 }} | {{ questions[i+2].answer }}{% endif %} | {% if i+3 < question_count %}{{ i+4 }} | {{ questions[i+3].answer }}{% endif %} | {% if i+4 < question_count %}{{ i+5 }} | {{ questions[i+4].answer }}{% endif %} |
{% endfor %}
{% endif %}

---

*이 시험은 자동 생성되었습니다.*
"""

        template = Template(template_str)
        content = template.render(
            questions=questions,
            question_count=len(questions),
            created_date=datetime.now().strftime('%Y년 %m월 %d일'),
            include_answers=include_answers
        )

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✓ Markdown 파일 저장: {filepath}")

    def to_html(self, questions: List[TOPIKQuestion], filepath: str, include_answers: bool = False):
        """HTML 형식으로 저장

        Args:
            questions: 문제 리스트
            filepath: 저장 경로
            include_answers: 정답 포함 여부
        """

        html_template = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TOPIK II 읽기 시험</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
            line-height: 1.8;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }

        .info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 20px;
        }

        .info-item {
            background: rgba(255,255,255,0.2);
            padding: 10px;
            border-radius: 5px;
        }

        .question {
            background: white;
            margin: 20px 0;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }

        .question-number {
            font-size: 1.3em;
            font-weight: bold;
            color: #667eea;
        }

        .question-topic {
            background: #e0e7ff;
            color: #667eea;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }

        .passage {
            background: #f8f9fa;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
            line-height: 2;
            border-radius: 4px;
        }

        .question-text {
            font-size: 1.1em;
            margin: 15px 0;
            font-weight: 500;
        }

        .choices {
            margin: 20px 0;
        }

        .choice {
            padding: 12px 15px;
            margin: 10px 0;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .choice:hover {
            border-color: #667eea;
            background-color: #f8f9ff;
        }

        .choice.selected {
            border-color: #667eea;
            background-color: #e0e7ff;
        }

        .choice-label {
            display: inline-block;
            width: 30px;
            height: 30px;
            line-height: 30px;
            text-align: center;
            background: #667eea;
            color: white;
            border-radius: 50%;
            margin-right: 10px;
            font-weight: bold;
        }

        .answer-section {
            margin-top: 15px;
            padding: 15px;
            background: #e8f5e9;
            border-radius: 6px;
            border-left: 4px solid #4caf50;
        }

        .answer-label {
            font-weight: bold;
            color: #2e7d32;
        }

        .explanation {
            margin-top: 10px;
            color: #555;
        }

        .submit-btn {
            display: block;
            width: 100%;
            max-width: 300px;
            margin: 30px auto;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.2em;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }

        .result-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .result-content {
            background: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            max-width: 500px;
        }

        .score-display {
            font-size: 3em;
            font-weight: bold;
            color: #667eea;
            margin: 20px 0;
        }

        @media print {
            .submit-btn { display: none; }
            .answer-section { display: {% if include_answers %}block{% else %}none{% endif %}; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>TOPIK II 읽기 시험</h1>
        <div class="info">
            <div class="info-item">📝 문제 수: {{ question_count }}문제</div>
            <div class="info-item">⏱ 시험 시간: 70분</div>
            <div class="info-item">💯 총점: 100점</div>
            <div class="info-item">📅 생성일: {{ created_date }}</div>
        </div>
    </div>

    <form id="testForm">
    {% for q in questions %}
        <div class="question" data-question="{{ q.number }}" data-answer="{{ q.answer }}">
            <div class="question-header">
                <span class="question-number">{{ q.number }}번</span>
                {% if q.topic %}
                <span class="question-topic">{{ q.topic }}</span>
                {% endif %}
            </div>

            {% if q.passage %}
            <div class="passage">
                {{ q.passage }}
            </div>
            {% endif %}

            <div class="question-text">
                {{ q.question }}
            </div>

            <div class="choices">
                {% for choice in q.choices %}
                <div class="choice" data-choice="{{ loop.index }}" onclick="selectChoice({{ q.number }}, {{ loop.index }})">
                    <span class="choice-label">{{ loop.index }}</span>
                    <span class="choice-text">{{ choice }}</span>
                </div>
                {% endfor %}
            </div>

            {% if include_answers %}
            <div class="answer-section">
                <div class="answer-label">정답: {{ q.answer }}번</div>
                {% if q.explanation %}
                <div class="explanation">{{ q.explanation }}</div>
                {% endif %}
            </div>
            {% endif %}
        </div>
    {% endfor %}
    </form>

    <button class="submit-btn" onclick="submitTest()">채점하기</button>

    <div class="result-modal" id="resultModal">
        <div class="result-content">
            <h2>시험 결과</h2>
            <div class="score-display" id="scoreDisplay">0점</div>
            <p id="resultDetail"></p>
            <button class="submit-btn" onclick="closeResult()">닫기</button>
        </div>
    </div>

    <script>
        const userAnswers = {};

        function selectChoice(questionNum, choiceNum) {
            // 이전 선택 해제
            const question = document.querySelector(`[data-question="${questionNum}"]`);
            question.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));

            // 새 선택 표시
            const selectedChoice = question.querySelector(`[data-choice="${choiceNum}"]`);
            selectedChoice.classList.add('selected');

            // 답안 저장
            userAnswers[questionNum] = choiceNum;
        }

        function submitTest() {
            const totalQuestions = {{ question_count }};

            if (Object.keys(userAnswers).length < totalQuestions) {
                alert(`모든 문제를 풀어주세요. (${Object.keys(userAnswers).length}/${totalQuestions})`);
                return;
            }

            let correctCount = 0;

            // 채점
            document.querySelectorAll('.question').forEach(question => {
                const questionNum = parseInt(question.dataset.question);
                const correctAnswer = parseInt(question.dataset.answer);
                const userAnswer = userAnswers[questionNum];

                if (userAnswer === correctAnswer) {
                    correctCount++;
                }
            });

            const score = (correctCount / totalQuestions) * 100;

            // 결과 표시
            document.getElementById('scoreDisplay').textContent = `${score.toFixed(0)}점`;
            document.getElementById('resultDetail').textContent =
                `${totalQuestions}문제 중 ${correctCount}문제 정답 (정답률: ${(correctCount/totalQuestions*100).toFixed(1)}%)`;
            document.getElementById('resultModal').style.display = 'flex';
        }

        function closeResult() {
            document.getElementById('resultModal').style.display = 'none';
        }
    </script>
</body>
</html>"""

        template = Template(html_template)
        content = template.render(
            questions=questions,
            question_count=len(questions),
            created_date=datetime.now().strftime('%Y년 %m월 %d일'),
            include_answers=include_answers
        )

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✓ HTML 파일 저장: {filepath}")

    def to_json(self, questions: List[TOPIKQuestion], filepath: str):
        """JSON 형식으로 저장"""

        data = {
            "test_id": f"TOPIK_II_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "created_at": datetime.now().isoformat(),
            "question_count": len(questions),
            "questions": [
                {
                    "number": q.number,
                    "type": q.type,
                    "level": q.level,
                    "passage": q.passage,
                    "question": q.question,
                    "choices": q.choices,
                    "answer": q.answer,
                    "explanation": q.explanation,
                    "topic": q.topic
                }
                for q in questions
            ]
        }

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"✓ JSON 파일 저장: {filepath}")

    def to_answer_sheet(self, questions: List[TOPIKQuestion], filepath: str):
        """OMR 답안지 형식 생성"""

        content = "# TOPIK II 읽기 답안지\n\n"
        content += "## 수험자 정보\n"
        content += "- 이름: _______________\n"
        content += "- 수험번호: _______________\n"
        content += f"- 시험일: {datetime.now().strftime('%Y년 %m월 %d일')}\n\n"
        content += "---\n\n"
        content += "## 답안 표기\n"
        content += "※ 해당하는 번호를 ■로 표시하세요.\n\n"

        # 10문제씩 묶어서 표시
        for start in range(0, len(questions), 10):
            end = min(start + 10, len(questions))
            content += f"### {start+1}번 ~ {end}번\n\n"
            content += "| 문제 | ① | ② | ③ | ④ |\n"
            content += "|------|---|---|---|---|\n"

            for i in range(start, end):
                q = questions[i]
                content += f"| {q.number:02d} | ☐ | ☐ | ☐ | ☐ |\n"

            content += "\n"

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✓ 답안지 저장: {filepath}")

    def to_text(self, questions: List[TOPIKQuestion], filepath: str):
        """일반 텍스트 형식"""

        content = "=" * 60 + "\n"
        content += "TOPIK II 읽기 시험\n"
        content += "=" * 60 + "\n\n"

        for q in questions:
            content += f"[{q.number}번]"
            if q.topic:
                content += f" ({q.topic})"
            content += "\n\n"

            if q.passage:
                content += f"{q.passage}\n\n"

            content += f"{q.question}\n\n"

            for i, choice in enumerate(q.choices, 1):
                content += f"  {i}. {choice}\n"

            content += "\n" + "-" * 60 + "\n\n"

        # 정답표
        content += "\n\n정답표\n"
        content += "=" * 60 + "\n"
        for i in range(0, len(questions), 10):
            line = " | ".join(
                f"{q.number:02d}:{q.answer}"
                for q in questions[i:i+10]
            )
            content += line + "\n"

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✓ 텍스트 파일 저장: {filepath}")


# 사용 예시
if __name__ == "__main__":
    from topik_generator import TOPIKIIReadingGenerator

    # 테스트 생성
    generator = TOPIKIIReadingGenerator()
    questions = generator.generate_complete_test()

    # 포맷터 초기화
    formatter = TestFormatter()

    # 다양한 형식으로 저장
    base_name = f"topik_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    formatter.to_markdown(questions, f"generated/{base_name}.md", include_answers=True)
    formatter.to_html(questions, f"generated/{base_name}.html", include_answers=False)
    formatter.to_json(questions, f"generated/{base_name}.json")
    formatter.to_answer_sheet(questions, f"generated/{base_name}_answer_sheet.md")
    formatter.to_text(questions, f"generated/{base_name}.txt")

    print(f"\n✓ 모든 형식으로 저장 완료: {base_name}")
