import React, { useState, useEffect } from 'react';
import { StudyItem, ProgressState, ItemType, StudyStage } from './types';
import { defaultQuestions } from './data/defaultQuestions';
import Dashboard from './components/Dashboard';
import WordOrderStage from './components/WordOrderStage';
import FillBlankStage from './components/FillBlankStage';
import FullWriteStage from './components/FullWriteStage';
import QuestionManage from './components/QuestionManage';

export default function App() {
  const [allItems, setAllItems] = useState<StudyItem[]>([]);
  const [customItems, setCustomItems] = useState<StudyItem[]>([]);
  const [progress, setProgress] = useState<{ [id: string]: ProgressState }>({});
  const [incorrectIds, setIncorrectIds] = useState<string[]>([]);

  const [incorrectFolders, setIncorrectFolders] = useState<Array<{ id: string; name: string }>>(() => {
    const saved = localStorage.getItem('memorization_study_incorrect_folders');
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return [{ id: 'default', name: '기본 오답 폴더' }];
  });

  const [folderMappings, setFolderMappings] = useState<{ [folderId: string]: string[] }>(() => {
    const saved = localStorage.getItem('memorization_study_folder_mappings');
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    const savedFlat = localStorage.getItem('memorization_study_incorrect_ids');
    if (savedFlat) { try { const ids = JSON.parse(savedFlat); if (Array.isArray(ids)) return { default: ids }; } catch (e) { console.error(e); } }
    return { default: [] };
  });

  const [currentStage, setCurrentStage] = useState<StudyStage | 'MANAGE'>('DASHBOARD');
  const [currentItem, setCurrentItem] = useState<StudyItem | null>(null);
  const [stageThreeScore, setStageThreeScore] = useState<number>(0);
  const [sessionQueue, setSessionQueue] = useState<StudyItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);

  const [examStageMode, setExamStageMode] = useState<'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY'>(() => {
    const saved = localStorage.getItem('memorization_study_exam_stage_mode');
    return (saved as 'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY') || 'BOTH';
  });

  const handleSetExamStageMode = (mode: 'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY') => {
    setExamStageMode(mode);
    localStorage.setItem('memorization_study_exam_stage_mode', mode);
  };

  const [verseStageMode, setVerseStageMode] = useState<'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY'>(() => {
    const saved = localStorage.getItem('memorization_study_verse_stage_mode');
    return (saved as 'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY') || 'ALL';
  });

  const handleSetVerseStageMode = (mode: 'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY') => {
    setVerseStageMode(mode);
    localStorage.setItem('memorization_study_verse_stage_mode', mode);
  };

  useEffect(() => {
    const savedProgress = localStorage.getItem('memorization_study_progress');
    if (savedProgress) { try { setProgress(JSON.parse(savedProgress)); } catch (e) { console.error(e); } }

    const savedMappingsStr = localStorage.getItem('memorization_study_folder_mappings');
    if (savedMappingsStr) {
      try {
        const mappings = JSON.parse(savedMappingsStr);
        const flat = Array.from(new Set(Object.values(mappings).flat() as string[]));
        setIncorrectIds(flat);
      } catch (e) {
        const savedIncorrect = localStorage.getItem('memorization_study_incorrect_ids');
        if (savedIncorrect) { try { setIncorrectIds(JSON.parse(savedIncorrect)); } catch (_) {} }
      }
    } else {
      const savedIncorrect = localStorage.getItem('memorization_study_incorrect_ids');
      if (savedIncorrect) {
        try {
          const ids = JSON.parse(savedIncorrect);
          setIncorrectIds(ids);
          setFolderMappings({ default: ids });
          localStorage.setItem('memorization_study_folder_mappings', JSON.stringify({ default: ids }));
        } catch (e) { console.error(e); }
      }
    }

    const savedCustom = localStorage.getItem('memorization_study_custom_items');
    let loadedCustom: StudyItem[] = [];
    if (savedCustom) { try { loadedCustom = JSON.parse(savedCustom); setCustomItems(loadedCustom); } catch (e) { console.error(e); } }
    setAllItems([...defaultQuestions, ...loadedCustom]);
  }, []);

  const saveProgressToStorage = (updatedProgress: { [id: string]: ProgressState }) => {
    setProgress(updatedProgress);
    localStorage.setItem('memorization_study_progress', JSON.stringify(updatedProgress));
  };

  const handleIncorrect = (itemId: string) => {
    setFolderMappings((prev) => {
      const current = prev['default'] || [];
      if (current.includes(itemId)) return prev;
      const updated = { ...prev, default: [...current, itemId] };
      localStorage.setItem('memorization_study_folder_mappings', JSON.stringify(updated));
      const flat = Array.from(new Set(Object.values(updated).flat()));
      setIncorrectIds(flat);
      localStorage.setItem('memorization_study_incorrect_ids', JSON.stringify(flat));
      return updated;
    });
  };

  const handleCorrect = (itemId: string) => {
    setFolderMappings((prev) => {
      const updated: { [key: string]: string[] } = {};
      Object.keys(prev).forEach((fId) => { updated[fId] = (prev[fId] || []).filter((id) => id !== itemId); });
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
    setIncorrectFolders((prev) => {
      const updated = [...prev, { id: newId, name: trimmed }];
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
      const updatedItems = folderItems.includes(itemId) ? folderItems.filter((id) => id !== itemId) : [...folderItems, itemId];
      const updated = { ...prev, [folderId]: updatedItems };
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
    const updatedProgress = { ...progress };
    delete updatedProgress[id];
    saveProgressToStorage(updatedProgress);
  };

  const getStartingStage = (item: StudyItem): 'STAGE1' | 'STAGE2' | 'STAGE3' => {
    if (item.type === ItemType.Exam) return examStageMode === 'STAGE2_ONLY' ? 'STAGE3' : 'STAGE2';
    if (verseStageMode === 'STAGE2_ONLY') return 'STAGE2';
    if (verseStageMode === 'STAGE3_ONLY') return 'STAGE3';
    return 'STAGE1';
  };

  const handleStartStudy = (item: StudyItem) => {
    setCurrentItem(item);
    setCurrentStage(getStartingStage(item));
  };

  const handleStartRandomSession = () => {
    if (allItems.length === 0) return;
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
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
      const updated = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      localStorage.setItem('memorization_study_incorrect_ids', JSON.stringify(updated));
      return updated;
    });
  };

  const handleStage1Complete = () => {
    if (!currentItem) return;
    const existing = progress[currentItem.id] || { itemId: currentItem.id, stage1Completed: false, stage2Completed: false, stage3Completed: false, attempts: 0, lastStudiedAt: '' };
    const updated = { ...progress, [currentItem.id]: { ...existing, stage1Completed: true, attempts: existing.attempts + 1, lastStudiedAt: new Date().toISOString() } };
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

  const handleStage2Complete = () => {
    if (!currentItem) return;
    const isExam = currentItem.type === ItemType.Exam;
    const existing = progress[currentItem.id] || { itemId: currentItem.id, stage1Completed: isExam ? true : false, stage2Completed: false, stage3Completed: false, attempts: 0, lastStudiedAt: '' };
    const updated = { ...progress, [currentItem.id]: { ...existing, stage1Completed: isExam ? true : existing.stage1Completed, stage2Completed: true, attempts: isExam ? existing.attempts + 1 : existing.attempts, lastStudiedAt: new Date().toISOString() } };
    saveProgressToStorage(updated);
    if ((isExam && examStageMode === 'STAGE1_ONLY') || (!isExam && verseStageMode === 'STAGE2_ONLY')) {
      setStageThreeScore(100);
      handleCorrect(currentItem.id);
      saveProgressToStorage({ ...updated, [currentItem.id]: { ...updated[currentItem.id], stage3Completed: true } });
      setCurrentStage('SUMMARY');
    } else {
      setCurrentStage('STAGE3');
    }
  };

  const handleStage3Complete = (score: number) => {
    if (!currentItem) return;
    setStageThreeScore(score);
    const passed = score >= 85;
    const isExam = currentItem.type === ItemType.Exam;
    if (passed) { handleCorrect(currentItem.id); } else { handleIncorrect(currentItem.id); }
    const existing = progress[currentItem.id] || { itemId: currentItem.id, stage1Completed: isExam ? true : false, stage2Completed: isExam ? true : false, stage3Completed: false, attempts: 0, lastStudiedAt: '' };
    const updated = { ...progress, [currentItem.id]: { ...existing, stage1Completed: isExam ? true : existing.stage1Completed, stage2Completed: isExam ? true : existing.stage2Completed, stage3Completed: passed ? true : existing.stage3Completed, lastStudiedAt: new Date().toISOString() } };
    saveProgressToStorage(updated);
    setCurrentStage('SUMMARY');
  };

  const handleResetAllProgress = () => {
    if (window.confirm('모든 진도 데이터를 초기화하시겠습니까?')) {
      setProgress({});
      localStorage.removeItem('memorization_study_progress');
    }
  };

  const goToDashboard = () => {
    setCurrentStage('DASHBOARD');
    setCurrentItem(null);
    setSessionQueue([]);
    setCurrentQueueIndex(-1);
  };

  const stageLabel = (s: StudyStage | 'MANAGE') => {
    if (s === 'STAGE1') return '1단계';
    if (s === 'STAGE2') return '2단계';
    if (s === 'STAGE3') return '3단계';
    if (s === 'SUMMARY') return '결과';
    return '';
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-sm">암기 학습기</span>
        <div className="flex items-center gap-3">
          {currentStage !== 'DASHBOARD' && currentStage !== 'MANAGE' && (
            <span className="text-xs text-gray-500">{currentItem?.keyword} · {stageLabel(currentStage)}</span>
          )}
          {currentStage !== 'DASHBOARD' && (
            <button onClick={goToDashboard} className="text-xs border border-gray-300 rounded px-3 py-1 cursor-pointer hover:bg-gray-50">목록</button>
          )}
          <button onClick={handleResetAllProgress} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer">초기화</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Dashboard */}
        {currentStage === 'DASHBOARD' && (
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
        )}

        {/* Manage */}
        {currentStage === 'MANAGE' && (
          <QuestionManage
            customItems={customItems}
            onAddCustomItem={handleAddCustomItem}
            onDeleteCustomItem={handleDeleteCustomItem}
            onClose={() => setCurrentStage('DASHBOARD')}
          />
        )}

        {/* Study stages */}
        {(['STAGE1', 'STAGE2', 'STAGE3'] as const).includes(currentStage as 'STAGE1' | 'STAGE2' | 'STAGE3') && currentItem && (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Sidebar */}
            <aside className="lg:w-52 shrink-0 flex flex-col gap-3">
              {/* Stage steps */}
              <div className="border border-gray-200 rounded p-3">
                <p className="text-xs font-bold text-gray-500 mb-2">단계</p>
                <div className="flex flex-col gap-1">
                  {currentItem.type !== ItemType.Exam && (
                    <div className={`text-xs px-2 py-1 rounded ${currentStage === 'STAGE1' ? 'bg-gray-900 text-white' : 'text-gray-400'}`}>
                      1단계 — 단어 선택
                    </div>
                  )}
                  <div className={`text-xs px-2 py-1 rounded ${currentStage === 'STAGE2' ? 'bg-gray-900 text-white' : 'text-gray-400'}`}>
                    {currentItem.type === ItemType.Exam ? '1단계' : '2단계'} — {currentItem.type === ItemType.Verse ? '단어 조합' : currentItem.type === ItemType.Exam ? '빈칸 채우기' : '단어 조합'}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${currentStage === 'STAGE3' ? 'bg-gray-900 text-white' : 'text-gray-400'}`}>
                    {currentItem.type === ItemType.Exam ? '2단계' : '3단계'} — 백지 쓰기
                  </div>
                </div>
              </div>

              {/* Incorrect folders */}
              <div className="border border-gray-200 rounded p-3">
                <p className="text-xs font-bold text-gray-500 mb-2">오답 노트</p>
                <div className="flex flex-col gap-1 mb-2">
                  {incorrectFolders.map((folder) => {
                    const isInFolder = (folderMappings[folder.id] || []).includes(currentItem.id);
                    return (
                      <label key={folder.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInFolder}
                          onChange={() => handleToggleItemInFolder(currentItem.id, folder.id)}
                          className="cursor-pointer"
                        />
                        <span className="text-xs text-gray-700 truncate">{folder.name}</span>
                      </label>
                    );
                  })}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('studyNewFolder') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val) { handleAddFolder(val, currentItem.id); input.value = ''; }
                  }}
                  className="flex gap-1"
                >
                  <input type="text" name="studyNewFolder" placeholder="새 폴더..." className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none" />
                  <button type="submit" className="text-xs border border-gray-300 rounded px-2 py-1 cursor-pointer hover:bg-gray-50">추가</button>
                </form>
              </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 border border-gray-200 rounded p-4">
              {currentStage === 'STAGE1' && (
                currentItem.type === ItemType.Verse ? (
                  <FillBlankStage item={currentItem} onNextStage={handleStage1Complete} onExit={goToDashboard} stageIndex={1} onIncorrect={handleIncorrect} />
                ) : (
                  <WordOrderStage item={currentItem} onNextStage={handleStage1Complete} onExit={goToDashboard} stageIndex={1} onIncorrect={handleIncorrect} />
                )
              )}
              {currentStage === 'STAGE2' && (
                currentItem.type === ItemType.Verse ? (
                  <WordOrderStage item={currentItem} onNextStage={handleStage2Complete} onExit={goToDashboard} stageIndex={2} onIncorrect={handleIncorrect} />
                ) : (
                  <FillBlankStage item={currentItem} onNextStage={handleStage2Complete} onExit={goToDashboard} stageIndex={2} onIncorrect={handleIncorrect} />
                )
              )}
              {currentStage === 'STAGE3' && (
                <FullWriteStage item={currentItem} onCompleted={handleStage3Complete} onExit={goToDashboard} onIncorrect={handleIncorrect} />
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {currentStage === 'SUMMARY' && currentItem && (
          <div className="max-w-xl mx-auto border border-gray-200 rounded p-6">
            <p className="text-xs text-gray-500 mb-1">{currentItem.category}</p>
            <h2 className="text-lg font-bold mb-3">{currentItem.keyword}</h2>

            <div className="border border-gray-100 rounded p-4 mb-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">질문</p>
              <p className="text-sm text-gray-700 mb-3">{currentItem.question}</p>
              <p className="text-xs text-gray-500 mb-1">정답</p>
              <p className="text-sm font-semibold text-gray-900">{currentItem.fullAnswer}</p>
            </div>

            <p className="text-sm mb-4">
              점수: <span className={`font-bold ${stageThreeScore >= 85 ? 'text-green-700' : 'text-red-600'}`}>{stageThreeScore}점</span>
              {stageThreeScore >= 85 ? ' — 통과' : ' — 미통과'}
            </p>

            {sessionQueue.length > 0 && currentQueueIndex !== -1 ? (
              <div>
                <p className="text-xs text-gray-500 mb-3">{sessionQueue.length}개 중 {currentQueueIndex + 1}번째</p>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentStage(getStartingStage(currentItem))} className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 cursor-pointer hover:bg-gray-50">다시 풀기</button>
                  {currentQueueIndex < sessionQueue.length - 1 ? (
                    <button
                      onClick={() => {
                        const nextIdx = currentQueueIndex + 1;
                        setCurrentQueueIndex(nextIdx);
                        const nextItem = sessionQueue[nextIdx];
                        setCurrentItem(nextItem);
                        setCurrentStage(getStartingStage(nextItem));
                      }}
                      className="flex-1 text-sm bg-gray-900 text-white rounded px-3 py-2 cursor-pointer hover:bg-gray-700"
                    >
                      다음 문제
                    </button>
                  ) : (
                    <button onClick={goToDashboard} className="flex-1 text-sm bg-gray-900 text-white rounded px-3 py-2 cursor-pointer hover:bg-gray-700">완료 — 목록으로</button>
                  )}
                </div>
                <button onClick={goToDashboard} className="text-xs text-gray-400 mt-3 cursor-pointer hover:text-gray-600 block">중단하고 목록으로</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setCurrentStage(getStartingStage(currentItem))} className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 cursor-pointer hover:bg-gray-50">다시 풀기</button>
                <button onClick={goToDashboard} className="flex-1 text-sm bg-gray-900 text-white rounded px-3 py-2 cursor-pointer hover:bg-gray-700">목록으로</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
