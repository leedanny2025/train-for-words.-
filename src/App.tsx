import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Award, CheckCircle, Sparkles, RefreshCcw, Landmark, ListTodo, Bookmark, Settings, ArrowLeft, Trophy, ChevronRight } from 'lucide-react';

import { StudyItem, ProgressState, ItemType, StudyStage } from './types';
import { defaultQuestions } from './data/defaultQuestions';
import Dashboard from './components/Dashboard';
import WordOrderStage from './components/WordOrderStage';
import FillBlankStage from './components/FillBlankStage';
import FullWriteStage from './components/FullWriteStage';
import QuestionManage from './components/QuestionManage';

export default function App() {
  // State management
  const [allItems, setAllItems] = useState<StudyItem[]>([]);
  const [customItems, setCustomItems] = useState<StudyItem[]>([]);
  const [progress, setProgress] = useState<{ [id: string]: ProgressState }>({});
  const [incorrectIds, setIncorrectIds] = useState<string[]>([]);
  
  // Custom Incorrect Note Folders State
  const [incorrectFolders, setIncorrectFolders] = useState<Array<{ id: string; name: string }>>(() => {
    const saved = localStorage.getItem('memorization_study_incorrect_folders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [{ id: 'default', name: '기본 오답 폴더' }];
  });

  const [folderMappings, setFolderMappings] = useState<{ [folderId: string]: string[] }>(() => {
    const saved = localStorage.getItem('memorization_study_folder_mappings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Migration helper: check if old flat list exists
    const savedFlat = localStorage.getItem('memorization_study_incorrect_ids');
    if (savedFlat) {
      try {
        const ids = JSON.parse(savedFlat);
        if (Array.isArray(ids)) {
          return { default: ids };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return { default: [] };
  });
  
  // App routing
  const [currentStage, setCurrentStage] = useState<StudyStage | 'MANAGE'>('DASHBOARD');
  const [currentItem, setCurrentItem] = useState<StudyItem | null>(null);
  
  // Session results
  const [stageThreeScore, setStageThreeScore] = useState<number>(0);

  // Multi-question sequence states
  const [sessionQueue, setSessionQueue] = useState<StudyItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);

  // Exam study configuration (STAGE1_ONLY, STAGE2_ONLY, or BOTH)
  const [examStageMode, setExamStageMode] = useState<'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY'>(() => {
    const saved = localStorage.getItem('memorization_study_exam_stage_mode');
    return (saved as 'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY') || 'BOTH';
  });

  const handleSetExamStageMode = (mode: 'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY') => {
    setExamStageMode(mode);
    localStorage.setItem('memorization_study_exam_stage_mode', mode);
  };

  // Verse study configuration (ALL, STAGE1_ONLY, STAGE2_ONLY, STAGE3_ONLY)
  const [verseStageMode, setVerseStageMode] = useState<'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY'>(() => {
    const saved = localStorage.getItem('memorization_study_verse_stage_mode');
    return (saved as 'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY') || 'ALL';
  });

  const handleSetVerseStageMode = (mode: 'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY') => {
    setVerseStageMode(mode);
    localStorage.setItem('memorization_study_verse_stage_mode', mode);
  };

  // Load custom questions and progress from LocalStorage on startup
  useEffect(() => {
    // 1. Progress State loading
    const savedProgress = localStorage.getItem('memorization_study_progress');
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error('Failed to parse progress data:', e);
      }
    }

    // Sync flat incorrectIds initially from folder mappings
    const savedMappingsStr = localStorage.getItem('memorization_study_folder_mappings');
    if (savedMappingsStr) {
      try {
        const mappings = JSON.parse(savedMappingsStr);
        const flat = Array.from(new Set(Object.values(mappings).flat() as string[]));
        setIncorrectIds(flat);
      } catch (e) {
        const savedIncorrect = localStorage.getItem('memorization_study_incorrect_ids');
        if (savedIncorrect) {
          try { setIncorrectIds(JSON.parse(savedIncorrect)); } catch (_) {}
        }
      }
    } else {
      const savedIncorrect = localStorage.getItem('memorization_study_incorrect_ids');
      if (savedIncorrect) {
        try {
          const ids = JSON.parse(savedIncorrect);
          setIncorrectIds(ids);
          setFolderMappings({ default: ids });
          localStorage.setItem('memorization_study_folder_mappings', JSON.stringify({ default: ids }));
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 2. Custom Q&A loading
    const savedCustom = localStorage.getItem('memorization_study_custom_items');
    let loadedCustom: StudyItem[] = [];
    if (savedCustom) {
      try {
        loadedCustom = JSON.parse(savedCustom);
        setCustomItems(loadedCustom);
      } catch (e) {
        console.error('Failed to parse custom items:', e);
      }
    }

    // Merge default preset list with personalized questions
    setAllItems([...defaultQuestions, ...loadedCustom]);
  }, []);

  // Save progress and list changes
  const saveProgressToStorage = (updatedProgress: { [id: string]: ProgressState }) => {
    setProgress(updatedProgress);
    localStorage.setItem('memorization_study_progress', JSON.stringify(updatedProgress));
  };

  const handleIncorrect = (itemId: string) => {
    // Add to default folder automatically
    setFolderMappings((prev) => {
      const current = prev['default'] || [];
      if (current.includes(itemId)) return prev;
      const updated = {
        ...prev,
        default: [...current, itemId]
      };
      localStorage.setItem('memorization_study_folder_mappings', JSON.stringify(updated));
      
      const flat = Array.from(new Set(Object.values(updated).flat()));
      setIncorrectIds(flat);
      localStorage.setItem('memorization_study_incorrect_ids', JSON.stringify(flat));
      return updated;
    });
  };

  const handleCorrect = (itemId: string) => {
    // Remove from ALL incorrect folders
    setFolderMappings((prev) => {
      const updated: { [key: string]: string[] } = {};
      Object.keys(prev).forEach((fId) => {
         updated[fId] = (prev[fId] || []).filter((id) => id !== itemId);
      });
      localStorage.setItem('memorization_study_folder_mappings', JSON.stringify(updated));
      
      const flat = Array.from(new Set(Object.values(updated).flat()));
      setIncorrectIds(flat);
      localStorage.setItem('memorization_study_incorrect_ids', JSON.stringify(flat));
      return updated;
    });
  };

  const handleAddFolder = (name: string, itemId?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newId = `folder-${Date.now()}`;
    const newFolder = { id: newId, name: trimmed };
    
    setIncorrectFolders((prev) => {
      const updated = [...prev, newFolder];
      localStorage.setItem('memorization_study_incorrect_folders', JSON.stringify(updated));
      return updated;
    });
    
    setFolderMappings((prev) => {
      const updated = { ...prev, [newId]: itemId ? [itemId] : [] };
      localStorage.setItem('memorization_study_folder_mappings', JSON.stringify(updated));
      
      const flat = Array.from(new Set(Object.values(updated).flat()));
      setIncorrectIds(flat);
      localStorage.setItem('memorization_study_incorrect_ids', JSON.stringify(flat));
      return updated;
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    if (folderId === 'default') return;
    
    setIncorrectFolders((prev) => {
      const updated = prev.filter((f) => f.id !== folderId);
      localStorage.setItem('memorization_study_incorrect_folders', JSON.stringify(updated));
      return updated;
    });

    setFolderMappings((prev) => {
      const updated = { ...prev };
      delete updated[folderId];
      localStorage.setItem('memorization_study_folder_mappings', JSON.stringify(updated));
      
      const flat = Array.from(new Set(Object.values(updated).flat()));
      setIncorrectIds(flat);
      localStorage.setItem('memorization_study_incorrect_ids', JSON.stringify(flat));
      return updated;
    });
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    
    setIncorrectFolders((prev) => {
      const updated = prev.map((f) => f.id === folderId ? { ...f, name: trimmed } : f);
      localStorage.setItem('memorization_study_incorrect_folders', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleItemInFolder = (itemId: string, folderId: string) => {
    setFolderMappings((prev) => {
      const folderItems = prev[folderId] || [];
      const updatedItems = folderItems.includes(itemId)
        ? folderItems.filter((id) => id !== itemId)
        : [...folderItems, itemId];
        
      const updated = {
        ...prev,
        [folderId]: updatedItems
      };
      
      localStorage.setItem('memorization_study_folder_mappings', JSON.stringify(updated));
      
      const flat = Array.from(new Set(Object.values(updated).flat()));
      setIncorrectIds(flat);
      localStorage.setItem('memorization_study_incorrect_ids', JSON.stringify(flat));
      return updated;
    });
  };

  const handleAddCustomItem = (newItem: StudyItem) => {
    const updatedCustom = [...customItems, newItem];
    setCustomItems(updatedCustom);
    localStorage.setItem('memorization_study_custom_items', JSON.stringify(updatedCustom));
    setAllItems([...defaultQuestions, ...updatedCustom]);
  };

  const handleDeleteCustomItem = (id: string) => {
    const updatedCustom = customItems.filter(item => item.id !== id);
    setCustomItems(updatedCustom);
    localStorage.setItem('memorization_study_custom_items', JSON.stringify(updatedCustom));
    setAllItems([...defaultQuestions, ...updatedCustom]);

    // Also purge progress of containing item
    const updatedProgress = { ...progress };
    delete updatedProgress[id];
    saveProgressToStorage(updatedProgress);
  };

  const getStartingStage = (item: StudyItem): 'STAGE1' | 'STAGE2' | 'STAGE3' => {
    if (item.type === ItemType.Exam) {
      return examStageMode === 'STAGE2_ONLY' ? 'STAGE3' : 'STAGE2';
    }
    if (verseStageMode === 'STAGE2_ONLY') return 'STAGE2';
    if (verseStageMode === 'STAGE3_ONLY') return 'STAGE3';
    return 'STAGE1';
  };

  // Launch a standard learning session for a card
  const handleStartStudy = (item: StudyItem) => {
    setCurrentItem(item);
    setCurrentStage(getStartingStage(item));
  };

  // Select a random card to study
  const handleStartRandomSession = () => {
    if (allItems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allItems.length);
    const randomItem = allItems[randomIndex];
    handleStartStudy(randomItem);
  };

  const handleStartSequentialStudy = (items: StudyItem[]) => {
    if (items.length === 0) return;
    setSessionQueue(items);
    setCurrentQueueIndex(0);
    setCurrentItem(items[0]);
    setCurrentStage(getStartingStage(items[0]));
  };

  const handleToggleIncorrect = (itemId: string) => {
    setIncorrectIds((prev) => {
      const isExist = prev.includes(itemId);
      const updated = isExist ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      localStorage.setItem('memorization_study_incorrect_ids', JSON.stringify(updated));
      return updated;
    });
  };

  // Update progress for Stage 1
  const handleStage1Complete = () => {
    if (!currentItem) return;
    const existing = progress[currentItem.id] || {
      itemId: currentItem.id,
      stage1Completed: false,
      stage2Completed: false,
      stage3Completed: false,
      attempts: 0,
      lastStudiedAt: ''
    };

    const updated = {
      ...progress,
      [currentItem.id]: {
        ...existing,
        stage1Completed: true,
        attempts: existing.attempts + 1,
        lastStudiedAt: new Date().toISOString()
      }
    };

    if (verseStageMode === 'STAGE1_ONLY' && currentItem.type !== ItemType.Exam) {
      setStageThreeScore(100);
      handleCorrect(currentItem.id);
      saveProgressToStorage({ ...updated, [currentItem.id]: { ...updated[currentItem.id], stage3Completed: true } });
      setCurrentStage('SUMMARY');
    } else {
      saveProgressToStorage(updated);
      setCurrentStage('STAGE2');
    }
  };

  // Update progress for Stage 2
  const handleStage2Complete = () => {
    if (!currentItem) return;
    const isExam = currentItem.type === ItemType.Exam;
    const existing = progress[currentItem.id] || {
      itemId: currentItem.id,
      stage1Completed: isExam ? true : false,
      stage2Completed: false,
      stage3Completed: false,
      attempts: 0,
      lastStudiedAt: ''
    };

    const updated = {
      ...progress,
      [currentItem.id]: {
        ...existing,
        stage1Completed: isExam ? true : existing.stage1Completed,
        stage2Completed: true,
        attempts: isExam ? existing.attempts + 1 : existing.attempts,
        lastStudiedAt: new Date().toISOString()
      }
    };
    saveProgressToStorage(updated);
    
    if ((isExam && examStageMode === 'STAGE1_ONLY') || (!isExam && verseStageMode === 'STAGE2_ONLY')) {
      setStageThreeScore(100);
      handleCorrect(currentItem.id);
      const fullyUpdated = {
        ...updated,
        [currentItem.id]: {
          ...updated[currentItem.id],
          stage3Completed: true
        }
      };
      saveProgressToStorage(fullyUpdated);
      setCurrentStage('SUMMARY');
    } else {
      setCurrentStage('STAGE3');
    }
  };

  // Update progress for Stage 3 & terminate
  const handleStage3Complete = (score: number) => {
    if (!currentItem) return;
    setStageThreeScore(score);

    // If score passes correctness check (e.g. over 85), mark stage 3 completed!
    const passed = score >= 85;
    const isExam = currentItem.type === ItemType.Exam;

    if (passed) {
      handleCorrect(currentItem.id);
    } else {
      handleIncorrect(currentItem.id);
    }

    const existing = progress[currentItem.id] || {
      itemId: currentItem.id,
      stage1Completed: isExam ? true : false,
      stage2Completed: isExam ? true : false,
      stage3Completed: false,
      attempts: 0,
      lastStudiedAt: ''
    };

    const updated = {
      ...progress,
      [currentItem.id]: {
        ...existing,
        stage1Completed: isExam ? true : existing.stage1Completed,
        stage2Completed: isExam ? true : existing.stage2Completed,
        stage3Completed: passed ? true : existing.stage3Completed,
        lastStudiedAt: new Date().toISOString()
      }
    };
    saveProgressToStorage(updated);
    setCurrentStage('SUMMARY');
  };

  // Reset progress data
  const handleResetAllProgress = () => {
    if (window.confirm('정말 모든 암기 진도 데이터를 초기화하고 다시 시작하시겠습니까?')) {
      setProgress({});
      localStorage.removeItem('memorization_study_progress');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="applet-main-canvas">
      {/* Absolute top navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-800 tracking-tight block">시온 학습 Pro</span>
              <span className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 animate-spin text-indigo-500" /> 학습 분석 기반 단계별 암기 솔루션
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentStage !== 'DASHBOARD' && (
              <button
                onClick={() => {
                  setCurrentStage('DASHBOARD');
                  setCurrentItem(null);
                  setSessionQueue([]);
                  setCurrentQueueIndex(-1);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors font-bold border border-slate-200 hover:border-indigo-100 rounded-xl px-3 py-1.5 bg-white shadow-3xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> 대시보드 복귀
              </button>
            )}

            <button
              onClick={handleResetAllProgress}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors border border-slate-200 hover:border-rose-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1 cursor-pointer"
              title="주의: 모든 암기율 통계가 0%로 초기화됩니다."
            >
              <RefreshCcw className="w-3 h-3" /> 전체 진도 초기화
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col py-8 px-4 relative max-w-6xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {currentStage === 'DASHBOARD' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard
                items={allItems}
                progress={progress}
                onStartStudy={handleStartStudy}
                onStartRandomSession={handleStartRandomSession}
                onStartSequentialStudy={handleStartSequentialStudy}
                onOpenManage={() => setCurrentStage('MANAGE')}
                incorrectIds={incorrectIds}
                onRemoveFromIncorrect={handleCorrect}
                onToggleIncorrect={handleToggleIncorrect}
                incorrectFolders={incorrectFolders}
                folderMappings={folderMappings}
                onAddFolder={handleAddFolder}
                onDeleteFolder={handleDeleteFolder}
                onRenameFolder={handleRenameFolder}
                onToggleItemInFolder={handleToggleItemInFolder}
                examStageMode={examStageMode}
                onSetExamStageMode={handleSetExamStageMode}
                verseStageMode={verseStageMode}
                onSetVerseStageMode={handleSetVerseStageMode}
              />
            </motion.div>
          )}

          {['STAGE1', 'STAGE2', 'STAGE3'].includes(currentStage) && currentItem && (
            <motion.div
              key="stage-wrapper"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row gap-6 w-full"
            >
              {/* Sidebar: Progress & Stages */}
              <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
                {/* 1. 학습 진행 단계 */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-800">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    학습 진행 단계
                  </h2>
                  <div className="space-y-3">
                    {/* Step 1 */}
                    {currentItem.type !== ItemType.Exam && (
                      <div className={`p-4 rounded-xl border transition-all ${
                        currentStage === 'STAGE1' 
                          ? 'border-2 border-indigo-500 bg-indigo-50/50 shadow-sm' 
                          : 'border-slate-200 bg-slate-50/50 opacity-70'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold ${currentStage === 'STAGE1' ? 'text-indigo-600' : 'text-slate-400'} uppercase`}>Step 01</span>
                          {currentStage === 'STAGE1' ? (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full">진행 중</span>
                          ) : (
                            <span className="text-[9px] font-semibold text-emerald-600">완료</span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          {currentItem.type === ItemType.Verse ? '핵심 단어 선택' : '단어 조합 순서 구성'}
                        </p>
                        {currentStage === 'STAGE1' && (
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                            {currentItem.type === ItemType.Verse 
                              ? '성구 속 알맞은 단어(핵심 단어)를 선택박스를 통해 빈칸에 알맞게 기입해 채웁니다.' 
                              : '문장 어순과 뼈대를 조합하여 기억해 봅니다.'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Step 2 */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      currentStage === 'STAGE2' 
                        ? 'border-2 border-indigo-500 bg-indigo-50/50 shadow-sm' 
                        : ['STAGE3'].includes(currentStage)
                          ? 'border-indigo-100 bg-slate-50/50 opacity-75'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold ${currentStage === 'STAGE2' ? 'text-indigo-600' : 'text-slate-400'} uppercase`}>
                          {currentItem.type === ItemType.Exam ? 'Step 01' : 'Step 02'}
                        </span>
                        {currentStage === 'STAGE2' ? (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full">진행 중</span>
                        ) : ['STAGE3'].includes(currentStage) ? (
                          <span className="text-[9px] font-semibold text-emerald-600">완료</span>
                        ) : (
                          <span className="text-slate-400 text-[9px] font-medium">대기</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {currentItem.type === ItemType.Verse ? '단어 조합하기' : '주요 구절 빈칸 채우기'}
                      </p>
                      {currentStage === 'STAGE2' && (
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          {currentItem.type === ItemType.Verse
                            ? '분절된 구절 단어 뭉치들을 정확한 성경 원문 순서대로 정렬해 하나의 문장으로 완성합니다.'
                            : currentItem.type === ItemType.Exam
                              ? '기출 문항의 모범 답안 중 핵심 핵심 단어를 추론하여 정밀하게 골라 넣습니다.'
                              : '세부적인 구문과 빈칸을 연결하여 외워 봅니다.'}
                        </p>
                      )}
                    </div>

                    {/* Step 3 */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      currentStage === 'STAGE3' 
                        ? 'border-2 border-indigo-500 bg-indigo-50/50 shadow-sm' 
                        : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold ${currentStage === 'STAGE3' ? 'text-indigo-600' : 'text-slate-400'} uppercase`}>
                          {currentItem.type === ItemType.Exam ? 'Step 02' : 'Step 03'}
                        </span>
                        {currentStage === 'STAGE3' ? (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full">진행 중</span>
                        ) : (
                          <span className="text-slate-400 text-[9px] font-medium">대기</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {currentItem.type === ItemType.Verse ? '(아무것도 없이) 쓰기' : '전체 원문 백지 암송'}
                      </p>
                      {currentStage === 'STAGE3' && (
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          {currentItem.type === ItemType.Verse
                            ? '어떠한 실시간 문자 힌트나 단서 없이 완전한 백지에 완벽하게 원문을 통암기하여 기입합니다.'
                            : '도움 없이 전체 성구나 핵심 문장을 통암기해 입력합니다.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. 오늘의 학습 통계 */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex-1">
                  <h2 className="text-sm font-bold mb-4 text-slate-800">나의 암기 분석표</h2>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[9px] text-slate-500 uppercase font-bold">전체 마스터율</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {allItems.length > 0
                          ? `${Math.round((allItems.filter(item => {
                              const p = progress[item.id];
                              if (!p) return false;
                              return item.type === ItemType.Exam
                                ? (p.stage2Completed && p.stage3Completed)
                                : (p.stage1Completed && p.stage2Completed && p.stage3Completed);
                            }).length / allItems.length) * 100)}%`
                          : '0%'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[9px] text-slate-500 uppercase font-bold font-mono">총도전</p>
                      <p className="text-base font-bold text-slate-700">
                        {(Object.values(progress) as ProgressState[]).reduce((acc, c) => acc + (c.attempts || 0), 0)}회
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">현재 공부 구절</p>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{currentItem.keyword}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{currentItem.question}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 mt-3 flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-slate-500">실시간 피드백 검증 모드</span>
                  </div>
                </div>
              </aside>

              {/* Main Exercise Area */}
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-2 sm:p-5 shadow-xs">
                {currentStage === 'STAGE1' && (
                  currentItem.type === ItemType.Verse ? (
                    <FillBlankStage
                      item={currentItem}
                      onNextStage={handleStage1Complete}
                      onExit={() => { setCurrentStage('DASHBOARD'); setCurrentItem(null); }}
                      stageIndex={1}
                      onIncorrect={handleIncorrect}
                    />
                  ) : (
                    <WordOrderStage
                      item={currentItem}
                      onNextStage={handleStage1Complete}
                      onExit={() => { setCurrentStage('DASHBOARD'); setCurrentItem(null); }}
                      stageIndex={1}
                      onIncorrect={handleIncorrect}
                    />
                  )
                )}
                {currentStage === 'STAGE2' && (
                  currentItem.type === ItemType.Verse ? (
                    <WordOrderStage
                      item={currentItem}
                      onNextStage={handleStage2Complete}
                      onExit={() => { setCurrentStage('DASHBOARD'); setCurrentItem(null); }}
                      stageIndex={2}
                      onIncorrect={handleIncorrect}
                    />
                  ) : (
                    <FillBlankStage
                      item={currentItem}
                      onNextStage={handleStage2Complete}
                      onExit={() => { setCurrentStage('DASHBOARD'); setCurrentItem(null); }}
                      stageIndex={2}
                      onIncorrect={handleIncorrect}
                    />
                  )
                )}
                {currentStage === 'STAGE3' && (
                  <FullWriteStage
                    item={currentItem}
                    onCompleted={handleStage3Complete}
                    onExit={() => { setCurrentStage('DASHBOARD'); setCurrentItem(null); }}
                    onIncorrect={handleIncorrect}
                  />
                )}
              </div>
            </motion.div>
          )}

          {currentStage === 'SUMMARY' && currentItem && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mx-auto"
            >
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center max-w-xl mx-auto flex flex-col items-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200 mb-6">
                  <Trophy className="w-8 h-8 text-amber-500" />
                </div>
                
                <span className="text-indigo-700 font-extrabold text-xs uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 animate-pulse">
                  성구 및 암송 카드 완벽 마스터!
                </span>
                
                <h2 className="text-2xl font-extrabold text-slate-800 mt-3 leading-tight">{currentItem.keyword}</h2>
                <p className="text-slate-500 text-sm mt-1.5">{currentItem.category}</p>

                <div className="my-6 p-5 bg-slate-50 border border-slate-200/60 rounded-2xl w-full text-left">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">기억해낸 원문</h3>
                  <p className="text-slate-700 text-sm font-medium leading-relaxed mb-4 italic">
                    "{currentItem.question}"
                  </p>
                  <div className="h-[1px] bg-slate-200/60 my-3" />
                  <p className="text-slate-800 text-base font-extrabold leading-relaxed text-indigo-900">
                    {currentItem.fullAnswer}
                  </p>
                </div>

                <div className="flex gap-3 justify-center items-center mb-6">
                  <span className="text-sm font-semibold text-slate-500">최종 모범 답안 유사도 Score:</span>
                  <span className={`px-3 py-1 text-md font-bold rounded-full border ${stageThreeScore >= 85 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    {stageThreeScore}점
                  </span>
                </div>

                {/* Queue context or standard buttons */}
                {sessionQueue.length > 0 && currentQueueIndex !== -1 ? (
                  <div className="w-full flex flex-col items-center">
                    {/* Progress feedback bar */}
                    <div className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-left">
                        <span className="text-xs font-extrabold text-indigo-700 block uppercase tracking-wider">🔄 종합 시험 파트 순차 연습</span>
                        <span className="text-sm font-bold text-slate-700 mt-0.5 block">
                          총 {sessionQueue.length}문항 중 <span className="text-indigo-600 underline font-extrabold">{currentQueueIndex + 1}번째</span> 마스터 처리 중
                        </span>
                      </div>
                      <div className="w-full sm:w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full" style={{ width: `${((currentQueueIndex + 1) / sessionQueue.length) * 100}%` }} />
                      </div>
                    </div>

                    {currentQueueIndex < sessionQueue.length - 1 ? (
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => setCurrentStage(getStartingStage(currentItem))}
                          className="flex-1 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl transition-all text-sm cursor-pointer"
                        >
                          이 문제 다시 풀기
                        </button>
                        <button
                          onClick={() => {
                            const nextIdx = currentQueueIndex + 1;
                            setCurrentQueueIndex(nextIdx);
                            const nextItem = sessionQueue[nextIdx];
                            setCurrentItem(nextItem);
                            setCurrentStage(getStartingStage(nextItem));
                          }}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          다음 문제 풀기 ({sessionQueue[currentQueueIndex + 1].keyword.split(' ')[0]} {sessionQueue[currentQueueIndex + 1].keyword.split(' ')[1] || ''}) <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => setCurrentStage(getStartingStage(currentItem))}
                          className="flex-1 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl transition-all text-sm cursor-pointer"
                        >
                          마지막 문제 다시 풀기
                        </button>
                        <button
                          onClick={() => {
                            setCurrentStage('DASHBOARD');
                            setCurrentItem(null);
                            setSessionQueue([]);
                            setCurrentQueueIndex(-1);
                          }}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-sm shadow-md cursor-pointer"
                        >
                          🎉 파트 전체 완주 완료! 대시보드로
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setCurrentStage('DASHBOARD');
                        setCurrentItem(null);
                        setSessionQueue([]);
                        setCurrentQueueIndex(-1);
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs mt-5 font-bold transition-all underline decoration-slate-300 pointer-events-auto"
                    >
                      여기서 전체 평가 중단하고 대시보드로 돌아가기
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setCurrentStage(getStartingStage(currentItem))}
                      className="flex-1 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl transition-all text-sm cursor-pointer"
                    >
                      이 카드 처음부터 재도전
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStage('DASHBOARD');
                        setCurrentItem(null);
                      }}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-sm shadow-md cursor-pointer"
                    >
                      대시보드로 돌아가기
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStage === 'MANAGE' && (
            <motion.div
              key="manage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <QuestionManage
                customItems={customItems}
                onAddCustomItem={handleAddCustomItem}
                onDeleteCustomItem={handleDeleteCustomItem}
                onClose={() => setCurrentStage('DASHBOARD')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
        성서 성구 및 시온 종합 시험 준비 모듈 ⓒ 2026. 사명 및 기출 데이터 전용 모범 학습 플랫폼.
      </footer>
    </div>
  );
}
