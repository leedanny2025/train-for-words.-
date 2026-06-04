export enum ItemType {
  Verse = 'VERSE',
  Exam = 'EXAM',
  Custom = 'CUSTOM'
}

export interface StudyItem {
  id: string;
  type: ItemType;
  category: string; // e.g., "사명 성구", "종합 시험"
  keyword: string;  // e.g., "계 22:1~2", "문제 1"
  question: string; // The query or prompt. For Verses, this is the reference (e.g. "계 22:1~2"). For exam, "내가 참으로 이 성경대로..."
  fullAnswer: string; // The full text to memorize or write
  blanks: string[];  // Target phrases that will be blanked out in Stage 2 (or automatically generated)
  hints?: string[];  // Optional stage hints
}

export interface ProgressState {
  itemId: string;
  stage1Completed: boolean; // word chunking
  stage2Completed: boolean; // part blanks
  stage3Completed: boolean; // full blank/writing
  attempts: number;
  lastStudiedAt: string;
}

export type StudyStage = 'DASHBOARD' | 'STAGE1' | 'STAGE2' | 'STAGE3' | 'SUMMARY';
