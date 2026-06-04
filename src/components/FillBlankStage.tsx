import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, RotateCcw, AlertCircle, CheckCircle, Eye, EyeOff, Info } from 'lucide-react';
import { StudyItem } from '../types';

interface FillBlankStageProps {
  item: StudyItem;
  onNextStage: () => void;
  onExit: () => void;
  stageIndex?: number;
  onIncorrect?: (itemId: string) => void;
}

export default function FillBlankStage({ item, onNextStage, onExit, stageIndex = 2, onIncorrect }: FillBlankStageProps) {
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [blankIndex: number]: string }>({});
  const [isChecked, setIsChecked] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [incorrectList, setIncorrectList] = useState<number[]>([]);

  // We find occurances of blanks in the fullAnswer and replace them with placeholder slots
  const blanks = item.blanks && item.blanks.length > 0 ? item.blanks : ['하나님', '예수님'];

  useEffect(() => {
    // Shuffle the blanks to present as option bank / candidates
    const shuffled = [...blanks].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
    setSelectedAnswers({});
    setIsChecked(false);
    setIsSuccess(false);
    setShowHint(false);
    setIncorrectList([]);
  }, [item, blanks]);

  // Construct parts of the text to render inline dropdowns/selects
  // Split the paragraph by the blanks safely
  const renderInteractiveSentence = () => {
    let sentence = item.fullAnswer;
    
    // Sort blanks by length descending so that we match the longest phrases first, avoiding replacing substrings of longer blanks
    const sortedBlanks = [...blanks]
      .map((text, originalIndex) => ({ text, originalIndex }))
      .sort((a, b) => b.text.length - a.text.length);

    // Place temporary placeholders like __BLANK_0__, __BLANK_1__
    sortedBlanks.forEach((b) => {
      // Escape special characters for regex matching
      const escaped = b.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, 'g');
      sentence = sentence.replace(regex, `__BLANK_${b.originalIndex}__`);
    });

    const parts = sentence.split(/(__BLANK_\d+__)/);

    return parts.map((part, index) => {
      const match = part.match(/__BLANK_(\d+)__/);
      if (match) {
        const blankIndex = parseInt(match[1]);
        const isWrong = isChecked && incorrectList.includes(blankIndex);
        const isRight = isChecked && !incorrectList.includes(blankIndex);
        
        return (
          <span key={`blank-container-${blankIndex}`} className="inline-block mx-1 my-1">
            <select
              value={selectedAnswers[blankIndex] || ''}
              onChange={(e) => {
                if (isChecked) return;
                const val = e.target.value;
                setSelectedAnswers(prev => ({
                  ...prev,
                  [blankIndex]: val
                }));
              }}
              disabled={isChecked}
              className={`px-3 py-1.5 md:py-2 text-sm md:text-base font-semibold border rounded-lg shadow-3xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 pr-8 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_0.75rem_center] bg-no-repeat transition-all ${
                isWrong
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : isRight
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                    : selectedAnswers[blankIndex]
                      ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950'
                      : 'bg-white border-slate-300 text-slate-400'
              }`}
            >
              <option value="">{`(${blankIndex + 1}) 빈칸 선택`}</option>
              {shuffledOptions.map((opt, i) => (
                <option key={`opt-${i}`} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </span>
        );
      }
      return <span key={`text-${index}`} className="text-slate-800 leading-loose text-base md:text-lg">{part}</span>;
    });
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsChecked(false);
    setIsSuccess(false);
    setIncorrectList([]);
  };

  const handleCheck = () => {
    let wrongIndices: number[] = [];
    blanks.forEach((correctText, originalIndex) => {
      const selected = selectedAnswers[originalIndex];
      if (!selected || selected !== correctText) {
        wrongIndices.push(originalIndex);
      }
    });

    setIncorrectList(wrongIndices);
    setIsChecked(true);

    if (wrongIndices.length === 0) {
      setIsSuccess(true);
    } else {
      setIsSuccess(false);
      if (onIncorrect) {
        onIncorrect(item.id);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-5" id="fill-blank-container">
      {/* Target Progress Indicator & Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {stageIndex === 1 ? '1단계: 핵심 단어 선택' : '2단계: 주요 빈칸 채우기'}
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

      {/* Sentence containing Dropdowns */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-3xs relative" id="interactive-fill-card">
        <div className="absolute top-4 right-4 flex items-center gap-1 text-slate-400 text-[10px] font-semibold">
          <Info className="w-3.5 h-3.5" /> 각 빈칸의 선택 상자를 클릭해 적절한 단어를 고르세요
        </div>
        
        <div className="pt-4 pb-2" id="interactive-sentence-flow">
          {renderInteractiveSentence()}
        </div>
      </div>

      {/* Option Bank */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">선택지 단어 보기 목록:</h3>
        <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          {shuffledOptions.map((opt, i) => {
            // Highlight options that are currently selected in the dropdown to help visualize which ones are left
            const worksAsSelection = Object.values(selectedAnswers).includes(opt);
            return (
              <div
                key={`opt-card-${i}`}
                className={`px-3 py-1.5 font-medium rounded-lg text-sm border shadow-3xs select-none transition-colors ${
                  worksAsSelection
                    ? 'bg-slate-200 border-slate-300 text-slate-400 line-through'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {opt}
              </div>
            );
          })}
        </div>
      </div>

      {/* Helper Tools / Hint */}
      <div className="mb-6 border-t border-slate-100 pt-4">
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
        >
          {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showHint ? '전체 정답 힌트 숨기기' : '전체 정답(원문) 힌트 보기'}
        </button>

        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-1 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/50"
            >
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                <span className="text-indigo-700 font-bold">전체 정답: </span>
                {item.fullAnswer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback Card & Actions */}
      <div className="mt-8 flex flex-col gap-4">
        {isChecked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-start gap-3 p-4 rounded-2xl border ${
              isSuccess 
                ? 'bg-indigo-50/40 border-indigo-200 text-indigo-900' 
                : 'bg-rose-50 border-rose-200 text-rose-850'
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold">{isSuccess ? '성공!' : '틀린 항목이 있습니다'}</p>
              <p className="text-xs mt-0.5 opacity-90">
                {isSuccess 
                  ? '모든 빈칸을 정확하게 채워 넣으셨습니다! 최고의 실력입니다.' 
                  : `총 ${incorrectList.length}개의 빈칸 오답이 있습니다. 정답을 확인하고 다시 공부해보세요.`}
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 justify-end">
          {isChecked && !isSuccess && (
            <button
              onClick={handleReset}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
            >
              인풋 초기화 후 재검색
            </button>
          )}

          {!isChecked ? (
            <button
              onClick={handleCheck}
              disabled={Object.keys(selectedAnswers).length === 0}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 active:scale-95 ${
                Object.keys(selectedAnswers).length > 0
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              답안 검사하기
            </button>
          ) : (
            <button
              onClick={onNextStage}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer shadow-md flex items-center gap-2 focus:ring-2 focus:ring-indigo-500/20 active:scale-95 transition-all"
            >
              {stageIndex === 1 
                ? (isSuccess ? '2단계(단어 조합) 이동' : '계속해서 다음 단계 넘어가기')
                : (isSuccess ? '3단계(전체 쓰기) 이동' : '다음 학습 단계로 가기')}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
