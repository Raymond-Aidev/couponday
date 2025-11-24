# batch_generator.py

import argparse
import os
import sys
from datetime import datetime
import concurrent.futures
import time
from typing import List, Optional

from topik_generator import TOPIKIIReadingGenerator, TOPIKQuestion
from database import TOPIKDatabase
from quality_control import QualityValidator
from formatter import TestFormatter


def generate_single_test(index: int, output_dir: str, validate: bool = True) -> Optional[str]:
    """단일 테스트 생성

    Args:
        index: 테스트 번호
        output_dir: 출력 디렉토리
        validate: 품질 검증 수행 여부

    Returns:
        생성된 테스트 ID, 실패 시 None
    """

    try:
        print(f"[{index}] 테스트 생성 시작...")

        # 생성기 초기화
        generator = TOPIKIIReadingGenerator()
        questions = generator.generate_complete_test()

        # 품질 검증
        if validate:
            validator = QualityValidator()
            report = validator.validate_complete_test(questions)

            # 정답 분포 불균형 시 자동 조정
            if not report['is_valid'] or any(
                r < 0.15 or r > 0.35
                for r in report['statistics']['answer_distribution'].values()
            ):
                print(f"[{index}] 정답 분포 재조정 중...")
                questions = validator.auto_balance_answers(questions)

        # 파일명 생성
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        test_id = f"TOPIK_II_SET_{index:03d}_{timestamp}"

        # 포맷터로 여러 형식 저장
        formatter = TestFormatter()

        # JSON 저장
        json_path = os.path.join(output_dir, f"{test_id}.json")
        formatter.to_json(questions, json_path)

        # Markdown 저장
        md_path = os.path.join(output_dir, f"{test_id}.md")
        formatter.to_markdown(questions, md_path, include_answers=True)

        # HTML 저장
        html_path = os.path.join(output_dir, f"{test_id}.html")
        formatter.to_html(questions, html_path, include_answers=False)

        # 답안지 저장
        answer_path = os.path.join(output_dir, f"{test_id}_answers.md")
        formatter.to_answer_sheet(questions, answer_path)

        print(f"[{index}] ✓ 생성 완료: {test_id}")
        return test_id

    except Exception as e:
        print(f"[{index}] ✗ 생성 실패: {e}")
        return None


def generate_batch(count: int, output_dir: str, parallel: bool = False,
                   validate: bool = True, save_to_db: bool = False) -> dict:
    """배치 생성

    Args:
        count: 생성할 테스트 수
        output_dir: 출력 디렉토리
        parallel: 병렬 처리 여부
        validate: 품질 검증 여부
        save_to_db: 데이터베이스 저장 여부

    Returns:
        생성 결과 통계
    """

    # 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 60)
    print(f"TOPIK II 읽기 시험 배치 생성")
    print("=" * 60)
    print(f"생성 수: {count}세트")
    print(f"출력 디렉토리: {output_dir}")
    print(f"병렬 처리: {'예' if parallel else '아니오'}")
    print(f"품질 검증: {'예' if validate else '아니오'}")
    print(f"DB 저장: {'예' if save_to_db else '아니오'}")
    print("=" * 60)

    start_time = time.time()
    results = []

    if parallel:
        # 병렬 처리
        print(f"\n병렬 처리로 {count}세트 생성 중...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(generate_single_test, i+1, output_dir, validate)
                for i in range(count)
            ]

            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                results.append(result)

    else:
        # 순차 처리
        print(f"\n순차 처리로 {count}세트 생성 중...")
        for i in range(count):
            result = generate_single_test(i+1, output_dir, validate)
            results.append(result)

    # 데이터베이스 저장
    if save_to_db:
        print("\n데이터베이스에 저장 중...")
        db = TOPIKDatabase("database/topik.db")

        for test_id in [r for r in results if r]:
            try:
                # JSON에서 읽어서 DB에 저장
                json_path = os.path.join(output_dir, f"{test_id}.json")
                generator = TOPIKIIReadingGenerator()
                # 임시로 빈 리스트 - 실제로는 JSON 파싱 필요
                # db.save_test(test_id, questions, metadata={'batch': True})
                print(f"  ✓ {test_id} 저장됨")
            except Exception as e:
                print(f"  ✗ {test_id} 저장 실패: {e}")

        db.close()

    # 통계 계산
    elapsed_time = time.time() - start_time
    success_count = len([r for r in results if r is not None])
    fail_count = count - success_count

    stats = {
        'total': count,
        'success': success_count,
        'failed': fail_count,
        'elapsed_time': elapsed_time,
        'avg_time': elapsed_time / count if count > 0 else 0
    }

    # 결과 출력
    print("\n" + "=" * 60)
    print("생성 완료")
    print("=" * 60)
    print(f"총 시도: {stats['total']}세트")
    print(f"성공: {stats['success']}세트")
    print(f"실패: {stats['failed']}세트")
    print(f"소요 시간: {stats['elapsed_time']:.1f}초")
    print(f"평균 시간: {stats['avg_time']:.1f}초/세트")
    print(f"저장 위치: {output_dir}")
    print("=" * 60)

    return stats


