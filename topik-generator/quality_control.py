# quality_control.py

import random
from typing import List, Dict, Tuple
from collections import Counter
from topik_generator import TOPIKQuestion

class QualityValidator:
    """문제 품질 검증"""

    def __init__(self):
        self.criteria = {
            "question_count": 50,
            "min_choices": 4,
            "max_choices": 4,
            "difficulty_range": (3, 6),
            "answer_distribution_range": (0.15, 0.35),  # 각 번호당 15-35%
            "min_passage_length": 20,  # 최소 지문 길이
            "max_question_length": 500  # 최대 문제 길이
        }

    def validate_complete_test(self, questions: List[TOPIKQuestion]) -> Dict:
        """전체 테스트 검증

        Args:
            questions: 문제 리스트

        Returns:
            검증 리포트
        """

        report = {
            "total_questions": len(questions),
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "statistics": {},
            "recommendations": []
        }

        # 1. 문제 수 검증
        if len(questions) != self.criteria["question_count"]:
            report["errors"].append(
                f"문제 수 오류: {len(questions)}개 (필요: {self.criteria['question_count']}개)"
            )
            report["is_valid"] = False

        # 2. 문제 유형 분포
        report["statistics"]["question_types"] = self._check_types(questions)

        # 3. 난이도 분포
        report["statistics"]["difficulty_distribution"] = self._check_difficulty(questions)

        # 4. 정답 분포 검증
        answer_dist = self._calculate_answer_distribution(questions)
        report["statistics"]["answer_distribution"] = answer_dist

        for num, ratio in answer_dist.items():
            min_ratio, max_ratio = self.criteria["answer_distribution_range"]
            if not (min_ratio <= ratio <= max_ratio):
                report["warnings"].append(
                    f"정답 {num}번 비율 불균형: {ratio:.1%} (권장: {min_ratio:.0%}-{max_ratio:.0%})"
                )

        # 5. 개별 문제 검증
        for q in questions:
            errors = self._validate_single_question(q)
            if errors:
                report["errors"].extend(errors)
                report["is_valid"] = False

        # 6. 내용 품질 검증
        content_issues = self._check_content_quality(questions)
        report["warnings"].extend(content_issues)

        # 7. 추천 사항
        if report["warnings"] or report["errors"]:
            report["recommendations"] = self._generate_recommendations(report)

        return report

    def _validate_single_question(self, question: TOPIKQuestion) -> List[str]:
        """개별 문제 검증"""

        errors = []

        # 선택지 수 검증
        if len(question.choices) != self.criteria["min_choices"]:
            errors.append(
                f"문제 {question.number}: 선택지 수 오류 ({len(question.choices)}개)"
            )

        # 정답 범위 검증
        if not (1 <= question.answer <= len(question.choices)):
            errors.append(
                f"문제 {question.number}: 정답 번호 오류 ({question.answer})"
            )

        # 난이도 검증
        min_level, max_level = self.criteria["difficulty_range"]
        if not (min_level <= question.level <= max_level):
            errors.append(
                f"문제 {question.number}: 난이도 범위 오류 ({question.level}급)"
            )

        # 빈 선택지 검증
        for i, choice in enumerate(question.choices, 1):
            if not choice or not choice.strip():
                errors.append(
                    f"문제 {question.number}: 선택지 {i}번이 비어있음"
                )

        # 중복 선택지 검증
        if len(question.choices) != len(set(question.choices)):
            errors.append(
                f"문제 {question.number}: 중복 선택지 존재"
            )

        return errors

    def _calculate_answer_distribution(self, questions: List[TOPIKQuestion]) -> Dict[int, float]:
        """정답 분포 계산"""

        if not questions:
            return {}

        answers = [q.answer for q in questions]
        distribution = {}

        for i in range(1, 5):  # 1-4번
            count = answers.count(i)
            distribution[i] = count / len(questions)

        return distribution

    def _check_types(self, questions: List[TOPIKQuestion]) -> Dict[str, int]:
        """문제 유형 분포 확인"""

        type_counter = Counter(q.type for q in questions)
        return dict(type_counter)

    def _check_difficulty(self, questions: List[TOPIKQuestion]) -> Dict[int, int]:
        """난이도 분포 확인"""

        level_counter = Counter(q.level for q in questions)
        return dict(level_counter)

    def _check_content_quality(self, questions: List[TOPIKQuestion]) -> List[str]:
        """내용 품질 검증"""

        warnings = []

        for q in questions:
            # 지문 길이 검증
            if q.passage and len(q.passage) < self.criteria["min_passage_length"]:
                warnings.append(
                    f"문제 {q.number}: 지문이 너무 짧음 ({len(q.passage)}자)"
                )

            # 문제 길이 검증
            if len(q.question) > self.criteria["max_question_length"]:
                warnings.append(
                    f"문제 {q.number}: 문제가 너무 김 ({len(q.question)}자)"
                )

            # 선택지 길이 균형 검증
            lengths = [len(c) for c in q.choices]
            if max(lengths) > min(lengths) * 3:
                warnings.append(
                    f"문제 {q.number}: 선택지 길이 불균형"
                )

        return warnings

    def _generate_recommendations(self, report: Dict) -> List[str]:
        """개선 추천 사항 생성"""

        recommendations = []

        # 정답 분포 불균형 해결
        answer_dist = report["statistics"].get("answer_distribution", {})
        unbalanced = [
            num for num, ratio in answer_dist.items()
            if ratio < 0.15 or ratio > 0.35
        ]

        if unbalanced:
            recommendations.append(
                f"정답 분포 재조정 필요: auto_balance_answers() 함수 사용 권장"
            )

        # 오류가 많은 경우
        if len(report["errors"]) > 5:
            recommendations.append(
                "심각한 오류가 다수 발견됨. 문제 생성 로직 점검 필요"
            )

        # 경고가 많은 경우
        if len(report["warnings"]) > 10:
            recommendations.append(
                "품질 경고가 다수 발견됨. 수동 검수 권장"
            )

        return recommendations

    def auto_balance_answers(self, questions: List[TOPIKQuestion]) -> List[TOPIKQuestion]:
        """정답 자동 균형 조정

        Args:
            questions: 문제 리스트

        Returns:
            조정된 문제 리스트
        """

        target_per_answer = len(questions) // 4
        current_counts = {i: 0 for i in range(1, 5)}

        # 현재 정답 분포 계산
        for q in questions:
            current_counts[q.answer] += 1

        # 재조정
        adjusted_questions = []

        for q in questions:
            # 현재 정답이 너무 많으면 다른 번호로 변경
            if current_counts[q.answer] > target_per_answer + 2:
                # 가장 적은 번호 찾기
                min_count_num = min(current_counts, key=current_counts.get)

                if current_counts[min_count_num] < target_per_answer:
                    # 정답과 선택지 교환
                    old_answer_idx = q.answer - 1
                    new_answer_idx = min_count_num - 1

                    new_choices = q.choices.copy()
                    new_choices[old_answer_idx], new_choices[new_answer_idx] = \
                        new_choices[new_answer_idx], new_choices[old_answer_idx]

                    # 새 문제 생성
                    adjusted_q = TOPIKQuestion(
                        number=q.number,
                        type=q.type,
                        level=q.level,
                        passage=q.passage,
                        question=q.question,
                        choices=new_choices,
                        answer=min_count_num,
                        explanation=q.explanation,
                        topic=q.topic
                    )

                    current_counts[q.answer] -= 1
                    current_counts[min_count_num] += 1

                    adjusted_questions.append(adjusted_q)
                    continue

            adjusted_questions.append(q)

        return adjusted_questions

    def generate_difficulty_report(self, questions: List[TOPIKQuestion]) -> str:
        """난이도 리포트 생성"""

        level_dist = self._check_difficulty(questions)

        report = "=== 난이도 분석 ===\n"
        for level in sorted(level_dist.keys()):
            count = level_dist[level]
            percentage = (count / len(questions)) * 100
            report += f"TOPIK {level}급: {count}문제 ({percentage:.1f}%)\n"

        # 권장 분포와 비교
        recommended = {3: 10, 4: 15, 5: 15, 6: 10}
        report += "\n=== 권장 분포 ===\n"
        for level, rec_count in recommended.items():
            actual_count = level_dist.get(level, 0)
            diff = actual_count - rec_count
            status = "✓" if abs(diff) <= 2 else "⚠"
            report += f"{status} {level}급: 권장 {rec_count}문제, 실제 {actual_count}문제\n"

        return report

    def check_duplicate_content(self, questions: List[TOPIKQuestion]) -> List[Tuple[int, int]]:
        """중복 내용 검사

        Returns:
            (문제번호1, 문제번호2) 튜플 리스트
        """

        duplicates = []

        for i, q1 in enumerate(questions):
            for j, q2 in enumerate(questions[i+1:], i+1):
                # 문제 텍스트 유사도 (단순 비교)
                if q1.question == q2.question:
                    duplicates.append((q1.number, q2.number))

                # 지문 유사도
                if q1.passage and q2.passage and q1.passage == q2.passage:
                    if (q1.number, q2.number) not in duplicates:
                        duplicates.append((q1.number, q2.number))

        return duplicates

    def validate_answer_key(self, questions: List[TOPIKQuestion], answer_key: List[int]) -> Dict:
        """정답지 검증

        Args:
            questions: 문제 리스트
            answer_key: 정답 리스트

        Returns:
            검증 결과
        """

        result = {
            "is_valid": True,
            "errors": [],
            "mismatches": []
        }

        if len(questions) != len(answer_key):
            result["errors"].append(
                f"문제 수와 정답 수 불일치: {len(questions)} vs {len(answer_key)}"
            )
            result["is_valid"] = False
            return result

        for q, answer in zip(questions, answer_key):
            # 정답 범위 검증
            if not (1 <= answer <= 4):
                result["errors"].append(
                    f"문제 {q.number}: 정답 범위 오류 ({answer})"
                )
                result["is_valid"] = False

            # 불일치 검사
            if q.answer != answer:
                result["mismatches"].append({
                    "question_number": q.number,
                    "stored_answer": q.answer,
                    "provided_answer": answer
                })

        if result["mismatches"]:
            result["warnings"] = [
                f"정답 불일치: {len(result['mismatches'])}개 문제"
            ]

        return result


