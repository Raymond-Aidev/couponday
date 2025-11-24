# ai_generator.py

import json
from typing import List, Dict, Optional

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: openai package not installed. Install with: pip install openai")

class AITextGenerator:
    """GPT 기반 지문 생성"""

    def __init__(self, api_key: str):
        if not OPENAI_AVAILABLE:
            raise ImportError("openai package is required. Install with: pip install openai")

        self.client = openai.OpenAI(api_key=api_key)

    def generate_passage(self, level: int, topic: str, words: int = 200) -> str:
        """AI로 지문 생성

        Args:
            level: TOPIK 급수 (3-6)
            topic: 주제
            words: 목표 글자 수

        Returns:
            생성된 지문
        """

        level_description = {
            3: "초급 (기본 어휘, 간단한 문장 구조, 일상적 주제)",
            4: "중급 (일상적 어휘, 다소 복잡한 문장, 사회적 주제)",
            5: "고급 (전문 어휘, 추상적 표현, 복잡한 논리 전개)",
            6: "최고급 (학술적 어휘, 복잡한 문장 구조, 심층적 논의)"
        }

        prompt = f"""
다음 조건으로 한국어 읽기 지문을 작성하세요:

**조건:**
- 수준: TOPIK II {level}급 - {level_description.get(level, '중급')}
- 주제: {topic}
- 길이: 약 {words}자
- 형식: TOPIK 시험 스타일의 설명문 또는 논설문
- 요구사항:
  * 자연스러운 한국어 문체
  * 명확한 주제와 논리적 전개
  * 적절한 수준의 어휘와 문법
  * 객관적이고 정보 전달적인 톤

지문만 작성하고 다른 설명은 포함하지 마세요.
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "당신은 TOPIK(한국어능력시험) 출제 전문가입니다. 수준별 적절한 어휘와 문법을 사용하여 자연스러운 한국어 지문을 작성합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=words * 3  # 한글은 토큰이 많이 필요
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Error generating passage: {e}")
            return f"[{topic}에 대한 지문 생성 실패]"

    def generate_questions_from_passage(self, passage: str, count: int = 3, level: int = 4) -> List[Dict]:
        """지문에서 문제 생성

        Args:
            passage: 원문 지문
            count: 생성할 문제 수
            level: 난이도 (3-6)

        Returns:
            문제 리스트
        """

        prompt = f"""
다음 지문을 읽고 TOPIK {level}급 수준의 문제 {count}개를 만드세요:

**지문:**
{passage}

**요구사항:**
1. 각 문제는 다음 유형 중 하나여야 합니다:
   - 내용 일치 (지문 내용과 같은 것 고르기)
   - 중심 생각 (주제/요지 찾기)
   - 세부 내용 (구체적 정보 파악)
   - 빈칸 채우기 (문맥에 맞는 어휘)

2. 각 문제는 4개의 선택지를 가져야 합니다.
3. 정답은 명확하고, 오답은 그럴듯해야 합니다.
4. 문제는 지문을 정확히 이해했는지 평가해야 합니다.

**출력 형식 (JSON):**
{{
  "questions": [
    {{
      "type": "문제 유형",
      "question": "문제 질문",
      "choices": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 1,
      "explanation": "정답 해설"
    }}
  ]
}}

JSON만 출력하세요.
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "당신은 TOPIK 출제 전문가입니다. 지문에서 적절한 문제를 생성합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            return result.get("questions", [])

        except Exception as e:
            print(f"Error generating questions: {e}")
            return []

    def improve_question(self, question: str, choices: List[str], feedback: str) -> Dict:
        """문제 개선

        Args:
            question: 원래 문제
            choices: 선택지 리스트
            feedback: 개선 요청 사항

        Returns:
            개선된 문제
        """

        prompt = f"""
다음 TOPIK 문제를 개선하세요:

**원래 문제:**
{question}

**선택지:**
{chr(10).join([f"{i+1}. {c}" for i, c in enumerate(choices)])}

**개선 요청:**
{feedback}

**출력 형식 (JSON):**
{{
  "question": "개선된 문제",
  "choices": ["선택지1", "선택지2", "선택지3", "선택지4"],
  "improvements": "어떻게 개선했는지 설명"
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "당신은 TOPIK 문제 개선 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            return json.loads(response.choices[0].message.content)

        except Exception as e:
            print(f"Error improving question: {e}")
            return {"question": question, "choices": choices, "improvements": "개선 실패"}

    def generate_distractors(self, question: str, correct_answer: str, count: int = 3) -> List[str]:
        """오답 선택지 생성

        Args:
            question: 문제
            correct_answer: 정답
            count: 생성할 오답 수

        Returns:
            오답 리스트
        """

        prompt = f"""
다음 TOPIK 문제의 오답 선택지 {count}개를 만드세요:

**문제:** {question}
**정답:** {correct_answer}

**요구사항:**
- 오답은 그럴듯하지만 명확히 틀려야 합니다
- 정답과 유사한 형식과 길이
- 학습자가 흔히 하는 실수를 반영

**출력 형식 (JSON):**
{{
  "distractors": ["오답1", "오답2", "오답3"]
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "당신은 TOPIK 오답 제작 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            return result.get("distractors", [])

        except Exception as e:
            print(f"Error generating distractors: {e}")
            return ["오답1", "오답2", "오답3"]

    def batch_generate_passages(self, topics: List[str], level: int = 4, words: int = 200) -> Dict[str, str]:
        """여러 주제의 지문 일괄 생성

        Args:
            topics: 주제 리스트
            level: 난이도
            words: 글자 수

        Returns:
            {주제: 지문} 딕셔너리
        """

        results = {}
        for topic in topics:
            print(f"Generating passage for topic: {topic}")
            passage = self.generate_passage(level, topic, words)
            results[topic] = passage

        return results


# 사용 예시
if __name__ == "__main__":
    import os

    # API 키는 환경변수에서 가져오기
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("OPENAI_API_KEY 환경변수를 설정하세요.")
        print("예: export OPENAI_API_KEY='your-api-key'")
    else:
        generator = AITextGenerator(api_key)

        # 지문 생성 테스트
        print("=== 지문 생성 테스트 ===")
        passage = generator.generate_passage(level=4, topic="환경 보호", words=200)
        print(passage)
        print()

        # 문제 생성 테스트
        print("=== 문제 생성 테스트 ===")
        questions = generator.generate_questions_from_passage(passage, count=2)
        for i, q in enumerate(questions, 1):
            print(f"\n문제 {i}:")
            print(f"유형: {q.get('type')}")
            print(f"질문: {q.get('question')}")
            for j, choice in enumerate(q.get('choices', []), 1):
                print(f"  {j}. {choice}")
            print(f"정답: {q.get('answer')}번")
