import { StudyItem, ItemType } from '../types';

export const defaultQuestions: StudyItem[] = [
  {
    id: 'part1-combined',
    type: ItemType.Custom,
    category: 'Part 1',
    keyword: 'Part 1',
    question: `Part 1: 초등/중등 종강 시험

문 1: 1. 하나님과 2. 마귀는 각각 어떤 존재인지 쓰시오.
문 2: 2. 성경은 1. 누가 누구에게, 2. 왜 준 것인지 쓰시오.

(문제는 그대로 노출되고, 아래 학습에서는 답만 공부합니다.)`,
    fullAnswer: `문 1 답: ① 스스로 계신 분 즉 자존자
② 창조받은 피조자, 범죄한 천사

문 2 답: ① 하나님이 죄인들에게
② 생명이신 하나님과 사망자 마귀를 알리기 위함

(정답만 학습용으로 제공합니다.)`,
    blanks: []
  },
  {
    id: 'part2-combined',
    type: ItemType.Custom,
    category: 'Part 2',
    keyword: 'Part 2',
    question: `Part 2: 초등 비유의 의미와 핵심 성구

문제: 왼쪽에는 비유가, 오른쪽에는 풀이가 나옵니다. 아래 질문의 의미를 그대로 노출합니다.

- 비유(비사)의 의미는 무엇인가?
- 씨는 무엇을 의미하는가?
- 밭은 무엇을 의미하는가?`,
    fullAnswer: `비유(비사) 답: 실체 출현 전, 이를 감추시기 위해 비슷한 것으로 빗댄 것 (시 78:2)

씨 답: 말씀 (눅 8:11, 벧전 1:23)
※ 사단의 씨: 비진리 (요 8:44, 마 13:25)

밭 답: 사람의 마음 (눅 8:15, 고전 3:9), 세상 (마 13:38)`,
    blanks: []
  },
  {
    id: 'part3-combined',
    type: ItemType.Custom,
    category: 'Part 3',
    keyword: 'Part 3',
    question: `Part 3: 초등/중등/고등 목차 문제

- 초등 목차 제1과 답은 무엇인가?
- 초등 목차 제2과 답은 무엇인가?
- 초등 목차 제3과 답은 무엇인가?`,
    fullAnswer: `초등 목차 제1과 답: 두 가지 신(하나님과 사단)
초등 목차 제2과 답: 성경 상식
초등 목차 제3과 답: 천국 비밀 비유`,
    blanks: []
  }
];
