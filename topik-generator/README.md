# TOPIK II 읽기 시험 자동 생성기

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

TOPIK II 읽기 시험을 자동으로 생성하는 완전한 시스템입니다. 문제 생성, 품질 검증, 데이터베이스 관리, 웹 인터페이스를 포함합니다.

## 주요 기능

- 📝 **자동 문제 생성**: 50문제 완전 세트 자동 생성
- 🤖 **AI 지원**: OpenAI GPT를 활용한 지문 및 문제 생성 (선택사항)
- ✅ **품질 관리**: 자동 품질 검증 및 정답 분포 균형 조정
- 💾 **데이터베이스**: SQLite 기반 문제 및 성적 관리
- 📊 **다양한 출력 형식**: JSON, HTML, Markdown, PDF, 텍스트
- 🌐 **웹 인터페이스**: Flask 기반 웹 애플리케이션
- ⚡ **배치 처리**: 병렬 처리로 대량 생성 지원
- 🐳 **Docker 지원**: 컨테이너 기반 배포

## 프로젝트 구조

```
topik-generator/
├── topik_generator.py      # 핵심 문제 생성 엔진
├── ai_generator.py          # AI 기반 생성 (OpenAI)
├── database.py              # 데이터베이스 관리
├── quality_control.py       # 품질 검증 시스템
├── formatter.py             # 출력 포맷터
├── web_app.py              # Flask 웹 서버
├── batch_generator.py       # 배치 생성 스크립트
├── requirements.txt         # Python 패키지 의존성
├── Dockerfile              # Docker 이미지 정의
├── docker-compose.yml       # Docker Compose 설정
└── README.md               # 이 파일
```

## 빠른 시작

### 1. 설치

```bash
# 저장소 클론 (또는 디렉토리로 이동)
cd topik-generator

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt
```

### 2. 기본 사용

#### 단일 시험 생성

```python
from topik_generator import TOPIKIIReadingGenerator

# 생성기 초기화
generator = TOPIKIIReadingGenerator()

# 50문제 생성
questions = generator.generate_complete_test()

# 파일 저장
generator.save_to_file(questions, "my_test.json")
```

#### 커맨드라인으로 배치 생성

```bash
# 10세트 생성
python batch_generator.py --count 10

# 병렬 처리로 50세트 생성
python batch_generator.py --count 50 --parallel

# 검증 없이 빠른 생성
python batch_generator.py --count 20 --no-validate

# 기존 테스트 검증만 수행
python batch_generator.py --validate-only --output ./generated
```

#### 웹 인터페이스 실행

```bash
python web_app.py
```

브라우저에서 http://localhost:5000 접속

### 3. Docker 사용

```bash
# Docker 이미지 빌드
docker build -t topik-generator .

# 웹 서버 실행
docker-compose up web

# 배치 생성 실행
docker-compose run batch

# 생성된 파일은 ./generated 디렉토리에 저장됨
```

## 사용 가이드

### 문제 생성

#### 기본 생성

```python
from topik_generator import TOPIKIIReadingGenerator

generator = TOPIKIIReadingGenerator()
questions = generator.generate_complete_test()

print(f"{len(questions)}개 문제 생성 완료")
```

#### AI 기반 생성 (OpenAI API 필요)

```python
from topik_generator import TOPIKIIReadingGenerator
import os

# OpenAI API 키 설정
api_key = os.getenv("OPENAI_API_KEY")

generator = TOPIKIIReadingGenerator(use_ai=True, api_key=api_key)
questions = generator.generate_complete_test()
```

### 품질 검증

```python
from quality_control import QualityValidator

validator = QualityValidator()

# 전체 테스트 검증
report = validator.validate_complete_test(questions)

print(f"검증 결과: {report['is_valid']}")
print(f"오류: {len(report['errors'])}개")
print(f"경고: {len(report['warnings'])}개")

# 정답 분포 자동 조정
if not report['is_valid']:
    balanced_questions = validator.auto_balance_answers(questions)
```

### 데이터베이스 관리

```python
from database import TOPIKDatabase

db = TOPIKDatabase("database/topik.db")

# 테스트 저장
db.save_test("TEST_001", questions, metadata={"difficulty": "medium"})

# 테스트 불러오기
loaded_questions = db.get_test("TEST_001")

# 성적 저장
user_answers = [1, 2, 3, 4, ...]  # 사용자 답안
db.save_result("TEST_001", "user123", user_answers, score=85)

# 통계 조회
stats = db.get_test_statistics("TEST_001")
print(f"평균 점수: {stats['overall']['avg_score']}")

db.close()
```

