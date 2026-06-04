import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RotateCcw, AlertTriangle, CheckCircle, Lightbulb, Keyboard } from 'lucide-react';
import { StudyItem, ItemType } from '../types';
import { calculateSimilarity, isCorrectAnswer } from '../utils';

interface FullWriteStageProps {
  item: StudyItem;
  onCompleted: (score: number) => void;
  onExit: () => void;
  onIncorrect?: (itemId: string) => void;
}

export default function FullWriteStage({ item, onCompleted, onExit, onIncorrect }: FullWriteStageProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  const handleCheck = () => {
    const computedScore = calculateSimilarity(userAnswer, item.fullAnswer);
    setScore(computedScore);
    setIsChecked(true);
    if (computedScore < 85 && onIncorrect) {
      onIncorrect(item.id);
    }
  };

  const handleReset = () => {
    setUserAnswer('');
    setIsChecked(false);
    setScore(0);
    setShowHint(false);
  };

  const scoreMessage = (s: number) => {
    if (s === 100) return '완벽합니다! 100점 만점입니다! 칭찬합니다.';
    if (s >= 90) return '거의 맞췄습니다! 사소한 맞춤법이나 띄어쓰기를 다시 확인해보세요 (90점대).';
    if (s >= 70) return '문맥이 훌륭하게 통합니다! 조금 더 정교하게 암기해보세요 (70점대-80점대).';
    if (s >= 40) return '조금 더 노력이 필요합니다. 힌트를 확인해 핵심 키워드를 보강하세요.';
    return '원문을 다시 읽어보시고, 이전 단계를 복습하여 완벽히 기억해보세요.';
  };

  // Basic word-level comparison to color-code user's results
  const renderComparisonDiff = () => {
    const actualWords = item.fullAnswer.trim().split(/\s+/);
    const userWords = userAnswer.trim().split(/\s+/);
    
    return (
      <div className="flex flex-wrap gap-1.5 leading-relaxed p-4 bg-slate-50 border border-slate-200 rounded-xl" id="comparison-diff-viewer">
        {actualWords.map((word, idx) => {
          // Check if this word or a highly similar word exists in user's writing
          const matched = userWords.some(
            uw => uw === word || 
            uw.includes(word) || 
            word.includes(uw) || 
            calculateSimilarity(uw, word) > 70
          );
          
          return (
            <span
              key={`diff-${idx}`}
              className={`px-1 rounded-sm text-sm sm:text-base font-medium transition-colors ${
                matched 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'bg-rose-100/70 text-slate-400 line-through'
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-5" id="full-write-container">
      {/* Target Progress Indicator & Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 flex items-center gap-1 w-max">
            <Trophy className="w-3" /> {item.type === ItemType.Verse ? '3단계: 아무 것도 없이 쓰기' : '3단계: 전체 직접 작성하기'}
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">{item.keyword}</h2>
          <p className="text-sm text-slate-500 mt-1">{item.category}</p>
        </div>
        <button
          onClick={onExit}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer bg-white"
        >
          학습 종료
        </button>
      </div>

      {/* Question Card */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 mb-6 shadow-3xs">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">질문 및 주제</p>
        <p className="text-lg font-medium text-slate-800 leading-relaxed">{item.question}</p>
      </div>

      {/* Writing Pad */}
      <div className="mb-6 relative">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-indigo-600" /> 이곳에 답변을 작성하세요:
          </label>
          <span className="text-xs text-slate-400">최대 허용 글자수: {item.fullAnswer.length * 2}자</span>
        </div>
        
        <textarea
          value={userAnswer}
          onChange={(e) => {
            if (isChecked) return;
            setUserAnswer(e.target.value);
          }}
          disabled={isChecked}
          placeholder="성구의 원문 또는 시험 답안 전체를 정확히 기입해보세요..."
          rows={6}
          className={`w-full p-4 text-base md:text-lg border rounded-2xl shadow-3xs transition-all resize-none focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 ${
            isChecked
              ? score >= 85
                ? 'bg-indigo-50/15 border-indigo-300'
                : 'bg-rose-50/20 border-rose-200'
              : 'bg-white border-slate-300'
          }`}
          id="writing-pad-textarea"
        />
        
        {userAnswer.length > 0 && !isChecked && (
          <button
            onClick={() => setUserAnswer('')}
            className="absolute bottom-3 right-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg py-1 px-2 transition-colors cursor-pointer"
          >
            모두 지우기
          </button>
        )}
      </div>

      {/* Hint Reveal */}
      <div className="mb-6">
        {item.type === ItemType.Verse ? (
          <div className="text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200/50 p-3 rounded-xl flex items-center gap-1.5 select-none font-mono">
            🔒 성구 암송 3단계는 철저한 백지 평가를 위해 실시간 힌트가 제공되지 않습니다.
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? '힌트 단어 숨기기' : '첫 글자 및 문자 개수 힌트 보기'}
            </button>

            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/50"
                >
                  <div className="text-sm text-slate-600 leading-loose flex flex-col gap-2">
                    <p>
                      <strong className="text-indigo-700">핵심 단어 개수:</strong> 총 {item.fullAnswer.split(' ').length} 단어 구성 (총 {item.fullAnswer.length}글자)
                    </p>
                    <p>
                      <strong className="text-indigo-700">문장 첫 10글자:</strong> "{item.fullAnswer.substring(0, 10)}..."
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Evaluation Result View */}
      {isChecked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-3xs flex flex-col gap-5"
          id="evaluation-score-card"
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> 스마트 채점 통계
            </h3>
            <div className="flex flex-col items-end">
              <span className={`text-2xl sm:text-3xl font-extrabold ${score >= 90 ? 'text-indigo-600' : score >= 70 ? 'text-sky-500' : 'text-rose-500'}`}>
                {score}점
              </span>
              <span className="text-xs text-slate-400">100점 만점 기준</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">분석 평가 의견</h4>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-150">
              {scoreMessage(score)}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex justify-between">
              <span>단어 일치도 분석표</span>
              <span className="normal-case font-normal text-slate-400">(보라색: 기억한 단어 / 취소선: 누락 및 다른 단어)</span>
            </h4>
            {renderComparisonDiff()}
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/55">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">비교 확인 (모범 정답 원문):</h4>
            <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-semibold">
              {item.fullAnswer}
            </p>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-3 font-semibold">
        {isChecked ? (
          <>
            <button
              onClick={handleReset}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-slate-500/20 focus:outline-hidden transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> 다시 공부하기
            </button>
            <button
              onClick={() => onCompleted(score)}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer shadow-md focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden active:scale-95 transition-all"
            >
              이번 카드 학습 완성
            </button>
          </>
        ) : (
          <button
            onClick={handleCheck}
            disabled={userAnswer.trim().length === 0}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden active:scale-95 ${
              userAnswer.trim().length > 0
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            스스로 쓴 원문 채점하기
          </button>
        )}
      </div>
    </div>
  );
}
