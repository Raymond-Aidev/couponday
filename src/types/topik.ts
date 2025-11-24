export interface TOPIKQuestion {
  number: number;
  type: QuestionType;
  level: 3 | 4 | 5 | 6;
  passage?: string;
  question: string;
  choices: string[];
  answer: number; // 1-4
  explanation?: string;
  topic?: string;
}

export type QuestionType =
  | 'grammar_blank'
  | 'synonym'
  | 'text_type'
  | 'content_match'
  | 'sequence'
  | 'context_blank'
  | 'short_passage'
  | 'news_title'
  | 'long_blank'
  | 'content_match_long'
  | 'main_idea'
  | 'sentence_insert'
  | 'emotion_passage'
  | 'blank_and_topic'
  | 'attitude_content'
  | 'purpose_blank_content';

export interface TestMetadata {
  testId: string;
  createdAt: string;
  totalQuestions: number;
}

export interface TestData {
  metadata: TestMetadata;
  questions: TOPIKQuestion[];
}

export interface QualityReport {
  isValid: boolean;
  totalQuestions: number;
  questionTypes: Record<string, number>;
  difficultyDistribution: Record<number, number>;
  answerDistribution: Record<number, number>;
  errors: string[];
}

export interface GeneratorOptions {
  useAI: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  topics?: string[];
}