### 다양한 형식으로 출력

```python
from formatter import TestFormatter

formatter = TestFormatter()

# Markdown 저장
formatter.to_markdown(questions, "test.md", include_answers=True)

# HTML 저장 (인터랙티브 시험지)
formatter.to_html(questions, "test.html", include_answers=False)

# JSON 저장
formatter.to_json(questions, "test.json")

# 답안지 생성
formatter.to_answer_sheet(questions, "answer_sheet.md")

# 일반 텍스트
formatter.to_text(questions, "test.txt")
```

## API 문서

### 웹 API 엔드포인트

#### `POST /api/generate`

새 시험 생성

```json
Request:
{
  "difficulty": "medium"  // easy, medium, hard
}

Response:
{
  "success": true,
  "test_id": "TEST_20240115_143022",
  "question_count": 50
}
```

#### `POST /api/generate-validated`

검증된 시험 생성

```json
Response:
{
  "success": true,
  "test_id": "TEST_20240115_143022",
  "question_count": 50,
  "validation_report": {
    "is_valid": true,
    "errors": [],
    "warnings": []
  }
}
```

#### `GET /api/tests`

테스트 목록 조회

```json
Response:
{
  "tests": [
    {
      "test_id": "TEST_20240115_143022",
      "title": "TOPIK II 읽기 - TEST_20240115_143022",
      "question_count": 50,
      "created_at": "2024-01-15T14:30:22"
    }
  ]
}
```

#### `GET /api/validate/{test_id}`

테스트 검증

```json
Response:
{
  "test_id": "TEST_20240115_143022",
  "report": {
    "is_valid": true,
    "errors": [],
    "warnings": [],
    "statistics": {...}
  }
}
```

#### `GET /api/download/{test_id}?format=html`

테스트 다운로드

Query Parameters:
- `format`: json, html, markdown

## 설정

### 환경 변수

```bash
# .env 파일 생성
OPENAI_API_KEY=your-api-key-here  # AI 기능 사용 시 필요
FLASK_ENV=development              # development 또는 production
```

### 문제 구성 커스터마이징

`topik_generator.py`의 `question_structure` 수정:

```python
self.question_structure = {
    "1-2": ("grammar_blank", 2),
    "3-4": ("synonym", 2),
    # ... 원하는 구성으로 수정
}
```

### 난이도 조정

`grammar_points`, `topics` 등의 데이터 수정으로 난이도 조정 가능

## 테스트

### 단위 테스트

```bash
# 개별 모듈 테스트
python topik_generator.py
python quality_control.py
python formatter.py
```

### 통합 테스트

```bash
# 전체 워크플로우 테스트
python batch_generator.py --count 1 --output ./test_output
```

## 문제 해결

### 일반적인 문제

**Q: 문제 생성이 너무 느립니다**
- 병렬 처리 사용: `--parallel` 옵션
- 검증 건너뛰기: `--no-validate` 옵션

**Q: 정답 분포가 불균형합니다**
- `auto_balance_answers()` 함수 사용
- 또는 `--validate` 옵션으로 자동 조정

**Q: AI 기능이 작동하지 않습니다**
- `OPENAI_API_KEY` 환경변수 확인
- `openai` 패키지 설치 확인: `pip install openai`

**Q: 데이터베이스 오류**
- `database` 디렉토리 존재 확인
- 쓰기 권한 확인

## 성능

- **단일 시험 생성**: ~1-2초
- **병렬 50세트 생성**: ~30-60초
- **메모리 사용**: ~50-100MB
- **디스크 공간**: 시험당 ~100KB

## 라이선스

MIT License

## 기여

풀 리퀘스트를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 주의사항

- 이 프로그램은 학습 및 연습용입니다
- 실제 TOPIK 시험 문제를 무단 사용하지 마세요
- 생성된 문제는 반드시 전문가의 검수를 거쳐야 합니다
- 상업적 사용 전에 저작권을 확인하세요

## 연락처

문제가 있거나 제안이 있으시면 Issue를 열어주세요.

## 감사의 말

이 프로젝트는 TOPIK(한국어능력시험) 학습자들을 위해 만들어졌습니다.

---

Made with ❤️ for Korean learners worldwide
