import { TOPIKQuestion, QuestionType, TestData } from '../types/topik';
import { grammarPoints, synonymPairs, passages, textTypes } from './resources';

export class TOPIKGenerator {
  private questionStructure: Record<string, [QuestionType, number]> = {
    '1-2': ['grammar_blank', 2],
    '3-4': ['synonym', 2],
    '5-8': ['text_type', 4],
    '9-12': ['content_match', 4],
    '13-15': ['sequence', 3],
    '16-18': ['context_blank', 3],
    '19-20': ['short_passage', 2],
    '21-22': ['short_passage', 2],
    '23-24': ['short_passage', 2],
    '25-27': ['news_title', 3],
    '28-31': ['long_blank', 4],
    '32-34': ['content_match_long', 3],
    '35-38': ['main_idea', 4],
    '39-41': ['sentence_insert', 3],
    '42-43': ['emotion_passage', 2],
    '44-45': ['blank_and_topic', 2],
    '46-47': ['attitude_content', 2],
    '48-50': ['purpose_blank_content', 3]
  };

  generateCompleteTest(): TestData {
    const questions: TOPIKQuestion[] = [];
    let questionNum = 1;

    for (const [qType, count] of Object.values(this.questionStructure)) {
      for (let i = 0; i < count; i++) {
        const question = this.generateQuestion(questionNum, qType);
        questions.push(question);
        questionNum++;
      }
    }

    return {
      metadata: {
        testId: `TOPIK_II_${Date.now()}`,
        createdAt: new Date().toISOString(),
        totalQuestions: 50
      },
      questions
    };
  }

  private generateQuestion(num: number, type: QuestionType): TOPIKQuestion {
    const generators: Record<QuestionType, (num: number) => TOPIKQuestion> = {
      grammar_blank: (n) => this.genGrammar(n),
      synonym: (n) => this.genSynonym(n),
      text_type: (n) => this.genTextType(n),
      content_match: (n) => this.genContentMatch(n),
      sequence: (n) => this.genSequence(n),
      context_blank: (n) => this.genContextBlank(n),
      short_passage: (n) => this.genShortPassage(n),
      news_title: (n) => this.genNewsTitle(n),
      long_blank: (n) => this.genLongBlank(n),
      content_match_long: (n) => this.genContentMatchLong(n),
      main_idea: (n) => this.genMainIdea(n),
      sentence_insert: (n) => this.genSentenceInsert(n),
      emotion_passage: (n) => this.genEmotionPassage(n),
      blank_and_topic: (n) => this.genBlankAndTopic(n),
      attitude_content: (n) => this.genAttitude(n),
      purpose_blank_content: (n) => this.genPurpose(n)
    };

    return generators[type](num);
  }

  private genGrammar(num: number): TOPIKQuestion {
    const level = num <= 2 ? 3 : 4;
    const grammar = this.randomChoice(grammarPoints[level as 3 | 4]);

    const templates = [
      `친구를 만나(    ) 약속 장소에 갔다.`,
      `비가 오(    ) 우산을 가져왔다.`,
      `숙제를 끝내(    ) 놀러 갔다.`,
      `시험 공부(    ) 도서관에 갔다.`
    ];

    const sentence = this.randomChoice(templates);
    const correctChoice = grammar.pattern.split('/')[0];

    const choices = this.createGrammarChoices(correctChoice, level);
    const answer = Math.floor(Math.random() * 4) + 1;

    const shuffledChoices = [...choices];
    shuffledChoices[answer - 1] = correctChoice;

    return {
      number: num,
      type: 'grammar_blank',
      level: level as 3 | 4,
      question: sentence,
      choices: shuffledChoices,
      answer,
      topic: '문법'
    };
  }

  private genSynonym(num: number): TOPIKQuestion {
    const pair = this.randomChoice(synonymPairs);
    const sentence = `시험에 떨어지는 ${pair.target} 다시 준비해야 한다.`;

    const allChoices = [pair.correct, ...pair.distractors];
    const shuffled = this.shuffle(allChoices);
    const answer = shuffled.indexOf(pair.correct) + 1;

    return {
      number: num,
      type: 'synonym',
      level: 3,
      question: sentence,
      choices: shuffled,
      answer,
      topic: '어휘'
    };
  }