# 사용 예시
if __name__ == "__main__":
    from topik_generator import TOPIKIIReadingGenerator

    # 테스트 생성
    generator = TOPIKIIReadingGenerator()
    questions = generator.generate_complete_test()

    # 품질 검증
    validator = QualityValidator()
    report = validator.validate_complete_test(questions)

    # 결과 출력
    print("=== 품질 검증 리포트 ===")
    print(f"전체 문제 수: {report['total_questions']}")
    print(f"검증 결과: {'합격' if report['is_valid'] else '불합격'}")

    if report['errors']:
        print(f"\n❌ 오류 ({len(report['errors'])}개):")
        for error in report['errors'][:5]:
            print(f"  - {error}")

    if report['warnings']:
        print(f"\n⚠ 경고 ({len(report['warnings'])}개):")
        for warning in report['warnings'][:5]:
            print(f"  - {warning}")

    # 정답 분포
    print("\n=== 정답 분포 ===")
    for num, ratio in report['statistics']['answer_distribution'].items():
        print(f"{num}번: {ratio:.1%}")

    # 자동 균형 조정
    if any(r < 0.15 or r > 0.35 for r in report['statistics']['answer_distribution'].values()):
        print("\n정답 분포 재조정 중...")
        balanced_questions = validator.auto_balance_answers(questions)

        # 재검증
        new_report = validator.validate_complete_test(balanced_questions)
        print("\n=== 조정 후 정답 분포 ===")
        for num, ratio in new_report['statistics']['answer_distribution'].items():
            print(f"{num}번: {ratio:.1%}")

    # 난이도 리포트
    print("\n" + validator.generate_difficulty_report(questions))

    # 중복 검사
    duplicates = validator.check_duplicate_content(questions)
    if duplicates:
        print(f"\n⚠ 중복 내용 발견: {len(duplicates)}쌍")
        for q1, q2 in duplicates[:3]:
            print(f"  - 문제 {q1}번과 {q2}번")
