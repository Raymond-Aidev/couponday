# topik_generator.py

import json
import random
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

@dataclass
class TOPIKQuestion:
    """TOPIK 문제 데이터 구조"""
    number: int
    type: str  # grammar, synonym, reading, etc.
    level: int  # 3-6급
    passage: Optional[str]
    question: str
    choices: List[str]
    answer: int
    explanation: Optional[str] = None
    topic: Optional[str] = None

class TOPIKIIReadingGenerator:
    """TOPIK II 읽기 완전 자동 생성기"""

    def __init__(self, use_ai=False, api_key=None):
        self.use_ai = use_ai
        if use_ai and api_key:
            try:
                import openai
                openai.api_key = api_key
            except ImportError:
                print("Warning: openai package not installed. AI features disabled.")
                self.use_ai = False

        # 문제 구성 (50문제)
        self.question_structure = {
            "1-2": ("grammar_blank", 2),
            "3-4": ("synonym", 2),
            "5-8": ("text_type", 4),
            "9-12": ("content_match", 4),
            "13-15": ("sequence", 3),
            "16-18": ("context_blank", 3),
            "19-20": ("short_passage", 2),
            "21-22": ("short_passage", 2),
            "23-24": ("short_passage", 2),
            "25-27": ("news_title", 3),
            "28-31": ("long_blank", 4),
            "32-34": ("content_match_long", 3),
            "35-38": ("main_idea", 4),
            "39-41": ("sentence_insert", 3),
            "42-43": ("emotion_passage", 2),
            "44-45": ("blank_and_topic", 2),
            "46-47": ("attitude_content", 2),
            "48-50": ("purpose_blank_content", 3)
        }

        self.load_resources()

    def load_resources(self):
        """리소스 로드"""
        # 문법 포인트
        self.grammar_points = {
            3: [
                {"pattern": "으려고", "meaning": "의도/목적", "example": "친구를 만나려고"},
                {"pattern": "아서/어서", "meaning": "이유/원인", "example": "피곤해서"},
                {"pattern": "는데", "meaning": "배경/대조", "example": "비가 오는데"},
                {"pattern": "지만", "meaning": "역접", "example": "작지만"}
            ],
            4: [
                {"pattern": "는 바람에", "meaning": "의도하지 않은 결과", "example": "늦잠을 자는 바람에"},
                {"pattern": "을 텐데", "meaning": "추측/걱정", "example": "힘들 텐데"},
                {"pattern": "곤 하다", "meaning": "습관", "example": "산책하곤 하다"},
                {"pattern": "아/어 놓다", "meaning": "미리 준비", "example": "예약해 놓다"}
            ],
            5: [
                {"pattern": "을 수밖에 없다", "meaning": "불가피함", "example": "포기할 수밖에 없다"},
                {"pattern": "는 척하다", "meaning": "가장", "example": "모르는 척하다"},
                {"pattern": "기는커녕", "meaning": "강한 부정", "example": "돕기는커녕"},
                {"pattern": "을 뿐만 아니라", "meaning": "추가", "example": "맛있을 뿐만 아니라"}
            ],
            6: [
                {"pattern": "으므로", "meaning": "이유(격식)", "example": "중요하므로"},
                {"pattern": "더러", "meaning": "가끔", "example": "실수하더러"},
                {"pattern": "을지언정", "meaning": "양보", "example": "어렵더라도"},
                {"pattern": "거니와", "meaning": "추가 강조", "example": "건강은 물론이거니와"}
            ]
        }

        # 주제 풀
        self.topics = {
            "일상": ["쇼핑", "교통", "날씨", "음식", "주거"],
            "사회": ["고령화", "1인가구", "교육", "환경", "취업"],
            "문화": ["K-pop", "전통", "축제", "영화", "관광"],
            "경제": ["소비", "창업", "투자", "공유경제", "온라인쇼핑"],
            "기술": ["AI", "스마트폰", "메타버스", "전기차", "로봇"],
            "건강": ["운동", "다이어트", "정신건강", "수면", "영양"]
        }

        # 지문 템플릿
        self.passage_templates = {
            "short": [
                "최근 {topic}에 대한 관심이 높아지고 있다. {reason} 때문이다. 전문가들은 {advice}라고 조언한다.",
                "{topic}는 현대인의 필수 요소가 되었다. {benefit}는 장점이 있지만, {drawback}는 단점도 있다.",
                "요즘 {topic} 열풍이 불고 있다. {statistics} 이러한 추세는 {prediction} 것으로 전망된다."
            ],
            "medium": [
                "한국에서 {topic}가 사회적 이슈로 떠오르고 있다. 통계청 자료에 따르면 {statistics}. 이는 {reason1}과 {reason2} 때문으로 분석된다. 전문가들은 이러한 현상이 {prediction} 것으로 예측하고 있다.",
                "{topic}에 대한 논쟁이 계속되고 있다. 찬성하는 측은 {pros}라고 주장한다. 반면 반대하는 측은 {cons}라고 반박한다. 이에 대해 정부는 {policy}를 검토 중이다."
            ],
            "long": [
                "현대 사회에서 {topic}는 중요한 화두가 되었다. {intro} 최근 연구에 따르면 {statistics}. 이러한 변화는 {reason1}, {reason2}, 그리고 {reason3} 등 복합적인 요인에서 비롯되었다. {analysis} 전문가들은 {expert_opinion}라고 분석한다. 앞으로 {prediction1}하고, {prediction2} 것으로 전망된다. 따라서 우리는 {conclusion}해야 할 것이다."
            ]
        }

        # 유의어 쌍
        self.synonym_pairs = [
            {"target": "바람에", "correct": "탓에", "distractors": ["김에", "대신에", "반면에"]},
            {"target": "수밖에 없다", "correct": "해야만 한다", "distractors": ["할 줄 모른다", "하기만 한다", "하기가 어렵다"]},
            {"target": "는 척하다", "correct": "인 듯 행동하다", "distractors": ["를 시작하다", "를 그만두다", "를 계속하다"]},
            {"target": "기는커녕", "correct": "는 고사하고", "distractors": ["뿐만 아니라", "는 물론", "와 함께"]},
            {"target": "더러", "correct": "가끔", "distractors": ["항상", "전혀", "반드시"]},
            {"target": "거니와", "correct": "는 물론", "distractors": ["에도 불구하고", "대신에", "만큼"]}
        ]

    def generate_complete_test(self) -> List[TOPIKQuestion]:
        """50문제 완전 세트 생성"""
        questions = []
        question_num = 1

        for range_str, (q_type, count) in self.question_structure.items():
            for _ in range(count):
                question = self.generate_question(question_num, q_type)
                questions.append(question)
                question_num += 1

        return questions

    def generate_question(self, num: int, q_type: str) -> TOPIKQuestion:
        """문제 유형별 생성"""
        generators = {
            "grammar_blank": self._gen_grammar,
            "synonym": self._gen_synonym,
            "text_type": self._gen_text_type,
            "content_match": self._gen_content_match,
            "sequence": self._gen_sequence,
            "context_blank": self._gen_context_blank,
            "short_passage": self._gen_short_passage,
            "news_title": self._gen_news_title,
            "long_blank": self._gen_long_blank,
            "content_match_long": self._gen_content_match_long,
            "main_idea": self._gen_main_idea,
            "sentence_insert": self._gen_sentence_insert,
            "emotion_passage": self._gen_emotion_passage,
            "blank_and_topic": self._gen_blank_topic,
            "attitude_content": self._gen_attitude,
            "purpose_blank_content": self._gen_purpose
        }

        return generators[q_type](num)

    def _gen_grammar(self, num: int) -> TOPIKQuestion:
        """문법 빈칸 문제 생성"""
        level = 3 if num <= 1 else 4
        grammar_item = random.choice(self.grammar_points[level])

        # 문장 템플릿
        templates = [
            ("친구를 만나(    ) 약속 장소에 갔다.", ["려고", "면서", "자마자", "더니"]),
            ("비가 많이 와(    ) 우산을 가져왔다.", ["서", "도", "니까", "ㄹ까"]),
            ("숙제를 다 하(    ) 놀러 갔다.", ["고 나서", "려고", "기 전에", "더라도"]),
            ("늦잠을 자(    ) 지각했다.", ["는 바람에", "려고", "기 위해", "더니"])
        ]

        sentence_template, correct_options = random.choice(templates)
        correct_answer = correct_options[0]

        # 선택지 섞기
        choices = correct_options.copy()
        random.shuffle(choices)
        answer = choices.index(correct_answer) + 1

        return TOPIKQuestion(
            number=num,
            type="grammar_blank",
            level=level,
            passage=None,
            question=sentence_template,
            choices=choices,
            answer=answer,
            topic="문법",
            explanation=f"'{grammar_item['pattern']}'은(는) {grammar_item['meaning']}을(를) 나타냅니다."
        )

    def _gen_synonym(self, num: int) -> TOPIKQuestion:
        """유의어 문제 생성"""
        pair = random.choice(self.synonym_pairs)

        sentences = [
            f"시험에 떨어지는 **{pair['target']}** 재수해야 한다.",
            f"약속을 잊어버리는 **{pair['target']}** 친구에게 미안했다.",
            f"교통이 막히는 **{pair['target']}** 회의에 늦었다."
        ]

        sentence = random.choice(sentences)

        choices = [pair['correct']] + pair['distractors']
        random.shuffle(choices)
        answer = choices.index(pair['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="synonym",
            level=4,
            passage=None,
            question=sentence,
            choices=choices,
            answer=answer,
            topic="어휘",
            explanation=f"'{pair['target']}'와 같은 의미는 '{pair['correct']}'입니다."
        )

    def _gen_text_type(self, num: int) -> TOPIKQuestion:
        """글의 종류 파악 문제"""
        text_types = [
            {"passage": "신제품 출시! 지금 구매하시면 30% 할인! 선착순 100명 한정",
             "answer": "광고", "distractors": ["설명문", "논설문", "안내문"]},
            {"passage": "회의 일정: 2024년 1월 15일 오후 2시, 3층 회의실. 참석자는 사전에 자료를 준비해주시기 바랍니다.",
             "answer": "안내문", "distractors": ["광고", "소설", "논설문"]},
            {"passage": "환경 보호는 우리 모두의 책임입니다. 일회용품 사용을 줄이고 재활용을 생활화해야 합니다.",
             "answer": "논설문", "distractors": ["광고", "일기", "설명문"]}
        ]

        item = random.choice(text_types)
        choices = [item['answer']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['answer']) + 1

        return TOPIKQuestion(
            number=num,
            type="text_type",
            level=3,
            passage=item['passage'],
            question="이 글은 무엇입니까?",
            choices=choices,
            answer=answer,
            topic="글의 종류"
        )

    def _gen_content_match(self, num: int) -> TOPIKQuestion:
        """내용 일치 문제"""
        topics = [
            {
                "passage": "한국의 전통 차 중 하나인 유자차는 겨울철에 특히 인기가 많다. 비타민 C가 풍부하여 감기 예방에 좋고, 따뜻하게 마시면 몸을 녹이는 데 도움이 된다.",
                "correct": "유자차는 겨울에 마시기 좋은 차이다.",
                "distractors": ["유자차는 여름에만 마신다.", "유자차에는 비타민이 없다.", "유자차는 차갑게 마신다."]
            },
            {
                "passage": "서울의 지하철은 매우 편리한 교통수단이다. 9개 노선이 도시 전역을 연결하며, 요금도 저렴하고 배차 간격도 짧아 많은 시민들이 이용한다.",
                "correct": "서울 지하철은 이용하기 편리하다.",
                "distractors": ["서울에는 지하철이 없다.", "지하철 요금이 비싸다.", "지하철은 자주 오지 않는다."]
            }
        ]

        item = random.choice(topics)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="content_match",
            level=3,
            passage=item['passage'],
            question="이 글의 내용과 같은 것을 고르십시오.",
            choices=choices,
            answer=answer,
            topic="내용 이해"
        )

    def _gen_sequence(self, num: int) -> TOPIKQuestion:
        """문장 순서 배열 문제"""
        sequences = [
            {
                "sentences": ["(가) 그래서 요리 강습을 등록했다.", "(나) 요즘 요리에 관심이 생겼다.",
                             "(다) 강습을 받은 후 요리 실력이 많이 늘었다.", "(라) 전에는 라면밖에 못 끓였다."],
                "correct": "(나)-(라)-(가)-(다)",
                "distractors": ["(가)-(나)-(다)-(라)", "(라)-(나)-(가)-(다)", "(나)-(가)-(라)-(다)"]
            }
        ]

        item = random.choice(sequences)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        passage = "\n".join(item['sentences'])

        return TOPIKQuestion(
            number=num,
            type="sequence",
            level=4,
            passage=passage,
            question="다음 문장을 순서대로 배열한 것을 고르십시오.",
            choices=choices,
            answer=answer,
            topic="순서 배열"
        )

    def _gen_context_blank(self, num: int) -> TOPIKQuestion:
        """문맥에 맞는 어휘 선택"""
        items = [
            {
                "passage": "새로운 기술의 (    )으로 우리의 생활은 점점 더 편리해지고 있다.",
                "correct": "발전",
                "distractors": ["발명", "발견", "발표"]
            },
            {
                "passage": "이번 프로젝트의 성공은 팀원들의 (    ) 덕분이었다.",
                "correct": "협력",
                "distractors": ["경쟁", "대립", "갈등"]
            }
        ]

        item = random.choice(items)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="context_blank",
            level=4,
            passage=None,
            question=item['passage'],
            choices=choices,
            answer=answer,
            topic="어휘"
        )

    def _gen_short_passage(self, num: int) -> TOPIKQuestion:
        """짧은 지문 이해 문제"""
        passages = [
            {
                "text": "한국의 전통 음식 김치는 세계적으로 유명하다. 발효 식품으로 건강에 좋으며, 다양한 요리에 활용된다. 최근에는 김치의 효능이 과학적으로 입증되면서 해외에서도 인기가 높아지고 있다.",
                "question": "이 글의 중심 내용은 무엇입니까?",
                "correct": "김치는 건강에 좋고 세계적으로 인기가 있다.",
                "distractors": ["김치는 한국에서만 먹는다.", "김치는 최근에 개발되었다.", "김치는 요리에 사용할 수 없다."]
            }
        ]

        item = random.choice(passages)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="short_passage",
            level=4,
            passage=item['text'],
            question=item['question'],
            choices=choices,
            answer=answer,
            topic="독해"
        )

    def _gen_news_title(self, num: int) -> TOPIKQuestion:
        """뉴스 제목 선택 문제"""
        news_items = [
            {
                "passage": "정부가 청년 취업 지원을 위해 새로운 정책을 발표했다. 중소기업 취업자에게는 최대 500만 원의 취업 장려금을 지급하고, 직업 교육 프로그램도 확대할 예정이다.",
                "correct": "정부, 청년 취업 지원 정책 발표",
                "distractors": ["중소기업 채용 급감", "청년 실업률 증가", "직업 교육 프로그램 축소"]
            }
        ]

        item = random.choice(news_items)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="news_title",
            level=4,
            passage=item['passage'],
            question="이 글의 제목으로 가장 알맞은 것을 고르십시오.",
            choices=choices,
            answer=answer,
            topic="제목 찾기"
        )

    def _gen_long_blank(self, num: int) -> TOPIKQuestion:
        """긴 지문의 빈칸 채우기"""
        items = [
            {
                "passage": "최근 1인 가구가 급증하면서 소형 가전제품 시장이 (    ). 혼자 사는 사람들을 위한 작은 냉장고, 세탁기, 밥솥 등의 수요가 늘어나고 있다.",
                "correct": "성장하고 있다",
                "distractors": ["축소되고 있다", "사라지고 있다", "정체되고 있다"]
            }
        ]

        item = random.choice(items)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="long_blank",
            level=5,
            passage=None,
            question=item['passage'],
            choices=choices,
            answer=answer,
            topic="빈칸 채우기"
        )

    def _gen_content_match_long(self, num: int) -> TOPIKQuestion:
        """긴 지문 내용 일치"""
        return self._gen_content_match(num)  # 유사한 구조 재사용

    def _gen_main_idea(self, num: int) -> TOPIKQuestion:
        """주제 찾기 문제"""
        passages = [
            {
                "text": "환경 오염은 심각한 문제다. 공기 오염, 수질 오염, 토양 오염 등 다양한 형태로 나타나며, 이는 인간의 건강뿐만 아니라 생태계 전체에 악영향을 미친다. 따라서 환경 보호를 위한 개인과 사회의 노력이 필요하다.",
                "correct": "환경 오염의 심각성과 보호의 필요성",
                "distractors": ["환경 오염의 종류", "공기 오염의 원인", "수질 오염 해결 방법"]
            }
        ]

        item = random.choice(passages)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="main_idea",
            level=5,
            passage=item['text'],
            question="이 글의 주제로 가장 알맞은 것을 고르십시오.",
            choices=choices,
            answer=answer,
            topic="주제 찾기"
        )

    def _gen_sentence_insert(self, num: int) -> TOPIKQuestion:
        """문장 삽입 위치 찾기"""
        items = [
            {
                "passage": "( ① ) 한국의 전통 문화가 세계적으로 주목받고 있다. ( ② ) K-pop, 드라마 등 한류가 확산되면서 한국어를 배우려는 외국인도 늘어나고 있다. ( ③ ) 정부도 한국 문화 홍보에 적극 나서고 있다. ( ④ )",
                "sentence": "이러한 관심은 경제 발전에도 기여하고 있다.",
                "correct": "③",
                "distractors": ["①", "②", "④"]
            }
        ]

        item = random.choice(items)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="sentence_insert",
            level=5,
            passage=item['passage'],
            question=f"다음 문장이 들어가기에 가장 알맞은 곳을 고르십시오.\n'{item['sentence']}'",
            choices=choices,
            answer=answer,
            topic="문장 삽입"
        )

    def _gen_emotion_passage(self, num: int) -> TOPIKQuestion:
        """필자의 태도/감정 파악"""
        passages = [
            {
                "text": "이번 정책은 매우 실망스럽다. 국민의 의견을 충분히 반영하지 않았고, 실효성도 의심스럽다. 정부는 더 신중하게 정책을 수립해야 한다.",
                "question": "필자의 태도로 가장 알맞은 것은?",
                "correct": "비판적이다",
                "distractors": ["긍정적이다", "중립적이다", "무관심하다"]
            }
        ]

        item = random.choice(passages)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="emotion_passage",
            level=5,
            passage=item['text'],
            question=item['question'],
            choices=choices,
            answer=answer,
            topic="태도 파악"
        )

    def _gen_blank_topic(self, num: int) -> TOPIKQuestion:
        """빈칸과 주제 복합 문제"""
        return self._gen_long_blank(num)  # 유사한 구조

    def _gen_attitude(self, num: int) -> TOPIKQuestion:
        """태도 파악 문제"""
        return self._gen_emotion_passage(num)  # 유사한 구조

    def _gen_purpose(self, num: int) -> TOPIKQuestion:
        """글의 목적 파악"""
        passages = [
            {
                "text": "저희 회사에서는 신입 사원을 모집합니다. 지원 자격은 대졸 이상이며, 외국어 능력 우대합니다. 관심 있으신 분은 이력서를 제출해 주시기 바랍니다.",
                "correct": "직원을 채용하기 위해",
                "distractors": ["상품을 판매하기 위해", "행사를 안내하기 위해", "의견을 수렴하기 위해"]
            }
        ]

        item = random.choice(passages)
        choices = [item['correct']] + item['distractors']
        random.shuffle(choices)
        answer = choices.index(item['correct']) + 1

        return TOPIKQuestion(
            number=num,
            type="purpose_blank_content",
            level=6,
            passage=item['text'],
            question="이 글을 쓴 목적은 무엇입니까?",
            choices=choices,
            answer=answer,
            topic="목적 파악"
        )

    def save_to_file(self, questions: List[TOPIKQuestion], filepath: str):
        """파일로 저장"""
        with open(filepath, 'w', encoding='utf-8') as f:
            test_data = {
                "test_id": f"TOPIK_II_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "created_at": datetime.now().isoformat(),
                "question_count": len(questions),
                "questions": [asdict(q) for q in questions]
            }
            json.dump(test_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # 테스트 실행
    generator = TOPIKIIReadingGenerator()
    questions = generator.generate_complete_test()
    print(f"✓ {len(questions)}개 문제 생성 완료")
    generator.save_to_file(questions, "test_output.json")
    print("✓ test_output.json 파일로 저장 완료")
