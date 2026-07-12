import React, { useState, useEffect } from 'react';
import { StudyItem } from '../types';
import { generateWordChunks } from '../utils';

interface WordOrderStageProps {
  item: StudyItem;
  onNextStage: () => void;
  onExit: () => void;
  stageIndex?: number;
  onIncorrect?: (itemId: string) => void;
}

export default function WordOrderStage({ item, onNextStage, onExit, stageIndex = 1, onIncorrect }: WordOrderStageProps) {
  const [originalChunks, setOriginalChunks] = useState<string[]>([]);
  const [pool, setPool] = useState<{ id: string; text: string }[]>([]);
  const [assembled, setAssembled] = useState<{ id: string; text: string }[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const chunks = generateWordChunks(item.fullAnswer, item.blanks);
    setOriginalChunks(chunks);
    const poolData = chunks.map((chunk, index) => ({ id: `${index}-${chunk}`, text: chunk }));
    setPool([...poolData].sort(() => Math.random() - 0.5));
    setAssembled([]);
    setIsChecked(false);
    setIsSuccess(false);
    setFeedback('');
    setShowHint(false);
  }, [item]);

  const handleSelectChunk = (selected: { id: string; text: string }) => {
    if (isChecked) return;
    setPool(prev => prev.filter(p => p.id !== selected.id));
    setAssembled(prev => [...prev, selected]);
  };

  const handleRemoveChunk = (removed: { id: string; text: string }) => {
    if (isChecked) return;
    setAssembled(prev => prev.filter(a => a.id !== removed.id));
    setPool(prev => [...prev, removed]);
  };

  const moveChunk = (index: number, direction: -1 | 1) => {
    if (isChecked) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= assembled.length) return;
    setAssembled(prev => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleReset = () => {
    const chunks = generateWordChunks(item.fullAnswer, item.blanks);
    const poolData = chunks.map((chunk, index) => ({ id: `${index}-${chunk}`, text: chunk }));
    setPool([...poolData].sort(() => Math.random() - 0.5));
    setAssembled([]);
    setIsChecked(false);
    setIsSuccess(false);
    setFeedback('');
  };

  const handleCheck = () => {
    const assembledText = assembled.map(a => a.text).join(' ').replace(/\s+/g, ' ').trim();
    const originalText = originalChunks.join(' ').replace(/\s+/g, ' ').trim();
    setIsChecked(true);
    if (assembledText === originalText) {
      setIsSuccess(true);
      setFeedback('정답입니다!');
    } else {
      setIsSuccess(false);
      setFeedback('순서가 틀렸습니다.');
      if (onIncorrect) onIncorrect(item.id);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs text-gray-500">{stageIndex === 1 ? '1단계 — 단어 조합' : '2단계 — 단어 조합'}</span>
          <h2 className="text-base font-bold mt-0.5">{item.keyword}</h2>
          <p className="text-xs text-gray-500">{item.category}</p>
        </div>
        <button onClick={onExit} className="text-xs border border-gray-300 rounded px-2 py-1 cursor-pointer hover:bg-gray-50 shrink-0">종료</button>
      </div>

      <div className="border border-gray-200 rounded p-3 mb-4 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">질문</p>
        <p className="text-sm text-gray-800">{item.question}</p>
      </div>

      {/* Assembled area */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-500">내가 조합한 답안:</p>
          {assembled.length > 0 && !isChecked && (
            <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer">초기화</button>
          )}
        </div>
        <div className={`min-h-20 border-2 border-dashed rounded p-3 flex flex-wrap gap-1.5 ${isChecked ? (isSuccess ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : assembled.length > 0 ? 'border-gray-400' : 'border-gray-200'}`}>
          {assembled.length === 0 ? (
            <p className="text-xs text-gray-400 m-auto">아래 단어를 클릭해서 순서대로 조합하세요.</p>
          ) : (
            assembled.map((chunk, index) => (
              <span key={chunk.id} className={`inline-flex items-center gap-1 text-sm border rounded px-2 py-1 ${isChecked ? (isSuccess ? 'bg-green-600 text-white border-green-600' : 'bg-red-100 border-red-300 text-red-800') : 'bg-white border-gray-300 text-gray-800'}`}>
                {!isChecked && index > 0 && (
                  <button onClick={e => { e.stopPropagation(); moveChunk(index, -1); }} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer">◀</button>
                )}
                {chunk.text}
                {!isChecked && index < assembled.length - 1 && (
                  <button onClick={e => { e.stopPropagation(); moveChunk(index, 1); }} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer">▶</button>
                )}
                {!isChecked && (
                  <button onClick={e => { e.stopPropagation(); handleRemoveChunk(chunk); }} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer ml-1">×</button>
                )}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Pool */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">단어 목록 (클릭해서 조합):</p>
        <div className="border border-gray-200 rounded p-3 min-h-12 flex flex-wrap gap-1.5">
          {pool.length === 0 && assembled.length > 0 && !isChecked ? (
            <p className="text-xs text-gray-400">모두 조합했습니다. 채점하세요.</p>
          ) : (
            pool.map(chunk => (
              <button key={chunk.id} onClick={() => handleSelectChunk(chunk)} disabled={isChecked}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-900 hover:text-white hover:border-gray-900 cursor-pointer transition-colors">
                {chunk.text}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mb-4">
        <button onClick={() => setShowHint(!showHint)} className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer underline">
          {showHint ? '정답 숨기기' : '정답 보기'}
        </button>
        {showHint && <p className="text-sm text-gray-700 mt-2 p-3 border border-gray-200 rounded bg-gray-50">{item.fullAnswer}</p>}
      </div>

      {isChecked && (
        <div className={`text-sm p-3 rounded border mb-4 ${isSuccess ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {feedback}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {isChecked && !isSuccess && (
          <button onClick={handleReset} className="text-sm border border-gray-300 rounded px-4 py-2 cursor-pointer hover:bg-gray-50">다시 조합</button>
        )}
        {!isChecked ? (
          <button onClick={handleCheck} disabled={assembled.length === 0}
            className={`text-sm rounded px-4 py-2 ${assembled.length > 0 ? 'bg-gray-900 text-white cursor-pointer hover:bg-gray-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            채점하기
          </button>
        ) : (
          <button onClick={onNextStage} className="text-sm bg-gray-900 text-white rounded px-4 py-2 cursor-pointer hover:bg-gray-700">
            {stageIndex === 1 ? '2단계로' : '3단계로'} →
          </button>
        )}
      </div>
    </div>
  );
}
