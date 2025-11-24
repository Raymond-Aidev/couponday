import { create } from 'zustand';
import { TestData, QualityReport, GeneratorOptions } from '../types/topik';
import { TOPIKGenerator } from '../lib/generator';
import { QualityValidator } from '../lib/validator';

interface TestStore {
  currentTest: TestData | null;
  qualityReport: QualityReport | null;
  isGenerating: boolean;
  error: string | null;

  generateTest: (options?: GeneratorOptions) => void;
  validateTest: () => void;
  clearTest: () => void;
  setError: (error: string | null) => void;
}

export const useTestStore = create<TestStore>((set, get) => ({
  currentTest: null,
  qualityReport: null,
  isGenerating: false,
  error: null,

  generateTest: (_options) => {
    set({ isGenerating: true, error: null });

    try {
      const generator = new TOPIKGenerator();
      const testData = generator.generateCompleteTest();

      // 정답 분포 자동 균형 조정
      const validator = new QualityValidator();
      const balancedQuestions = validator.autoBalanceAnswers(testData.questions);
      testData.questions = balancedQuestions;

      set({ currentTest: testData, isGenerating: false });

      // 자동으로 품질 검증
      get().validateTest();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '문제 생성 중 오류가 발생했습니다.',
        isGenerating: false
      });
    }
  },

  validateTest: () => {
    const { currentTest } = get();
    if (!currentTest) {
      set({ error: '검증할 시험이 없습니다.' });
      return;
    }

    const validator = new QualityValidator();
    const report = validator.validateTest(currentTest.questions);

    set({ qualityReport: report });
  },

  clearTest: () => {
    set({
      currentTest: null,
      qualityReport: null,
      error: null
    });
  },

  setError: (error) => {
    set({ error });
  }
}));