  private genTextType(num: number): TOPIKQuestion {
    const textType = this.randomChoice(textTypes);
    const passage = this.createTextTypePassage(textType.type);

    const choices = this.shuffle([
      textType.type,
      ...this.getOtherTextTypes(textType.type)
    ]);
    const answer = choices.indexOf(textType.type) + 1;

    return {
      number: num,
      type: 'text_type',
      level: 3,
      passage,
      question: '이 글의 종류는 무엇입니까?',
      choices,
      answer,
      topic: '글의 종류'
    };
  }

  private genContentMatch(num: number): TOPIKQuestion {
    const passage = `
**도서관 이용 안내**

• 운영시간: 평일 09:00-22:00, 주말 09:00-18:00
• 대출 가능 권수: 1인당 5권
• 대출 기간: 2주 (연장 1회 가능)
• 휴관일: 매주 월요일, 법정 공휴일
    `.trim();

    const correctStatement = '주말에는 평일보다 일찍 문을 닫는다.';
    const wrongStatements = [
      '월요일에도 도서관을 이용할 수 있다.',
      '책은 한 번에 10권까지 빌릴 수 있다.',
      '대출 기간은 1주일이다.'
    ];

    const choices = this.shuffle([correctStatement, ...wrongStatements]);
    const answer = choices.indexOf(correctStatement) + 1;

    return {
      number: num,
      type: 'content_match',
      level: 3,
      passage,
      question: '이 글의 내용과 같은 것을 고르십시오.',
      choices,
      answer,
      topic: '내용 일치'
    };
  }

  private genSequence(num: number): TOPIKQuestion {
    const sentences = [
      '먼저 재료를 준비한다.',
      '그 다음 재료를 씻는다.',
      '그리고 적당한 크기로 자른다.',
      '마지막으로 조리를 한다.'
    ];

    const shuffled = this.shuffle([...sentences]);
    const question = `(가) ${shuffled[0]}\n(나) ${shuffled[1]}\n(다) ${shuffled[2]}\n(라) ${shuffled[3]}`;

    const choices = ['(가)-(나)-(다)-(라)', '(나)-(가)-(라)-(다)', '(가)-(다)-(나)-(라)', '(다)-(나)-(가)-(라)'];
    const answer = 1;

    return {
      number: num,
      type: 'sequence',
      level: 4,
      passage: question,
      question: '다음 문장을 순서대로 맞게 배열한 것을 고르십시오.',
      choices,
      answer,
      topic: '순서 배열'
    };
  }

  private genContextBlank(num: number): TOPIKQuestion {
    const sentence = '그는 매우 부지런하다. (    ) 항상 일찍 일어나서 운동을 한다.';
    const correctChoice = '그래서';
    const wrongChoices = ['그러나', '그런데', '그러므로'];

    const choices = this.shuffle([correctChoice, ...wrongChoices]);
    const answer = choices.indexOf(correctChoice) + 1;

    return {
      number: num,
      type: 'context_blank',
      level: 4,
      question: sentence,
      choices,
      answer,
      topic: '문맥 빈칸'
    };
  }

  private genShortPassage(num: number): TOPIKQuestion {
    const passage = this.randomChoice(passages.short);
    const q = passage.questions[0];

    const choices = this.shuffle([q.correct, ...q.distractors]);
    const answer = choices.indexOf(q.correct) + 1;

    return {
      number: num,
      type: 'short_passage',
      level: passage.level as 4 | 5,
      passage: passage.text,
      question: q.q,
      choices,
      answer,
      topic: passage.topic
    };
  }