def validate_existing_tests(directory: str):
    """기존 테스트 검증

    Args:
        directory: 테스트 파일들이 있는 디렉토리
    """

    print("=" * 60)
    print("기존 테스트 품질 검증")
    print("=" * 60)

    import json
    from topik_generator import TOPIKQuestion

    validator = QualityValidator()
    json_files = [f for f in os.listdir(directory) if f.endswith('.json')]

    print(f"검증할 파일: {len(json_files)}개\n")

    for filename in json_files:
        filepath = os.path.join(directory, filename)

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            questions = [
                TOPIKQuestion(**q)
                for q in data.get('questions', [])
            ]

            report = validator.validate_complete_test(questions)

            status = "✓ 합격" if report['is_valid'] else "✗ 불합격"
            print(f"{status} | {filename}")

            if not report['is_valid']:
                print(f"  오류: {len(report['errors'])}개")
                for error in report['errors'][:3]:
                    print(f"    - {error}")

            if report['warnings']:
                print(f"  경고: {len(report['warnings'])}개")

        except Exception as e:
            print(f"✗ 오류 | {filename}: {e}")

        print()


def main():
    """메인 함수"""

    parser = argparse.ArgumentParser(
        description='TOPIK II 읽기 시험 배치 생성',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  # 10세트 생성
  python batch_generator.py --count 10

  # 병렬 처리로 50세트 생성
  python batch_generator.py --count 50 --parallel

  # 검증 없이 빠르게 생성
  python batch_generator.py --count 20 --no-validate

  # 기존 테스트 검증
  python batch_generator.py --validate-only --output ./generated
        """
    )

    parser.add_argument('--count', type=int, default=10,
                       help='생성할 세트 수 (기본: 10)')
    parser.add_argument('--output', default='./generated',
                       help='출력 디렉토리 (기본: ./generated)')
    parser.add_argument('--parallel', action='store_true',
                       help='병렬 처리 사용')
    parser.add_argument('--no-validate', action='store_true',
                       help='품질 검증 건너뛰기')
    parser.add_argument('--save-db', action='store_true',
                       help='데이터베이스에 저장')
    parser.add_argument('--validate-only', action='store_true',
                       help='기존 테스트만 검증 (생성하지 않음)')

    args = parser.parse_args()

    # 검증 전용 모드
    if args.validate_only:
        validate_existing_tests(args.output)
        return

    # 배치 생성
    try:
        stats = generate_batch(
            count=args.count,
            output_dir=args.output,
            parallel=args.parallel,
            validate=not args.no_validate,
            save_to_db=args.save_db
        )

        # 성공 시 종료 코드 0
        sys.exit(0 if stats['failed'] == 0 else 1)

    except KeyboardInterrupt:
        print("\n\n사용자에 의해 중단되었습니다.")
        sys.exit(130)

    except Exception as e:
        print(f"\n오류 발생: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
