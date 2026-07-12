import React, { useState, useMemo } from 'react';
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
  incorrectFolders: Array<{ id: string; name: string }>;
  folderMappings: { [folderId: string]: string[] };
  onAddFolder: (name: string, itemId?: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onToggleItemInFolder: (itemId: string, folderId: string) => void;
  examStageMode: 'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY';
  onSetExamStageMode: (mode: 'BOTH' | 'STAGE1_ONLY' | 'STAGE2_ONLY') => void;
  verseStageMode: 'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY';
  onSetVerseStageMode: (mode: 'ALL' | 'STAGE1_ONLY' | 'STAGE2_ONLY' | 'STAGE3_ONLY') => void;
}

export default function Dashboard({
  items, progress, onStartStudy, onStartRandomSession, onStartSequentialStudy, onOpenManage,
  incorrectIds, onRemoveFromIncorrect, onToggleIncorrect,
  incorrectFolders, folderMappings, onAddFolder, onDeleteFolder, onRenameFolder, onToggleItemInFolder,
  examStageMode, onSetExamStageMode, verseStageMode, onSetVerseStageMode
}: DashboardProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VERSE' | 'EXAM' | 'CUSTOM' | 'INCORRECT'>('ALL');
  const [activePart, setActivePart] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState<string>('');
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [rangeInput, setRangeInput] = useState<string>('');

  const categoryNumbers = useMemo(() => {
    const numbers = new Map<string, number>();
    const groups: { [cat: string]: StudyItem[] } = {};
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    Object.values(groups).forEach(group => {
      const sorted = [...group].sort((a, b) => {
        const aNum = parseInt(a.id.replace(/[^0-9]/g, '')) || 0;
        const bNum = parseInt(b.id.replace(/[^0-9]/g, '')) || 0;
        return aNum - bNum;
      });
      sorted.forEach((item, idx) => numbers.set(item.id, idx + 1));
    });
    return numbers;
  }, [items]);

  const toggleSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  const applyRangeInput = (input: string, targetItems: StudyItem[]) => {
    const parts = input.split(',').map(s => s.trim()).filter(Boolean);
    const targetNumbers = new Set<number>();
    parts.forEach(part => {
      const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
      const singleMatch = part.match(/^(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]), end = parseInt(rangeMatch[2]);
        for (let n = Math.min(start, end); n <= Math.max(start, end); n++) targetNumbers.add(n);
      } else if (singleMatch) {
        targetNumbers.add(parseInt(singleMatch[1]));
      }
    });
    if (targetNumbers.size === 0) return;
    const newSelected = new Set<string>();
    targetItems.forEach(item => {
      const num = categoryNumbers.get(item.id);
      if (num !== undefined && targetNumbers.has(num)) newSelected.add(item.id);
    });
    setSelectedItemIds(newSelected);
  };

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
      if (selectedFolderId === 'all') return incorrectIds.includes(item.id);
      return (folderMappings[selectedFolderId] || []).includes(item.id);
    }
    return true;
  });

  const isMastered = (item: StudyItem) => {
    const p = progress[item.id];
    if (!p) return false;
    return item.type === ItemType.Exam ? (p.stage2Completed && p.stage3Completed) : (p.stage1Completed && p.stage2Completed && p.stage3Completed);
  };

  const btn = (active: boolean) =>
    `text-sm px-3 py-1.5 rounded border cursor-pointer ${active ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`;

  return (
    <div>
      {/* Top actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'VERSE', 'EXAM', 'CUSTOM', 'INCORRECT'] as const).map(f => {
            const counts: Record<string, number> = {
              ALL: items.length,
              VERSE: items.filter(i => i.type === ItemType.Verse).length,
              EXAM: items.filter(i => i.type === ItemType.Exam).length,
              CUSTOM: items.filter(i => i.type === ItemType.Custom).length,
              INCORRECT: incorrectIds.length,
            };
            const labels: Record<string, string> = { ALL: '전체', VERSE: '성구', EXAM: '시험', CUSTOM: '내 문제', INCORRECT: '오답' };
            return (
              <button key={f} onClick={() => { setActiveFilter(f); setActivePart('ALL'); }} className={btn(activeFilter === f)}>
                {labels[f]} ({counts[f]})
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={onStartRandomSession} disabled={items.length === 0} className="text-sm border border-gray-300 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-50 disabled:opacity-40">랜덤</button>
          <button onClick={onOpenManage} className="text-sm bg-gray-900 text-white rounded px-3 py-1.5 cursor-pointer hover:bg-gray-700">문제 관리</button>
        </div>
      </div>

      {/* VERSE controls */}
      {activeFilter === 'VERSE' && (
        <div className="flex flex-wrap items-center gap-3 mb-4 py-3 border-y border-gray-100">
          <span className="text-xs text-gray-500">단계:</span>
          {(['ALL', 'STAGE1_ONLY', 'STAGE2_ONLY', 'STAGE3_ONLY'] as const).map(mode => {
            const label = mode === 'ALL' ? '전체' : mode === 'STAGE1_ONLY' ? '1단계' : mode === 'STAGE2_ONLY' ? '2단계' : '3단계';
            return <button key={mode} onClick={() => onSetVerseStageMode(mode)} className={btn(verseStageMode === mode)}>{label}</button>;
          })}
          <button onClick={() => onStartSequentialStudy(items.filter(i => i.type === ItemType.Verse))} className="text-sm border border-gray-300 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-50 ml-auto">전체 순차</button>
        </div>
      )}

      {/* EXAM controls */}
      {activeFilter === 'EXAM' && (
        <div className="mb-4 py-3 border-y border-gray-100 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-500">단계:</span>
            {(['BOTH', 'STAGE1_ONLY', 'STAGE2_ONLY'] as const).map(mode => {
              const label = mode === 'BOTH' ? '1+2단계' : mode === 'STAGE1_ONLY' ? '1단계' : '2단계';
              return <button key={mode} onClick={() => onSetExamStageMode(mode)} className={btn(examStageMode === mode)}>{label}</button>;
            })}
            <button
              onClick={() => onStartSequentialStudy(items.filter(i => i.type === ItemType.Exam).sort((a, b) => (parseInt(a.id.replace('exam-', '')) || 0) - (parseInt(b.id.replace('exam-', '')) || 0)))}
              className="text-sm border border-gray-300 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-50 ml-auto"
            >전체 순차</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">파트:</span>
            {(['ALL', 1, 2, 3, 4] as const).map(part => {
              const label = part === 'ALL' ? '전체' : `Part ${part}`;
              return <button key={part} onClick={() => setActivePart(part)} className={btn(activePart === part)}>{label}</button>;
            })}
            {activePart !== 'ALL' && (
              <button
                onClick={() => onStartSequentialStudy(items.filter(i => i.type === ItemType.Exam && getPartForExam(i) === activePart).sort((a, b) => (parseInt(a.id.replace('exam-', '')) || 0) - (parseInt(b.id.replace('exam-', '')) || 0)))}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-50"
              >Part {activePart} 순차</button>
            )}
          </div>
        </div>
      )}

      {/* INCORRECT folder controls */}
      {activeFilter === 'INCORRECT' && (
        <div className="mb-4 py-3 border-y border-gray-100 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setSelectedFolderId('all')} className={btn(selectedFolderId === 'all')}>전체 ({incorrectIds.length})</button>
            {incorrectFolders.map(folder => {
              const count = (folderMappings[folder.id] || []).length;
              return (
                <div key={folder.id} className="flex items-center gap-1">
                  {renamingFolderId === folder.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text" value={renamingFolderName}
                        onChange={e => setRenamingFolderName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { onRenameFolder(folder.id, renamingFolderName); setRenamingFolderId(null); } else if (e.key === 'Escape') setRenamingFolderId(null); }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 w-28 focus:outline-none" autoFocus
                      />
                      <button onClick={() => { onRenameFolder(folder.id, renamingFolderName); setRenamingFolderId(null); }} className="text-xs cursor-pointer text-green-600">✓</button>
                      <button onClick={() => setRenamingFolderId(null)} className="text-xs cursor-pointer text-gray-400">✕</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setSelectedFolderId(folder.id)} className={btn(selectedFolderId === folder.id)}>{folder.name} ({count})</button>
                      <button onClick={() => { setRenamingFolderId(folder.id); setRenamingFolderName(folder.name); }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">✎</button>
                      {folder.id !== 'default' && <button onClick={() => { if (window.confirm(`'${folder.name}' 삭제?`)) { onDeleteFolder(folder.id); if (selectedFolderId === folder.id) setSelectedFolderId('all'); } }} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer">✕</button>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <form onSubmit={e => { e.preventDefault(); const inp = (e.currentTarget.elements.namedItem('newFolderName') as HTMLInputElement); const val = inp.value.trim(); if (val) { onAddFolder(val); inp.value = ''; } }} className="flex gap-2">
            <input type="text" name="newFolderName" placeholder="새 폴더 이름..." className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none" />
            <button type="submit" className="text-xs border border-gray-300 rounded px-2 py-1 cursor-pointer hover:bg-gray-50">추가</button>
          </form>
          {selectedFolderId !== 'all' && (folderMappings[selectedFolderId] || []).length > 0 && (
            <button onClick={() => onStartSequentialStudy(items.filter(i => (folderMappings[selectedFolderId] || []).includes(i.id)))} className="text-sm bg-gray-900 text-white rounded px-3 py-1.5 cursor-pointer hover:bg-gray-700 w-max">
              이 폴더 순차 시험
            </button>
          )}
        </div>
      )}

      {/* Number picker */}
      {(activeFilter === 'VERSE' || activeFilter === 'EXAM' || activeFilter === 'CUSTOM') && filteredItems.length > 0 && (
        <div className="mb-4 border border-gray-200 rounded p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">번호 선택</span>
            <div className="flex gap-3">
              <button onClick={() => setSelectedItemIds(new Set(filteredItems.map(i => i.id)))} className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer">전체 선택</button>
              {selectedItemIds.size > 0 && <button onClick={() => { setSelectedItemIds(new Set()); setRangeInput(''); }} className="text-xs text-red-500 cursor-pointer">초기화</button>}
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); applyRangeInput(rangeInput, filteredItems); }} className="flex gap-2">
            <input type="text" value={rangeInput} onChange={e => setRangeInput(e.target.value)} placeholder="예: 1-10, 15-20" className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none" />
            <button type="submit" className="text-xs border border-gray-300 rounded px-2 py-1 cursor-pointer hover:bg-gray-50">적용</button>
          </form>
          <div className="flex flex-wrap gap-1">
            {filteredItems.map(item => {
              const num = categoryNumbers.get(item.id) ?? 0;
              const isSelected = selectedItemIds.has(item.id);
              const mastered = isMastered(item);
              return (
                <button key={item.id} onClick={() => toggleSelection(item.id)} title={item.keyword}
                  className={`w-8 h-8 text-xs rounded border cursor-pointer ${isSelected ? 'bg-gray-900 text-white border-gray-900' : mastered ? 'border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected action bar */}
      {selectedItemIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between border border-gray-300 rounded p-3">
          <span className="text-sm text-gray-700">{selectedItemIds.size}개 선택됨</span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedItemIds(new Set())} className="text-xs border border-gray-300 rounded px-3 py-1.5 cursor-pointer hover:bg-gray-50">해제</button>
            <button onClick={() => onStartSequentialStudy(items.filter(i => selectedItemIds.has(i.id)))} className="text-xs bg-gray-900 text-white rounded px-3 py-1.5 cursor-pointer hover:bg-gray-700">
              선택한 {selectedItemIds.size}개 시험보기
            </button>
          </div>
        </div>
      )}

      {/* Card list */}
      {filteredItems.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">카드가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredItems.map(item => {
            const p = progress[item.id] || { itemId: item.id, stage1Completed: false, stage2Completed: false, stage3Completed: false, attempts: 0, lastStudiedAt: '' };
            const isExam = item.type === ItemType.Exam;
            const mastered = isMastered(item);
            const num = categoryNumbers.get(item.id);

            return (
              <div key={item.id} className={`border rounded p-3 ${mastered ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => toggleSelection(item.id)}
                      className={`shrink-0 w-7 h-7 text-xs border rounded cursor-pointer ${selectedItemIds.has(item.id) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-500 hover:border-gray-500'}`}
                    >{num ?? '·'}</button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-400">{item.category}</span>
                        {mastered && <span className="text-xs text-green-600">✓ 완료</span>}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.keyword}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.question}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Stage dots */}
                    <div className="flex gap-1 text-xs text-gray-400">
                      {!isExam && <span className={p.stage1Completed ? 'text-green-600' : ''}>①</span>}
                      <span className={p.stage2Completed ? 'text-green-600' : ''}>②</span>
                      <span className={p.stage3Completed ? 'text-green-600' : ''}>③</span>
                    </div>
                    {/* Folder menu */}
                    <div className="relative">
                      <button
                        onClick={e => { e.stopPropagation(); setActiveFolderMenuId(activeFolderMenuId === item.id ? null : item.id); }}
                        className={`text-xs border rounded px-2 py-1 cursor-pointer ${incorrectIds.includes(item.id) ? 'border-red-300 text-red-600' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}
                      >📌</button>
                      {activeFolderMenuId === item.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setActiveFolderMenuId(null)} />
                          <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-md p-3 z-40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-700">오답 폴더</span>
                              <button onClick={() => setActiveFolderMenuId(null)} className="text-xs text-gray-400 cursor-pointer">✕</button>
                            </div>
                            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto mb-2">
                              {incorrectFolders.map(folder => {
                                const isInFolder = folderMappings[folder.id]?.includes(item.id) || false;
                                return (
                                  <label key={folder.id} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer py-1 hover:bg-gray-50 rounded px-1">
                                    <input type="checkbox" checked={isInFolder} onChange={() => onToggleItemInFolder(item.id, folder.id)} className="cursor-pointer" />
                                    {folder.name}
                                  </label>
                                );
                              })}
                            </div>
                            <div className="flex gap-1 border-t border-gray-100 pt-2" onClick={e => e.stopPropagation()}>
                              <input type="text" id={`card-folder-${item.id}`} placeholder="새 폴더..." className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                onKeyDown={e => { if (e.key === 'Enter') { const val = e.currentTarget.value.trim(); if (val) { onAddFolder(val, item.id); e.currentTarget.value = ''; } } }} />
                              <button onClick={() => { const inp = document.getElementById(`card-folder-${item.id}`) as HTMLInputElement; const val = inp?.value?.trim(); if (val) { onAddFolder(val, item.id); inp.value = ''; } }} className="text-xs border border-gray-200 rounded px-2 py-1 cursor-pointer hover:bg-gray-50">추가</button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <button onClick={() => onStartStudy(item)} className="text-xs bg-gray-900 text-white rounded px-3 py-1.5 cursor-pointer hover:bg-gray-700">{mastered ? '복습' : '시작'}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