  private genNewsTitle(num: number): TOPIKQuestion {
    const passage = '한국의 전통 시장이 새롭게 변화하고 있다. 최근 많은 전통 시장에서 현대적인 시설을 도입하고 다양한 문화 행사를 개최하여 젊은 층의 방문을 유도하고 있다.';
    const correctTitle = '전통 시장의 현대화로 젊은 층 유치';
    const wrongTitles = [
      '전통 시장 폐업 증가',
      '현대 쇼핑몰 인기 상승',
      '문화 행사 참여 저조'
    ];

    const choices = this.shuffle([correctTitle, ...wrongTitles]);
    const answer = choices.indexOf(correctTitle) + 1;

    return {
      number: num,
      type: 'news_title',
      level: 5,
      passage,
      question: '이 글의 제목으로 가장 알맞은 것을 고르십시오.',
      choices,
      answer,
      topic: '제목 찾기'
    };
  }

  private genLongBlank(num: number): TOPIKQuestion {
    const passage = '최근 재택근무가 확산되면서 업무 환경이 크게 변화했다. (    ) 통근 시간이 줄어 개인 시간이 늘어났고, 업무 효율성도 높아졌다는 평가가 많다.';
    const correctChoice = '그 결과';
    const wrongChoices = ['그런데', '예를 들어', '반면에'];

    const choices = this.shuffle([correctChoice, ...wrongChoices]);
    const answer = choices.indexOf(correctChoice) + 1;

    return {
      number: num,
      type: 'long_blank',
      level: 5,
      passage,
      question: '빈칸에 들어갈 가장 알맞은 것을 고르십시오.',
      choices,
      answer,
      topic: '긴 글 빈칸'
    };
  }

  private genContentMatchLong(num: number): TOPIKQuestion {
    const passage = this.randomChoice(passages.medium);
    const q = passage.questions[0];

    const choices = this.shuffle([q.correct, ...q.distractors]);
    const answer = choices.indexOf(q.correct) + 1;

    return {
      number: num,
      type: 'content_match_long',
      level: 5,
      passage: passage.text,
      question: q.q,
      choices,
      answer,
      topic: passage.topic
    };
  }

  private genMainIdea(num: number): TOPIKQuestion {
    const passage = '운동은 신체 건강뿐만 아니라 정신 건강에도 좋다. 규칙적인 운동은 스트레스를 줄이고 기분을 좋게 만든다. 또한 수면의 질도 향상시켜 전반적인 삶의 질을 높인다.';
    const correctIdea = '운동의 다양한 긍정적 효과';
    const wrongIdeas = ['운동 방법 소개', '스트레스의 원인', '수면 장애 치료법'];

    const choices = this.shuffle([correctIdea, ...wrongIdeas]);
    const answer = choices.indexOf(correctIdea) + 1;

    return {
      number: num,
      type: 'main_idea',
      level: 5,
      passage,
      question: '이 글의 중심 생각을 고르십시오.',
      choices,
      answer,
      topic: '중심 생각'
    };
  }

  private genSentenceInsert(num: number): TOPIKQuestion {
    const passage = '최근 친환경 제품에 대한 관심이 높아지고 있다. (가) 이는 환경 보호에 대한 인식이 증가했기 때문이다. (나) 기업들도 이러한 변화에 발맞춰 다양한 친환경 제품을 출시하고 있다. (다) 소비자들의 선택이 환경을 바꿀 수 있다.';
    const insertSentence = '따라서 소비자들의 책임 있는 구매가 중요하다.';

    const choices = ['(가)', '(나)', '(다)', '(라)'];
    const answer = 3;

    return {
      number: num,
      type: 'sentence_insert',
      level: 6,
      passage: passage + '\n\n삽입 문장: ' + insertSentence,
      question: '다음 문장이 들어가기에 가장 알맞은 곳을 고르십시오.',
      choices,
      answer,
      topic: '문장 삽입'
    };
  }

  private genEmotionPassage(num: number): TOPIKQuestion {
    const passage = '그날의 기억은 아직도 생생하다. 처음으로 무대에 올랐을 때의 떨림, 관객들의 박수 소리, 그리고 무사히 공연을 마쳤을 때의 안도감. 모든 것이 꿈만 같았다.';
    const correctEmotion = '긴장과 안도';
    const wrongEmotions = ['분노와 후회', '슬픔과 외로움', '무관심과 지루함'];

    const choices = this.shuffle([correctEmotion, ...wrongEmotions]);
    const answer = choices.indexOf(correctEmotion) + 1;

    return {
      number: num,
      type: 'emotion_passage',
      level: 5,
      passage,
      question: '글쓴이의 감정으로 가장 알맞은 것을 고르십시오.',
      choices,
      answer,
      topic: '감정 파악'
    };
  }

