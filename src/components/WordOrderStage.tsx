import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, RotateCcw, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
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

  // Suffix/Index IDs to prevent duplication rendering bugs if same chunk exists multiple times
  useEffect(() => {
    const chunks = generateWordChunks(item.fullAnswer, item.blanks);
    setOriginalChunks(chunks);
    
    // Create pool with unique IDs
    const poolData = chunks.map((chunk, index) => ({
      id: `${index}-${chunk}`,
      text: chunk,
    }));
    
    // Shuffle the pool
    const shuffled = [...poolData].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setAssembled([]);
    setIsChecked(false);
    setIsSuccess(false);
    setFeedback('');
    setShowHint(false);
  }, [item]);

  const handleSelectChunk = (selected: { id: string; text: string }) => {
    if (isChecked) return;
    setPool((prev) => prev.filter((p) => p.id !== selected.id));
    setAssembled((prev) => [...prev, selected]);
  };

  const handleRemoveChunk = (removed: { id: string; text: string }) => {
    if (isChecked) return;
    setAssembled((prev) => prev.filter((a) => a.id !== removed.id));
    setPool((prev) => [...prev, removed]);
  };

  const moveChunk = (index: number, direction: -1 | 1) => {
    if (isChecked) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= assembled.length) return;
    
    setAssembled((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleReset = () => {
    const chunks = generateWordChunks(item.fullAnswer, item.blanks);
    const poolData = chunks.map((chunk, index) => ({
      id: `${index}-${chunk}`,
      text: chunk,
    }));
    const shuffled = [...poolData].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setAssembled([]);
    setIsChecked(false);
    setIsSuccess(false);
    setFeedback('');
  };

  const handleCheck = () => {
    const assembledText = assembled.map((a) => a.text).join(' ').replace(/\s+/g, ' ').trim();
    const originalText = originalChunks.join(' ').replace(/\s+/g, ' ').trim();
    
    setIsChecked(true);
    if (assembledText === originalText) {
      setIsSuccess(true);
      setFeedback('완벽합니다! 다음 단계로 넘어가보세요.');
    } else {
      setIsSuccess(false);
      setFeedback('순서가 올바르지 않습니다. 다시 시도해 보시거나 힌트를 확인해 보세요!');
      if (onIncorrect) {
        onIncorrect(item.id);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-5" id="word-order-container">
      {/* Upper Progress Indicator & Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {stageIndex === 1 ? '1단계: 단어 조합하기' : '2단계: 단어 조합하기'}
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">{item.keyword}</h2>
          <p className="text-sm text-slate-500 mt-1">{item.category}</p>
        </div>
        <button
          onClick={onExit}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer"
        >
          학습 종료
        </button>
      </div>

      {/* Question Card */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 mb-6 shadow-3xs">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">질문 및 주제</p>
        <p className="text-lg font-medium text-slate-800 leading-relaxed">{item.question}</p>
      </div>

      {/* Assembled Area */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-600">내가 조합한 답안:</span>
          {assembled.length > 0 && !isChecked && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 초기화
            </button>
          )}
        </div>
        
        <div 
          className={`min-h-[120px] p-4 rounded-2xl border-2 border-dashed transition-all flex flex-wrap gap-2.5 items-start content-start ${
            isChecked 
              ? isSuccess 
                ? 'bg-indigo-50/30 border-indigo-300' 
                : 'bg-rose-50/50 border-rose-250' 
              : assembled.length > 0
                ? 'bg-white border-indigo-200 shadow-3xs'
                : 'bg-slate-50/50 border-slate-200'
          }`}
          id="assembled-word-pool"
        >
          <AnimatePresence>
            {assembled.length === 0 ? (
              <p className="text-slate-400 text-sm italic m-auto self-center">
                아래 단어들을 차례대로 클릭하여 성구 또는 답안을 순서대로 구성해 보세요.
              </p>
            ) : (
              assembled.map((chunk, index) => (
                <motion.div
                  key={chunk.id}
                  layoutId={chunk.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-sm md:text-base font-semibold rounded-xl border shadow-3xs transition-all relative ${
                    isChecked
                      ? isSuccess
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-rose-100 border-rose-200 text-rose-800'
                      : 'bg-indigo-50/50 border-indigo-100/80 text-slate-800 hover:bg-indigo-100/30'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={isChecked ? {} : { y: -1 }}
                >
                  {/* Left Move Button */}
                  {!isChecked && index > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveChunk(index, -1);
                      }}
                      className="p-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-700 hover:bg-slate-200 hover:border-slate-300 rounded cursor-pointer select-none leading-none"
                      title="왼쪽으로 이동"
                    >
                      ◀
                    </button>
                  )}

                  {/* Chunk Text */}
                  <span className="select-none leading-none px-1 py-0.5">{chunk.text}</span>

                  {/* Right Move Button */}
                  {!isChecked && index < assembled.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveChunk(index, 1);
                      }}
                      className="p-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-700 hover:bg-slate-200 hover:border-slate-300 rounded cursor-pointer select-none leading-none"
                      title="오른쪽으로 이동"
                    >
                      ▶
                    </button>
                  )}

                  {/* Delete/Remove Button */}
                  {!isChecked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveChunk(chunk);
                      }}
                      className="ml-1 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer font-extrabold select-none leading-none text-xs"
                      title="조립에서 제외"
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Choice Pool Area */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">선택지 단어 뭉치 (클릭하여 조립):</h3>
        <div 
          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-2.5 min-h-[90px]"
          id="choice-word-pool"
        >
          <AnimatePresence>
            {pool.map((chunk) => (
              <motion.button
                key={chunk.id}
                layoutId={chunk.id}
                onClick={() => handleSelectChunk(chunk)}
                disabled={isChecked}
                className="px-3 py-2 text-sm md:text-base font-medium bg-white hover:bg-indigo-600 hover:text-white hover:border-indigo-600 border border-slate-200 rounded-xl text-slate-700 shadow-3xs cursor-pointer transition-all"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                {chunk.text}
              </motion.button>
            ))}
          </AnimatePresence>
          {pool.length === 0 && assembled.length > 0 && !isChecked && (
            <p className="text-slate-400 text-xs text-center w-full py-2">모든 단어 카드를 조립했습니다! 아래 채점 버튼을 누르세요.</p>
          )}
        </div>
      </div>

      {/* Helper Tools / Hint */}
      <div className="mb-6">
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
        >
          {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showHint ? '전체 정답 힌트 숨기기' : '정답 힌트(원문) 보기'}
        </button>

        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/50"
            >
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                <span className="text-indigo-700 font-bold">정답: </span>
                {item.fullAnswer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback & Actions */}
      <div className="mt-8 flex flex-col gap-4">
        {isChecked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 p-4 rounded-2xl border ${
              isSuccess 
                ? 'bg-indigo-50/40 border-indigo-200 text-indigo-900 shadow-3xs' 
                : 'bg-rose-50 border-rose-200 text-rose-850'
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold">{isSuccess ? '성공!' : '틀렸습니다'}</p>
              <p className="text-xs mt-0.5 opacity-90">{feedback}</p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 justify-end">
          {isChecked && !isSuccess && (
            <button
              onClick={handleReset}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
            >
              다시 조합하기
            </button>
          )}
          
          {!isChecked ? (
            <button
              onClick={handleCheck}
              disabled={assembled.length === 0}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 active:scale-95 ${
                assembled.length > 0
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              맞췄는지 확인하기
            </button>
          ) : (
            <button
              onClick={onNextStage}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer shadow-md flex items-center gap-2 focus:ring-2 focus:ring-indigo-500/20 active:scale-95 transition-all"
            >
              {stageIndex === 1 
                ? (isSuccess ? '2단계(빈칸 넣기) 이동' : '계속해서 다음 단계 넘어가기')
                : (isSuccess ? '3단계(전체 쓰기) 이동' : '계속해서 다음 단계 넘어가기')}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
