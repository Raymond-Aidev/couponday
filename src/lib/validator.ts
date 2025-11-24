import { TOPIKQuestion, QualityReport } from '../types/topik';

export class QualityValidator {
  validateTest(questions: TOPIKQuestion[]): QualityReport {
    const errors: string[] = [];

    // 1. 문제 수 검증
    if (questions.length !== 50) {
      errors.push(`문제 수 오류: ${questions.length}개 (필요: 50개)`);
    }

    // 2. 문제 유형 분포
    const questionTypes = this.getQuestionTypeDistribution(questions);

    // 3. 난이도 분포
    const difficultyDistribution = this.getDifficultyDistribution(questions);

    // 4. 정답 분포 검증
    const answerDistribution = this.getAnswerDistribution(questions);
    const answerErrors = this.validateAnswerDistribution(answerDistribution, questions.length);
    errors.push(...answerErrors);

    // 5. 선택지 개수 검증
    const choiceErrors = this.validateChoices(questions);
    errors.push(...choiceErrors);

    return {
      isValid: errors.length === 0,
      totalQuestions: questions.length,
      questionTypes,
      difficultyDistribution,
      answerDistribution,
      errors
    };
  }

  private getQuestionTypeDistribution(questions: TOPIKQuestion[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    questions.forEach(q => {
      distribution[q.type] = (distribution[q.type] || 0) + 1;
    });

    return distribution;
  }

  private getDifficultyDistribution(questions: TOPIKQuestion[]): Record<number, number> {
    const distribution: Record<number, number> = {
      3: 0,
      4: 0,
      5: 0,
      6: 0
    };

    questions.forEach(q => {
      distribution[q.level]++;
    });

    return distribution;
  }

  private getAnswerDistribution(questions: TOPIKQuestion[]): Record<number, number> {
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0
    };

    questions.forEach(q => {
      if (q.answer >= 1 && q.answer <= 4) {
        distribution[q.answer]++;
      }
    });

    return distribution;
  }

  private validateAnswerDistribution(
    distribution: Record<number, number>,
    totalQuestions: number
  ): string[] {
    const errors: string[] = [];
    const minPerAnswer = Math.floor(totalQuestions * 0.20); // 최소 20%
    const maxPerAnswer = Math.ceil(totalQuestions * 0.30); // 최대 30%

    Object.entries(distribution).forEach(([answer, count]) => {
      const percentage = (count / totalQuestions) * 100;
      if (count < minPerAnswer || count > maxPerAnswer) {
        errors.push(
          `정답 ${answer}번 비율 불균형: ${count}개 (${percentage.toFixed(1)}%)`
        );
      }
    });

    return errors;
  }

  private validateChoices(questions: TOPIKQuestion[]): string[] {
    const errors: string[] = [];

    questions.forEach(q => {
      if (q.choices.length !== 4) {
        errors.push(`문제 ${q.number}: 선택지 개수 오류 (${q.choices.length}개)`);
      }

      if (q.answer < 1 || q.answer > 4) {
        errors.push(`문제 ${q.number}: 정답 번호 오류 (${q.answer})`);
      }

      // 빈 선택지 검증
      q.choices.forEach((choice, index) => {
        if (!choice || choice.trim() === '') {
          errors.push(`문제 ${q.number}: 선택지 ${index + 1}번이 비어있음`);
        }
      });

      // 중복 선택지 검증
      const uniqueChoices = new Set(q.choices);
      if (uniqueChoices.size !== q.choices.length) {
        errors.push(`문제 ${q.number}: 중복된 선택지가 있음`);
      }
    });

    return errors;
  }

  // 정답 분포 자동 균형 조정
  autoBalanceAnswers(questions: TOPIKQuestion[]): TOPIKQuestion[] {
    const balanced = [...questions];
    const targetPerAnswer = Math.floor(questions.length / 4); // 50 / 4 = 12.5
    const currentCounts = this.getAnswerDistribution(questions);

    // 너무 많은 정답 번호를 찾아서 재분배
    for (let i = 0; i < balanced.length; i++) {
      const q = balanced[i];

      if (currentCounts[q.answer] > targetPerAnswer + 2) {
        // 가장 적은 정답 번호 찾기
        const minAnswer = Object.entries(currentCounts)
          .sort((a, b) => a[1] - b[1])[0][0];
        const minAnswerNum = parseInt(minAnswer);

        if (currentCounts[minAnswerNum] < targetPerAnswer) {
          // 정답과 선택지 위치 교환
          const oldAnswerIndex = q.answer - 1;
          const newAnswerIndex = minAnswerNum - 1;

          const temp = q.choices[oldAnswerIndex];
          q.choices[oldAnswerIndex] = q.choices[newAnswerIndex];
          q.choices[newAnswerIndex] = temp;

          currentCounts[q.answer]--;
          currentCounts[minAnswerNum]++;
          q.answer = minAnswerNum;
        }
      }
    }

    return balanced;
  }
}