  private genBlankAndTopic(num: number): TOPIKQuestion {
    const passage = '디지털 기술의 발전으로 교육 방식이 변화하고 있다. 온라인 강의, 가상현실 체험 등 (    ) 학습 방법이 등장하면서 학생들은 시간과 장소에 구애받지 않고 학습할 수 있게 되었다.';
    const correctChoice = '새로운';
    const wrongChoices = ['전통적인', '비효율적인', '불필요한'];

    const choices = this.shuffle([correctChoice, ...wrongChoices]);
    const answer = choices.indexOf(correctChoice) + 1;

    return {
      number: num,
      type: 'blank_and_topic',
      level: 6,
      passage,
      question: '빈칸에 들어갈 말과 이 글의 주제를 고르십시오.',
      choices,
      answer,
      topic: '빈칸과 주제'
    };
  }

  private genAttitude(num: number): TOPIKQuestion {
    const passage = this.randomChoice(passages.long);
    const q = passage.questions[passage.questions.length - 1];

    const choices = this.shuffle([q.correct, ...q.distractors]);
    const answer = choices.indexOf(q.correct) + 1;

    return {
      number: num,
      type: 'attitude_content',
      level: 6,
      passage: passage.text,
      question: q.q,
      choices,
      answer,
      topic: passage.topic
    };
  }

  private genPurpose(num: number): TOPIKQuestion {
    const passage = '이 글은 최근 증가하는 온라인 사기를 예방하기 위한 방법을 안내하고 있다. 개인정보 보호의 중요성을 강조하며, 의심스러운 링크를 클릭하지 않도록 당부한다.';
    const correctPurpose = '온라인 사기 예방 방법 안내';
    const wrongPurposes = ['온라인 쇼핑 방법 소개', '개인정보 수집', '링크 공유 권장'];

    const choices = this.shuffle([correctPurpose, ...wrongPurposes]);
    const answer = choices.indexOf(correctPurpose) + 1;

    return {
      number: num,
      type: 'purpose_blank_content',
      level: 6,
      passage,
      question: '이 글을 쓴 목적을 고르십시오.',
      choices,
      answer,
      topic: '글의 목적'
    };
  }

  // Helper methods
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private createGrammarChoices(correct: string, level: number): string[] {
    const allGrammar = grammarPoints[level as 3 | 4 | 5 | 6];
    const others = allGrammar
      .map(g => g.pattern.split('/')[0])
      .filter(p => p !== correct);

    return this.shuffle(others).slice(0, 3);
  }

  private getOtherTextTypes(current: string): string[] {
    const others = textTypes
      .map(t => t.type)
      .filter(t => t !== current);

    return this.shuffle(others).slice(0, 3);
  }

  private createTextTypePassage(type: string): string {
    const passages: Record<string, string> = {
      '물건 설명': '이 제품은 고급 스테인레스 재질로 만들어져 내구성이 뛰어납니다. 주방에서 다양한 용도로 사용할 수 있으며, 세척도 간편합니다.',
      '장소 안내': '본 카페는 시청역 3번 출구에서 도보 5분 거리에 있습니다. 평일 오전 8시부터 오후 10시까지 영업하며, 무료 Wi-Fi를 제공합니다.',
      '캠페인/행사': '우리 동네 환경 지키기 캠페인에 참여해 주세요. 매주 토요일 오전 10시에 진행되며, 참여자에게는 친환경 가방을 드립니다.',
      '규칙/규정': '도서관 내에서는 정숙해야 하며, 음식물 반입은 금지됩니다. 이를 위반할 경우 퇴실 조치될 수 있습니다.',
      '광고': '올 여름 특별 할인! 전 품목 30% 할인 행사를 진행합니다. 자세한 내용은 매장으로 문의해 주세요. Tel: 02-1234-5678'
    };

    return passages[type] || passages['물건 설명'];
  }
}
