import React, { useState, useEffect } from 'react';
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

  const blanks = item.blanks && item.blanks.length > 0 ? item.blanks : ['하나님', '예수님'];

  useEffect(() => {
    const shuffled = [...blanks].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
    setSelectedAnswers({});
    setIsChecked(false);
    setIsSuccess(false);
    setShowHint(false);
    setIncorrectList([]);
  }, [item]);

  const renderInteractiveSentence = () => {
    let sentence = item.fullAnswer;
    const sortedBlanks = [...blanks].map((text, originalIndex) => ({ text, originalIndex })).sort((a, b) => b.text.length - a.text.length);
    sortedBlanks.forEach((b) => {
      const escaped = b.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      sentence = sentence.replace(new RegExp(escaped, 'g'), `__BLANK_${b.originalIndex}__`);
    });

    return sentence.split(/(__BLANK_\d+__)/).map((part, index) => {
      const match = part.match(/__BLANK_(\d+)__/);
      if (match) {
        const blankIndex = parseInt(match[1]);
        const isWrong = isChecked && incorrectList.includes(blankIndex);
        const isRight = isChecked && !incorrectList.includes(blankIndex);
        return (
          <span key={`blank-${blankIndex}`} className="inline-block mx-1 my-1">
            <select
              value={selectedAnswers[blankIndex] || ''}
              onChange={e => { if (isChecked) return; setSelectedAnswers(prev => ({ ...prev, [blankIndex]: e.target.value })); }}
              disabled={isChecked}
              className={`border rounded px-2 py-1 text-sm cursor-pointer focus:outline-none ${isWrong ? 'border-red-400 bg-red-50 text-red-800' : isRight ? 'border-green-400 bg-green-50 text-green-800' : selectedAnswers[blankIndex] ? 'border-gray-400' : 'border-gray-300 text-gray-400'}`}
            >
              <option value="">{`(${blankIndex + 1}) 선택`}</option>
              {shuffledOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
          </span>
        );
      }
      return <span key={`text-${index}`} className="text-gray-900 leading-loose text-sm">{part}</span>;
    });
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsChecked(false);
    setIsSuccess(false);
    setIncorrectList([]);
  };

  const handleCheck = () => {
    const wrongIndices: number[] = [];
    blanks.forEach((correctText, originalIndex) => {
      if (!selectedAnswers[originalIndex] || selectedAnswers[originalIndex] !== correctText) wrongIndices.push(originalIndex);
    });
    setIncorrectList(wrongIndices);
    setIsChecked(true);
    setIsSuccess(wrongIndices.length === 0);
    if (wrongIndices.length > 0 && onIncorrect) onIncorrect(item.id);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs text-gray-500">{stageIndex === 1 ? '1단계 — 단어 선택' : '2단계 — 빈칸 채우기'}</span>
          <h2 className="text-base font-bold mt-0.5">{item.keyword}</h2>
          <p className="text-xs text-gray-500">{item.category}</p>
        </div>
        <button onClick={onExit} className="text-xs border border-gray-300 rounded px-2 py-1 cursor-pointer hover:bg-gray-50 shrink-0">종료</button>
      </div>

      <div className="border border-gray-200 rounded p-3 mb-4 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">질문</p>
        <p className="text-sm text-gray-800">{item.question}</p>
      </div>

      <div className="border border-gray-200 rounded p-4 mb-4">
        <p className="text-xs text-gray-500 mb-2">빈칸에 알맞은 단어를 선택하세요:</p>
        <div className="leading-loose">{renderInteractiveSentence()}</div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">선택지:</p>
        <div className="flex flex-wrap gap-2">
          {shuffledOptions.map((opt, i) => {
            const used = Object.values(selectedAnswers).includes(opt);
            return <span key={i} className={`text-xs border rounded px-2 py-1 ${used ? 'border-gray-200 text-gray-300 line-through' : 'border-gray-300 text-gray-700'}`}>{opt}</span>;
          })}
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
          {isSuccess ? '정답입니다!' : `오답 ${incorrectList.length}개가 있습니다.`}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {isChecked && !isSuccess && (
          <button onClick={handleReset} className="text-sm border border-gray-300 rounded px-4 py-2 cursor-pointer hover:bg-gray-50">초기화</button>
        )}
        {!isChecked ? (
          <button onClick={handleCheck} disabled={Object.keys(selectedAnswers).length === 0}
            className={`text-sm rounded px-4 py-2 ${Object.keys(selectedAnswers).length > 0 ? 'bg-gray-900 text-white cursor-pointer hover:bg-gray-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
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
