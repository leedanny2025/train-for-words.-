import React, { useState } from 'react';
import { BookOpen, Award, CheckCircle, Flame, PlusCircle, Shuffle, ChevronRight, Check, Folder, FolderPlus, FolderOpen, Trash2, Edit2, Plus, X, Tag } from 'lucide-react';
import { StudyItem, ProgressState, ItemType } from '../types';

interface DashboardProps {
  items: StudyItem[];
  progress: { [id: string]: ProgressState };
  onStartStudy: (item: StudyItem) => void;
  onStartRandomSession: () => void;
  onStartSequentialStudy: (items: StudyItem[]) => void;
  onOpenManage: () => void;
  incorrectIds: string[];
  onRemoveFromIncorrect: (itemId: string) => void;
  onToggleIncorrect: (itemId: string) => void;
  // Folder actions & objects
  incorrectFolders: Array<{ id: string; name: string }>;
  folderMappings: { [folderId: string]: string[] };
  onAddFolder: (name: string, itemId?: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onToggleItemInFolder: (itemId: string, folderId: string) => void;
  // Exam stage configuration
  examStageMode: 'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY';
  onSetExamStageMode: (mode: 'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY') => void;
  // Verse stage configuration
  verseStageMode: 'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY';
  onSetVerseStageMode: (mode: 'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY') => void;
}

export default function Dashboard({
  items,
  progress,
  onStartStudy,
  onStartRandomSession,
  onStartSequentialStudy,
  onOpenManage,
  incorrectIds,
  onRemoveFromIncorrect,
  onToggleIncorrect,
  incorrectFolders,
  folderMappings,
  onAddFolder,
  onDeleteFolder,
  onRenameFolder,
  onToggleItemInFolder,
  examStageMode,
  onSetExamStageMode,
  verseStageMode,
  onSetVerseStageMode
}: DashboardProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VERSE' | 'EXAM' | 'CUSTOM' | 'INCORRECT'>('ALL');
  const [activePart, setActivePart] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState<string>('');
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);

