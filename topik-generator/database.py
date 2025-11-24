# database.py

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from topik_generator import TOPIKQuestion

class TOPIKDatabase:
    """문제 데이터베이스 관리"""

    def __init__(self, db_path: str = "database/topik.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row  # 딕셔너리 형태로 결과 반환
        self.create_tables()

    def create_tables(self):
        """테이블 생성"""

        # 문제 테이블
        self.conn.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id TEXT NOT NULL,
            number INTEGER NOT NULL,
            type TEXT NOT NULL,
            level INTEGER NOT NULL,
            passage TEXT,
            question TEXT NOT NULL,
            choices TEXT NOT NULL,
            answer INTEGER NOT NULL,
            explanation TEXT,
            topic TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_id) REFERENCES tests(test_id)
        )
        ''')

        # 테스트 테이블
        self.conn.execute('''
        CREATE TABLE IF NOT EXISTS tests (
            test_id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            difficulty_level TEXT,
            question_count INTEGER DEFAULT 50,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        )
        ''')

        # 성적 테이블
        self.conn.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id TEXT NOT NULL,
            user_id TEXT,
            user_name TEXT,
            score INTEGER NOT NULL,
            total_questions INTEGER DEFAULT 50,
            correct_count INTEGER,
            wrong_count INTEGER,
            answers TEXT NOT NULL,
            time_spent INTEGER,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_id) REFERENCES tests(test_id)
        )
        ''')

        # 통계 테이블
        self.conn.execute('''
        CREATE TABLE IF NOT EXISTS question_stats (
            question_id INTEGER PRIMARY KEY,
            test_id TEXT,
            question_number INTEGER,
            attempt_count INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            wrong_count INTEGER DEFAULT 0,
            difficulty_score REAL,
            FOREIGN KEY (test_id) REFERENCES tests(test_id)
        )
        ''')

        # 인덱스 생성
        self.conn.execute('CREATE INDEX IF NOT EXISTS idx_test_id ON questions(test_id)')
        self.conn.execute('CREATE INDEX IF NOT EXISTS idx_question_type ON questions(type)')
        self.conn.execute('CREATE INDEX IF NOT EXISTS idx_results_test ON results(test_id)')
        self.conn.execute('CREATE INDEX IF NOT EXISTS idx_results_user ON results(user_id)')

        self.conn.commit()

    def save_test(self, test_id: str, questions: List[TOPIKQuestion], metadata: Optional[Dict] = None):
        """테스트 저장

        Args:
            test_id: 테스트 ID
            questions: 문제 리스트
            metadata: 추가 메타데이터
        """

        # 테스트 정보 저장
        self.conn.execute(
            '''INSERT OR REPLACE INTO tests
               (test_id, title, question_count, metadata)
               VALUES (?, ?, ?, ?)''',
            (test_id, f"TOPIK II 읽기 - {test_id}", len(questions),
             json.dumps(metadata or {}, ensure_ascii=False))
        )

        # 문제들 저장
        for q in questions:
            self.conn.execute('''
                INSERT INTO questions
                (test_id, number, type, level, passage, question,
                 choices, answer, explanation, topic)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                test_id, q.number, q.type, q.level, q.passage,
                q.question, json.dumps(q.choices, ensure_ascii=False),
                q.answer, q.explanation, q.topic
            ))

        self.conn.commit()
        print(f"✓ Test {test_id} saved with {len(questions)} questions")

    def get_test(self, test_id: str) -> List[TOPIKQuestion]:
        """테스트 불러오기

        Args:
            test_id: 테스트 ID

        Returns:
            문제 리스트
        """

        cursor = self.conn.execute(
            "SELECT * FROM questions WHERE test_id = ? ORDER BY number",
            (test_id,)
        )

        questions = []
        for row in cursor:
            questions.append(TOPIKQuestion(
                number=row['number'],
                type=row['type'],
                level=row['level'],
                passage=row['passage'],
                question=row['question'],
                choices=json.loads(row['choices']),
                answer=row['answer'],
                explanation=row['explanation'],
                topic=row['topic']
            ))

        return questions

    def list_tests(self, limit: int = 20) -> List[Dict]:
        """테스트 목록 조회

        Args:
            limit: 조회 개수 제한

        Returns:
            테스트 정보 리스트
        """

        cursor = self.conn.execute(
            '''SELECT test_id, title, question_count, created_at
               FROM tests
               ORDER BY created_at DESC
               LIMIT ?''',
            (limit,)
        )

        return [dict(row) for row in cursor]

    def save_result(self, test_id: str, user_id: str, answers: List[int],
                    score: int, time_spent: Optional[int] = None,
                    user_name: Optional[str] = None):
        """성적 저장

        Args:
            test_id: 테스트 ID
            user_id: 사용자 ID
            answers: 사용자 답안 리스트
            score: 점수
            time_spent: 소요 시간 (초)
            user_name: 사용자 이름
        """

        # 정답 개수 계산
        questions = self.get_test(test_id)
        correct_count = sum(1 for i, q in enumerate(questions) if answers[i] == q.answer)
        wrong_count = len(questions) - correct_count

        self.conn.execute('''
            INSERT INTO results
            (test_id, user_id, user_name, score, total_questions,
             correct_count, wrong_count, answers, time_spent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            test_id, user_id, user_name, score, len(questions),
            correct_count, wrong_count,
            json.dumps(answers), time_spent
        ))

        self.conn.commit()

        # 통계 업데이트
        self._update_question_stats(test_id, questions, answers)

    def _update_question_stats(self, test_id: str, questions: List[TOPIKQuestion], answers: List[int]):
        """문제별 통계 업데이트"""

        for i, q in enumerate(questions):
            is_correct = 1 if answers[i] == q.answer else 0

            # 기존 통계 확인
            cursor = self.conn.execute(
                '''SELECT * FROM question_stats
                   WHERE test_id = ? AND question_number = ?''',
                (test_id, q.number)
            )

            existing = cursor.fetchone()

            if existing:
                # 업데이트
                self.conn.execute('''
                    UPDATE question_stats
                    SET attempt_count = attempt_count + 1,
                        correct_count = correct_count + ?,
                        wrong_count = wrong_count + ?,
                        difficulty_score = CAST(correct_count + ? AS REAL) / (attempt_count + 1)
                    WHERE test_id = ? AND question_number = ?
                ''', (is_correct, 1 - is_correct, is_correct, test_id, q.number))
            else:
                # 새로 추가
                self.conn.execute('''
                    INSERT INTO question_stats
                    (test_id, question_number, attempt_count, correct_count,
                     wrong_count, difficulty_score)
                    VALUES (?, ?, 1, ?, ?, ?)
                ''', (test_id, q.number, is_correct, 1 - is_correct, float(is_correct)))

        self.conn.commit()

    def get_user_results(self, user_id: str, limit: int = 10) -> List[Dict]:
        """사용자 성적 조회

        Args:
            user_id: 사용자 ID
            limit: 조회 개수

        Returns:
            성적 리스트
        """

        cursor = self.conn.execute('''
            SELECT r.*, t.title
            FROM results r
            JOIN tests t ON r.test_id = t.test_id
            WHERE r.user_id = ?
            ORDER BY r.completed_at DESC
            LIMIT ?
        ''', (user_id, limit))

        return [dict(row) for row in cursor]

    def get_test_statistics(self, test_id: str) -> Dict:
        """테스트 통계 조회

        Args:
            test_id: 테스트 ID

        Returns:
            통계 정보
        """

        # 전체 응시 통계
        cursor = self.conn.execute('''
            SELECT
                COUNT(*) as total_attempts,
                AVG(score) as avg_score,
                MAX(score) as max_score,
                MIN(score) as min_score,
                AVG(time_spent) as avg_time
            FROM results
            WHERE test_id = ?
        ''', (test_id,))

        overall_stats = dict(cursor.fetchone())

        # 문제별 난이도
        cursor = self.conn.execute('''
            SELECT
                question_number,
                attempt_count,
                correct_count,
                wrong_count,
                difficulty_score
            FROM question_stats
            WHERE test_id = ?
            ORDER BY question_number
        ''', (test_id,))

        question_stats = [dict(row) for row in cursor]

        # 난이도별 문제 수
        easy_count = sum(1 for q in question_stats if q['difficulty_score'] >= 0.7)
        medium_count = sum(1 for q in question_stats if 0.3 <= q['difficulty_score'] < 0.7)
        hard_count = sum(1 for q in question_stats if q['difficulty_score'] < 0.3)

        return {
            'overall': overall_stats,
            'questions': question_stats,
            'difficulty_distribution': {
                'easy': easy_count,
                'medium': medium_count,
                'hard': hard_count
            }
        }

    def search_questions(self, query: str, question_type: Optional[str] = None,
                         level: Optional[int] = None) -> List[Dict]:
        """문제 검색

        Args:
            query: 검색어
            question_type: 문제 유형
            level: 난이도 급수

        Returns:
            검색 결과
        """

        sql = "SELECT * FROM questions WHERE (question LIKE ? OR passage LIKE ?)"
        params = [f"%{query}%", f"%{query}%"]

        if question_type:
            sql += " AND type = ?"
            params.append(question_type)

        if level:
            sql += " AND level = ?"
            params.append(level)

        sql += " ORDER BY created_at DESC LIMIT 50"

        cursor = self.conn.execute(sql, params)
        return [dict(row) for row in cursor]

    def delete_test(self, test_id: str):
        """테스트 삭제

        Args:
            test_id: 테스트 ID
        """

        self.conn.execute("DELETE FROM questions WHERE test_id = ?", (test_id,))
        self.conn.execute("DELETE FROM tests WHERE test_id = ?", (test_id,))
        self.conn.execute("DELETE FROM results WHERE test_id = ?", (test_id,))
        self.conn.execute("DELETE FROM question_stats WHERE test_id = ?", (test_id,))
        self.conn.commit()

        print(f"✓ Test {test_id} deleted")

    def export_to_json(self, test_id: str, filepath: str):
        """테스트를 JSON으로 내보내기

        Args:
            test_id: 테스트 ID
            filepath: 저장 경로
        """

        questions = self.get_test(test_id)

        data = {
            "test_id": test_id,
            "exported_at": datetime.now().isoformat(),
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

        print(f"✓ Test exported to {filepath}")

    def close(self):
        """데이터베이스 연결 종료"""
        self.conn.close()


# 사용 예시
if __name__ == "__main__":
    from topik_generator import TOPIKIIReadingGenerator

    # 데이터베이스 초기화
    db = TOPIKDatabase("database/topik.db")

    # 테스트 생성 및 저장
    generator = TOPIKIIReadingGenerator()
    questions = generator.generate_complete_test()

    test_id = f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    db.save_test(test_id, questions, metadata={"version": "1.0", "difficulty": "medium"})

    # 테스트 목록 조회
    print("\n=== 테스트 목록 ===")
    tests = db.list_tests(limit=5)
    for test in tests:
        print(f"- {test['test_id']}: {test['title']} ({test['question_count']}문제)")

    # 테스트 불러오기
    loaded_questions = db.get_test(test_id)
    print(f"\n✓ {len(loaded_questions)}개 문제 로드됨")

    # 성적 저장 예시
    sample_answers = [q.answer for q in loaded_questions]  # 모두 맞은 답안
    db.save_result(test_id, "user001", sample_answers, score=100, user_name="테스트유저")

    # 통계 조회
    stats = db.get_test_statistics(test_id)
    print(f"\n=== 통계 ===")
    print(f"평균 점수: {stats['overall']['avg_score']}")
    print(f"응시 횟수: {stats['overall']['total_attempts']}")

    db.close()
