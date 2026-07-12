import React, { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { StudyItem, ItemType } from '../types';
import { calculateSimilarity } from '../utils';

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
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.\nChrome을 사용해주세요.');
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setUserAnswer(prev => prev + (prev ? ' ' : '') + transcript);
          setInterimText('');
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
    };
    recognition.onend = () => { setIsRecording(false); setInterimText(''); };
    recognition.onerror = () => { setIsRecording(false); setInterimText(''); };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const handleCheck = () => {
    const computedScore = calculateSimilarity(userAnswer, item.fullAnswer);
    setScore(computedScore);
    setIsChecked(true);
    if (computedScore < 85 && onIncorrect) onIncorrect(item.id);
  };

  const handleReset = () => {
    setUserAnswer('');
    setIsChecked(false);
    setScore(0);
    setShowHint(false);
  };

  const renderDiff = () => {
    const actualWords = item.fullAnswer.trim().split(/\s+/);
    const userWords = userAnswer.trim().split(/\s+/);
    return (
      <div className="flex flex-wrap gap-1 p-3 border border-gray-200 rounded bg-gray-50">
        {actualWords.map((word, idx) => {
          const matched = userWords.some(uw => uw === word || uw.includes(word) || word.includes(uw) || calculateSimilarity(uw, word) > 70);
          return (
            <span key={idx} className={`text-sm px-1 rounded ${matched ? 'bg-blue-100 text-blue-900' : 'text-gray-300 line-through'}`}>
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs text-gray-500">{item.type === ItemType.Verse ? '3단계 — 백지 쓰기' : '3단계 — 전체 작성'}</span>
          <h2 className="text-base font-bold mt-0.5">{item.keyword}</h2>
          <p className="text-xs text-gray-500">{item.category}</p>
        </div>
        <button onClick={onExit} className="text-xs border border-gray-300 rounded px-2 py-1 cursor-pointer hover:bg-gray-50 shrink-0">종료</button>
      </div>

      <div className="border border-gray-200 rounded p-3 mb-4 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">질문</p>
        <p className="text-sm text-gray-800">{item.question}</p>
      </div>

      {/* Writing area */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-500">답변 작성:</p>
          <div className="flex items-center gap-2">
            {!isChecked && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer ${isRecording ? 'border-red-400 text-red-600 bg-red-50' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
              >
                {isRecording ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" /><MicOff className="w-3 h-3" /> 중지</>
                ) : (
                  <><Mic className="w-3 h-3" /> 음성</>
                )}
              </button>
            )}
            <span className="text-xs text-gray-400">최대 {item.fullAnswer.length * 2}자</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={userAnswer}
            onChange={e => { if (!isChecked) setUserAnswer(e.target.value); }}
            disabled={isChecked}
            placeholder="전체 원문을 작성하세요..."
            rows={6}
            className={`w-full border rounded p-3 text-sm resize-none focus:outline-none ${isChecked ? (score >= 85 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : isRecording ? 'border-red-300' : 'border-gray-300'}`}
          />
          {userAnswer.length > 0 && !isChecked && (
            <button onClick={() => setUserAnswer('')} className="absolute bottom-2 right-2 text-xs text-gray-400 hover:text-gray-700 cursor-pointer">지우기</button>
          )}
        </div>

        {interimText && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">인식 중: {interimText}</p>
        )}
      </div>

      {/* Hint */}
      <div className="mb-4">
        {item.type === ItemType.Verse ? (
          <p className="text-xs text-gray-400">백지 단계 — 힌트 없음</p>
        ) : (
          <>
            <button onClick={() => setShowHint(!showHint)} className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer underline">
              {showHint ? '힌트 숨기기' : '힌트 보기 (첫 글자)'}
            </button>
            {showHint && (
              <div className="text-xs text-gray-600 mt-2 p-2 border border-gray-200 rounded">
                단어 수: {item.fullAnswer.split(' ').length}개 / 글자 수: {item.fullAnswer.length}자 / 시작: "{item.fullAnswer.substring(0, 10)}..."
              </div>
            )}
          </>
        )}
      </div>

      {/* Result */}
      {isChecked && (
        <div className="border border-gray-200 rounded p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">채점 결과</span>
            <span className={`text-lg font-bold ${score >= 90 ? 'text-green-700' : score >= 70 ? 'text-blue-600' : 'text-red-600'}`}>{score}점</span>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">단어 일치도:</p>
            {renderDiff()}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-1">정답:</p>
            <p className="text-sm font-semibold text-gray-900">{item.fullAnswer}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {isChecked ? (
          <>
            <button onClick={handleReset} className="text-sm border border-gray-300 rounded px-4 py-2 cursor-pointer hover:bg-gray-50">다시 쓰기</button>
            <button onClick={() => onCompleted(score)} className="text-sm bg-gray-900 text-white rounded px-4 py-2 cursor-pointer hover:bg-gray-700">완료</button>
          </>
        ) : (
          <button onClick={handleCheck} disabled={userAnswer.trim().length === 0}
            className={`text-sm rounded px-4 py-2 ${userAnswer.trim().length > 0 ? 'bg-gray-900 text-white cursor-pointer hover:bg-gray-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            채점하기
          </button>
        )}
      </div>
    </div>
  );
}