  const getPartForExam = (item: StudyItem): number | null => {
    if (item.type !== ItemType.Exam) return null;
    const match = item.id.match(/^exam-(\d+)$/);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 10) return 1;
    if (num >= 11 && num <= 20) return 2;
    if (num >= 21 && num <= 30) return 3;
    if (num >= 31 && num <= 40) return 4;
    return null;
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'VERSE') return item.type === ItemType.Verse;
    if (activeFilter === 'EXAM') {
      if (item.type !== ItemType.Exam) return false;
      if (activePart === 'ALL') return true;
      return getPartForExam(item) === activePart;
    }
    if (activeFilter === 'CUSTOM') return item.type === ItemType.Custom;
    if (activeFilter === 'INCORRECT') {
      if (selectedFolderId === 'all') {
        return incorrectIds.includes(item.id);
      } else {
        const mappedList = folderMappings[selectedFolderId] || [];
        return mappedList.includes(item.id);
      }
    }
    return true;
  });

  // Calculate statistics
  const totalCards = items.length;
  const completedStats = items.reduce(
    (acc, cur) => {
      const p = progress[cur.id];
      const isExam = cur.type === ItemType.Exam;
      if (p) {
        if (isExam || p.stage1Completed) acc.stage1++;
        if (p.stage2Completed) acc.stage2++;
        if (p.stage3Completed) acc.stage3++;
        
        const fullyMastered = isExam
          ? (p.stage2Completed && p.stage3Completed)
          : (p.stage1Completed && p.stage2Completed && p.stage3Completed);

        if (fullyMastered) acc.fullyMastered++;
      }
      return acc;
    },
    { stage1: 0, stage2: 0, stage3: 0, fullyMastered: 0 }
  );

  const masteredPercentage = totalCards > 0 ? Math.round((completedStats.fullyMastered / totalCards) * 100) : 0;

  // Storing items by categories
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6" id="dashboard-workspace">
      {/* Welcome & Stats Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800 shadow-md relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-indigo-500/10 rounded-l-full blur-xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">핵심 성구 및 수료 종합 암기 학습기</h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-xl">
              단어 조합조립(1단계)부터 주요 단어 빈칸 넣기(2단계), 그리고 완벽하게 직접 받아 적는 전체 암기 쓰기(3단계)까지 단계별로 완벽하게 마스터해보세요.
            </p>
          </div>
          
          <div className="flex gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={onStartRandomSession}
              disabled={items.length === 0}
              className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-sm shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle className="w-4 h-4 text-indigo-600 animate-pulse" /> 랜덤 종합 평가 출제
            </button>
            <button
              onClick={onOpenManage}
              className="px-5 py-3 bg-indigo-600 border border-indigo-500 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> 내 문제 등록 관리
            </button>
          </div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 border-t border-slate-800 pt-6">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-xs block font-semibold mb-1">총 등록 카드 개수</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{totalCards}</span>
              <span className="text-slate-500 text-xs">개</span>
            </div>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-xs block font-semibold mb-1">완벽 마스터 카드</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-indigo-400">{completedStats.fullyMastered}</span>
              <span className="text-slate-500 text-xs">/ {totalCards}개</span>
            </div>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-xs block font-semibold mb-1">합계 마스터 성취율</span>
            <div className="w-full bg-slate-900 rounded-full h-2 mt-2 select-none overflow-hidden border border-slate-800">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${masteredPercentage}%` }} />
            </div>
            <span className="text-indigo-400 text-[11px] font-bold block mt-1">{masteredPercentage}% 완료</span>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 flex items-center gap-3">
            <Award className="w-8 h-8 text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">학습 등급</span>
              <span className="font-bold text-xs text-white">
                {masteredPercentage === 100 
                  ? '👑 만점 마스터 대왕' 
                  : masteredPercentage >= 80 
                    ? '🌟 정교한 수료 지망생' 
                    : masteredPercentage >= 50 
                      ? '📈 꾸준한 성실 수강생' 
                      : '🌱 열정 가득한 신입생'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col gap-6">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 max-w-full">
          <button
            onClick={() => { setActiveFilter('ALL'); setActivePart('ALL'); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
              activeFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
            }`}
          >
            전체 카드 ({items.length})
          </button>
          <button
            onClick={() => { setActiveFilter('VERSE'); setActivePart('ALL'); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
              activeFilter === 'VERSE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
            }`}
          >
            핵심 성구 ({items.filter(i => i.type === ItemType.Verse).length})
          </button>
          <button
            onClick={() => { setActiveFilter('EXAM'); setActivePart('ALL'); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
              activeFilter === 'EXAM'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
            }`}
          >
            기본 종합 시험지 ({items.filter(i => i.type === ItemType.Exam).length})
          </button>
          <button
            onClick={() => { setActiveFilter('CUSTOM'); setActivePart('ALL'); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
              activeFilter === 'CUSTOM'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
            }`}
          >
            내가 추가한 문제 ({items.filter(i => i.type === ItemType.Custom).length})
          </button>
          
          <button
            onClick={() => { setActiveFilter('INCORRECT'); setActivePart('ALL'); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeFilter === 'INCORRECT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50'
            }`}
          >
            <span>📌 오답 노트 ({incorrectIds.length})</span>
          </button>
        </div>

        {/* Verse Stage Selection Panel (Only when 'VERSE' filter is active) */}
        {activeFilter === 'VERSE' && (
          <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-150 p-5 rounded-2xl flex flex-col gap-4 shadow-3xs animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-indigo-900 flex items-center gap-1.5 leading-none">
                  📖 핵심 성구 학습 단계 설정
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  원하는 단계만 선택하여 집중 연습하거나 전체 단계를 순차적으로 학습할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const verseItems = items.filter(i => i.type === ItemType.Verse);
                    onStartSequentialStudy(verseItems);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" /> 전체 성구 순차 학습
                </button>
              </div>
            </div>

            <div className="bg-white border border-indigo-100/50 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
              <div className="text-left w-full sm:w-auto">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  ⚙️ 성구 학습 단계 설정
                </span>
                <p className="text-[11px] text-slate-650 mt-1 font-semibold">
                  원하는 단계를 선택하여 해당 단계만 집중 연습할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shadow-3xs border border-slate-250 self-end sm:self-auto">
                {(['ALL', 'STAGE1_ONLY', 'STAGE2_ONLY', 'STAGE3_ONLY'] as const).map((mode) => {
                  const isSelected = verseStageMode === mode;
                  const label = mode === 'ALL'
                    ? '전체 단계'
                    : mode === 'STAGE1_ONLY'
                      ? '1단계 (단어선택)'
                      : mode === 'STAGE2_ONLY'
                        ? '2단계 (단어조합)'
                        : '3단계 (백지쓰기)';
                  return (
                    <button
                      key={mode}
                      onClick={() => onSetVerseStageMode(mode)}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-extrabold cursor-pointer transition-all whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Exam Part Selection Panel (Only when 'EXAM' filter is active) */}
        {activeFilter === 'EXAM' && (
          <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-150 p-5 rounded-2xl flex flex-col gap-4 shadow-3xs animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-indigo-900 flex items-center gap-1.5 leading-none">
                  📖 기본 종합 시험지 파트 분할 모의테스트
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  종합 문제를 10문항씩 단계별로 학습하거나 해당 범위의 모든 문항을 연속 순차 평가로 응시할 수 있습니다.
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const examItems = items.filter(i => i.type === ItemType.Exam).sort((a,b) => {
                      const aN = parseInt(a.id.replace('exam-', ''), 10) || 0;
                      const bN = parseInt(b.id.replace('exam-', ''), 10) || 0;
                      return aN - bN;
                    });
                    onStartSequentialStudy(examItems);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" /> 1-40번 전체 순차 풀기
                </button>
              </div>
            </div>

            {/* Exam Stage Selection Selector strip */}
            <div className="bg-white border border-indigo-100/50 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
              <div className="text-left w-full sm:w-auto">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  ⚙️ 종합 시험 출제 단계 범위 설정
                </span>
                <p className="text-[11px] text-slate-650 mt-1 font-semibold">
                  시험 가동 시 원하는 평가 단계만 선택하여 공부하거나 두 단계를 순차적으로 응시할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shadow-3xs border border-slate-250 self-end sm:self-auto">
                {(['BOTH', 'STAGE1_ONLY', 'STAGE2_ONLY'] as const).map((mode) => {
                  const isSelected = examStageMode === mode;
                  const label = mode === 'BOTH'
                    ? '1&2단계 둘다'
                    : mode === 'STAGE1_ONLY'
                      ? '1단계 만 (빈칸 채우기)'
                      : '2단계 만 (백지 암송)';
                  return (
                    <button
                      key={mode}
                      onClick={() => onSetExamStageMode(mode)}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-extrabold cursor-pointer transition-all whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part Selection subtab pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {(['ALL', 1, 2, 3, 4] as const).map((part) => {
                const isSelected = activePart === part;
                const partLabel = part === 'ALL'
                  ? '전체 문제 (1~40)'
                  : `Part ${part} (${(part - 1) * 10 + 1}~${part * 10}번)`;

                // Calculate complete progress of this part
                const partItems = items.filter(item => {
                  if (item.type !== ItemType.Exam) return false;
                  if (part === 'ALL') return true;
                  return getPartForExam(item) === part;
                });
                const masteredCount = partItems.filter(item => {
                  const p = progress[item.id];
                  return p && p.stage2Completed && p.stage3Completed;
                }).length;

                return (
                  <button
                    key={part}
                    onClick={() => setActivePart(part)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <span>{partLabel}</span>
                    <span className={`text-[10px] px-1 rounded-sm ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                      {masteredCount}/{partItems.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Secondary actions container for the active part */}
            {activePart !== 'ALL' && (
              <div className="bg-white border border-indigo-100/50 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-sm">
                    Part {activePart} 전용 모의수련
                  </span>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    해당 파트의 10문항을 <b>순차 평가 모드</b>로 진입하여 한 문제도 빠짐없이 차례대로 암송 수련 할 수 있습니다.
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      const partItems = items
                        .filter(item => item.type === ItemType.Exam && getPartForExam(item) === activePart)
                        .sort((a,b) => {
                          const aN = parseInt(a.id.replace('exam-', ''), 10) || 0;
                          const bN = parseInt(b.id.replace('exam-', ''), 10) || 0;
                          return aN - bN;
                        });
                      onStartSequentialStudy(partItems);
                    }}
                    className="flex-1 md:flex-initial bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    🔁 Part {activePart} 순차적으로 시험 보기
                  </button>
                </div>
              </div>
            )}
            
            {activePart === 'ALL' && (
              <p className="text-[11px] text-indigo-500 font-bold">
                💡 위에서 특정 파트를 선택하시면 해당 범위의 문항수련 및 연속 순차 시험을 치룰 수 있습니다.
              </p>
            )}
          </div>
        )}

        {/* Incorrect Folders Selection Panel (Only when 'INCORRECT' filter is active) */}
        {activeFilter === 'INCORRECT' && (
          <div className="bg-gradient-to-br from-rose-50/10 to-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 shadow-3xs animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 leading-none">
                  📁 오답 노트 내 세부 문제 목록 (폴더 분류)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  원하는 분류 목록별로 오답 카드를 따로 모아두고 선별적으로 집중 암송 수련할 수 있습니다.
                </p>
              </div>

              {/* Add folder inline UI */}
              <div className="flex items-center gap-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('newFolderName') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val) {
                      onAddFolder(val);
                      input.value = '';
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    name="newFolderName"
                    placeholder="새 리스트 이름..."
                    className="placeholder-slate-400 text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-rose-500 bg-white min-w-[150px] font-semibold text-slate-750"
                  />
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> 추가
                  </button>
                </form>
              </div>
            </div>

            {/* Folder Selection Pills with edit/delete icons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {/* 'all' virtual folder */}
              <button
                onClick={() => setSelectedFolderId('all')}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                  selectedFolderId === 'all'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                <span>전체 오답 모음 {selectedFolderId === 'all' ? '✓' : ''}</span>
                <span className={`text-[10px] px-1 rounded-sm ${selectedFolderId === 'all' ? 'bg-rose-700 text-rose-100' : 'bg-slate-105 text-slate-500'}`}>
                  {incorrectIds.length}
                </span>
              </button>

              {incorrectFolders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;
                const folderItems = folderMappings[folder.id] || [];
                const isRenaming = renamingFolderId === folder.id;

                return (
                  <div
                    key={folder.id}
                    className={`flex items-center rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-3xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isRenaming ? (
                      <div className="flex items-center gap-1 p-1">
                        <input
                          type="text"
                          value={renamingFolderName}
                          onChange={(e) => setRenamingFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onRenameFolder(folder.id, renamingFolderName);
                              setRenamingFolderId(null);
                            } else if (e.key === 'Escape') {
                              setRenamingFolderId(null);
                            }
                          }}
                          className="text-xs font-semibold px-2 py-0.5 border border-rose-400 bg-white text-slate-800 rounded focus:outline-hidden"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameFolder(folder.id, renamingFolderName);
                            setRenamingFolderId(null);
                          }}
                          className="p-1 text-emerald-600 hover:text-emerald-800 font-extrabold text-xs cursor-pointer"
                          title="저장"
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFolderId(null);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 font-extrabold text-xs cursor-pointer"
                          title="취소"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center p-0.5">
                        <button
                          onClick={() => setSelectedFolderId(folder.id)}
                          className="px-2.5 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1.5 text-inherit"
                        >
                          <Folder className="w-3.5 h-3.5 shrink-0" />
                          <span>{folder.name}</span>
                          <span className={`text-[10px] px-1 rounded-sm ${isSelected ? 'bg-rose-200/80 text-rose-900' : 'bg-slate-105 text-slate-500'}`}>
                            {folderItems.length}
                          </span>
                        </button>

                        {/* Edit/Delete controls (Don't allow delete default) */}
                        <div className="flex items-center gap-0.5 pr-1.5 pl-0.5 border-l border-slate-100 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingFolderId(folder.id);
                              setRenamingFolderName(folder.name);
                            }}
                            className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-sm cursor-pointer"
                            title="수정"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {folder.id !== 'default' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`'${folder.name}' 오답 폴더를 삭제하시겠습니까? (폴더 내용만 삭제되며 카드는 영구 소멸되지 않습니다)`)) {
                                  onDeleteFolder(folder.id);
                                  if (selectedFolderId === folder.id) {
                                    setSelectedFolderId('all');
                                  }
                                }
                              }}
                              className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors rounded-sm cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Folder continuous study review */}
            {selectedFolderId !== 'all' && (folderMappings[selectedFolderId] || []).length > 0 && (
              <div className="bg-white border border-rose-100/50 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded-sm">
                    {incorrectFolders.find(f => f.id === selectedFolderId)?.name || '선택 오답군'} 집중 수련
                  </span>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    해당 분류에 등록된 <b>{(folderMappings[selectedFolderId] || []).length}개의 오답 카드</b>들을 완주 순차 모드로 복습하여 확실하게 극복할 수 있습니다.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const folderItemIds = folderMappings[selectedFolderId] || [];
                    const folderItems = items.filter(i => folderItemIds.includes(i.id));
                    onStartSequentialStudy(folderItems);
                  }}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all cursor-pointer w-full md:w-auto text-center"
                >
                  🔁 {incorrectFolders.find(f => f.id === selectedFolderId)?.name || '이 폴더'} 오답 연달아 평가 시작
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="questions-grid-view">
          {filteredItems.length === 0 ? (
            <div className="col-span-full bg-slate-50 border border-slate-200 rounded-2xl py-14 px-4 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 m-auto mb-2" />
              <p className="text-slate-500 font-medium">검색에 부합하는 카드가 존재하지 않습니다.</p>
              <p className="text-slate-400 text-xs mt-1">내가 추가한 문제 탭이라면 우측 상단 '내 문제 등록 관리'를 이용해 카드를 채워놓으세요.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const p = progress[item.id] || {
                itemId: item.id,
                stage1Completed: false,
                stage2Completed: false,
                stage3Completed: false,
                attempts: 0,
                lastStudiedAt: ''
              };

              const isExam = item.type === ItemType.Exam;
              const fullyMastered = isExam
                ? p.stage2Completed && p.stage3Completed
                : p.stage1Completed && p.stage2Completed && p.stage3Completed;

              return (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-5 hover:shadow-xs transition-all flex flex-col justify-between ${
                    fullyMastered 
                      ? 'bg-indigo-50/15 border-indigo-200/80 shadow-3xs' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-md">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-1.5 pr-0.5">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFolderMenuId(activeFolderMenuId === item.id ? null : item.id);
                            }}
                            className={`text-[10px] font-extrabold px-2 py-1 rounded-md flex items-center gap-0.5 transition-colors cursor-pointer border ${
                              incorrectIds.includes(item.id)
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                            title="오답 분류 리스트에 저장하기"
                          >
                            📌 {incorrectIds.includes(item.id) ? `오답 분류됨 (${incorrectFolders.filter(f => folderMappings[f.id]?.includes(item.id)).length})` : '오답 추가'}
                          </button>

                          {/* Folders overlay dropdown */}
                          {activeFolderMenuId === item.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveFolderMenuId(null); }} />
                              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-40 text-left animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-slate-400" /> 오답 보관 폴더 지정
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveFolderMenuId(null); }}
                                    className="text-slate-400 hover:text-slate-600 text-[10px] font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                
                                <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                                  {incorrectFolders.map((folder) => {
                                    const isInFolder = folderMappings[folder.id]?.includes(item.id) || false;
                                    return (
                                      <label
                                        key={folder.id}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-700"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isInFolder}
                                          onChange={() => onToggleItemInFolder(item.id, folder.id)}
                                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-400 cursor-pointer"
                                        />
                                        <span className="truncate max-w-[170px]" title={folder.name}>
                                          {folder.name}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>

                                <div className="border-t border-slate-100 pt-2 mt-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    placeholder="새 리스트 추가..."
                                    id={`card-new-folder-input-${item.id}`}
                                    className="placeholder-slate-400 text-[10px] w-full px-2 py-1 rounded-md border border-slate-205 focus:outline-hidden text-slate-700 font-semibold bg-slate-50"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const inp = e.currentTarget;
                                        const val = inp.value.trim();
                                        if (val) {
                                          onAddFolder(val, item.id);
                                          inp.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const inp = document.getElementById(`card-new-folder-input-${item.id}`) as HTMLInputElement;
                                      const val = inp?.value?.trim();
                                      if (val) {
                                        onAddFolder(val, item.id);
                                        inp.value = '';
                                      }
                                    }}
                                    className="text-[9px] bg-slate-850 hover:bg-slate-950 text-white px-2.5 py-1 rounded-md font-bold whitespace-nowrap cursor-pointer shrink-0"
                                  >
                                    생성
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {fullyMastered && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-100">
                            <Check className="w-3 h-3 text-emerald-600" /> 마스터 완료
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">{item.keyword}</h3>
                    <p className="text-slate-600 text-sm mt-1.5 line-clamp-2 leading-relaxed">{item.question}</p>
                    
                    {/* Tiny Answer preview */}
                    <p className="text-xs text-slate-400 mt-2 italic whitespace-normal line-clamp-1">
                      모범답안: {item.fullAnswer}
                    </p>
                  </div>

                  {/* Progressive Stage indicators and play action */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    {/* 3 stages status dots / 2 stages for EXAM */}
                    {isExam ? (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${p.stage2Completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-300'}`}>
                            {p.stage2Completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">1단계(빈칸)</span>
                        </div>
                        <div className="w-4 h-[1px] bg-slate-200 mb-2" />
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${p.stage3Completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-300'}`}>
                            {p.stage3Completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">2단계(쓰기)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${p.stage1Completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-300'}`}>
                            {p.stage1Completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">1단계(단어선택)</span>
                        </div>
                        <div className="w-2 h-[1px] bg-slate-200 mb-2" />
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${p.stage2Completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-300'}`}>
                            {p.stage2Completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">2단계(단어조합)</span>
                        </div>
                        <div className="w-2 h-[1px] bg-slate-200 mb-2" />
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${p.stage3Completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-300'}`}>
                            {p.stage3Completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">3단계(백지쓰기)</span>
                        </div>
                      </div>
                    )}

                    {/* Learn action */}
                    <button
                      onClick={() => onStartStudy(item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xs ${
                        fullyMastered
                          ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {fullyMastered ? '복습하기' : '학습 시작하기'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
