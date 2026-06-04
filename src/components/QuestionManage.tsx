import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Save, Edit3, X, AlertCircle } from 'lucide-react';
import { StudyItem, ItemType } from '../types';

interface QuestionManageProps {
  customItems: StudyItem[];
  onAddCustomItem: (item: StudyItem) => void;
  onDeleteCustomItem: (id: string) => void;
  onClose: () => void;
}

export default function QuestionManage({
  customItems,
  onAddCustomItem,
  onDeleteCustomItem,
  onClose
}: QuestionManageProps) {
  const [category, setCategory] = useState('특별 신앙 및 교리 암송');
  const [keyword, setKeyword] = useState('');
  const [question, setQuestion] = useState('');
  const [fullAnswer, setFullAnswer] = useState('');
  const [blanksInput, setBlanksInput] = useState('');
  const [splitByVerse, setSplitByVerse] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !question.trim() || !fullAnswer.trim()) {
      setErrorMsg('모든 필수 필드(주제명, 질문, 모범 정답)를 입력하세요.');
      return;
    }

    // Process blank list helper
    const getBlanksForText = (text: string, manualInput: string) => {
      let blanks = manualInput
        .split(',')
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      if (blanks.length === 0) {
        const candidates = text.split(/\s+/).filter(w => w.length >= 3 && w.length < 8);
        blanks = candidates.slice(0, 3);
        if (blanks.length === 0) {
          blanks = [text.split(/\s+/)[0]]; // fallback
        }
      }
      return blanks;
    };

    // If split by verse is checked and is either a split category or has linebreaks
    if (splitByVerse && (category === '특별 신앙 및 교리 암송' || fullAnswer.includes('\n'))) {
      const lines = fullAnswer
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length > 1) {
        let baseBookAndChapter = keyword;
        let startVerse = 1;

        // Extract base book/chapter prefix and starting verse number
        // (e.g. "계 21:1~4" -> "계 21:1", range: 1~4)
        const matchVerseRange = keyword.match(/(.*?)\s*(\d+)\s*[:：]\s*(\d+)\s*[\-~～]\s*(\d+)/);
        if (matchVerseRange) {
          const book = matchVerseRange[1].trim();
          const chapter = matchVerseRange[2];
          startVerse = parseInt(matchVerseRange[3], 10);
          baseBookAndChapter = `${book} ${chapter}:`;
        } else {
          // If singular references were supplied (e.g. "계 21:1")
          const matchSingleVerse = keyword.match(/(.*?)\s*(\d+)\s*[:：]\s*(\d+)/);
          if (matchSingleVerse) {
            const book = matchSingleVerse[1].trim();
            const chapter = matchSingleVerse[2];
            startVerse = parseInt(matchSingleVerse[3], 10);
            baseBookAndChapter = `${book} ${chapter}:`;
          } else {
            baseBookAndChapter = `${keyword} - `;
          }
        }

        // Loop over parsed verses and register multiple StudyItems
        lines.forEach((lineText, idx) => {
          const currentVerseNum = startVerse + idx;
          const isRangeOrColonMatch = matchVerseRange || keyword.match(/[:：]\d+/);
          const verseKeyword = isRangeOrColonMatch 
            ? `${baseBookAndChapter}${currentVerseNum}` 
            : `${baseBookAndChapter}${idx + 1}절`;

          const verseQuestion = isRangeOrColonMatch 
            ? `${baseBookAndChapter}${currentVerseNum} 성구를 암송하시오.`
            : `${verseKeyword}을 암송하시오.`;

          const blanks = getBlanksForText(lineText, blanksInput);

          const newItem: StudyItem = {
            id: `custom-${Date.now()}-${idx}`,
            type: ItemType.Verse, // Mark as Verse so it launches stage 1 automatically
            category,
            keyword: verseKeyword,
            question: verseQuestion,
            fullAnswer: lineText,
            blanks
          };

          onAddCustomItem(newItem);
        });

        // Clear only the textareas and keyword to give excellent feedback
        setKeyword('');
        setQuestion('');
        setFullAnswer('');
        setBlanksInput('');
        setErrorMsg('');
        alert(`성구 구절들이 자동 감지되어 총 ${lines.length}개의 개별 성구 카드로 세분화 및 등록 완료되었습니다!`);
        return;
      }
    }

    // Normal standard single card registration
    let blanks = getBlanksForText(fullAnswer, blanksInput);

    const missingBlanks = blanks.filter((b) => !fullAnswer.includes(b));
    if (missingBlanks.length > 0) {
      setErrorMsg(`모범 정답 안에 다음 단어가 존재하지 않습니다: "${missingBlanks.join(', ')}". 완벽하게 똑같이 입력하셔야 합니다.`);
      return;
    }

    // Assign dynamic item type based on selected category
    const actualType = category === '특별 신앙 및 교리 암송' ? ItemType.Verse : ItemType.Custom;

    const newItem: StudyItem = {
      id: `custom-${Date.now()}`,
      type: actualType,
      category,
      keyword,
      question,
      fullAnswer,
      blanks
    };

    onAddCustomItem(newItem);
    
    // Reset Form
    setKeyword('');
    setQuestion('');
    setFullAnswer('');
    setBlanksInput('');
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6" id="management-panel">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-1.5">
            ✏️ 나의 시험/암기 문제 추가 관리자
          </h2>
          <p className="text-sm text-slate-500 mt-1">내가 추가로 공부하고 외우고 싶은 다른 시험 문제들을 등록하고 구성해보세요.</p>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
        >
          학습 대시보드로 돌아가기
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Creation Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-1">
            <Plus className="w-5 h-5 text-indigo-600" /> 새 학습 카드 등록하기
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">분류 카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              >
                <option value="특별 신앙 및 교리 암송">특별 신앙 및 교리 암송 (성구용)</option>
                <option value="개인 추가 시험 공부">개인 추가 시험 공부</option>
                <option value="수료 종합 시험 기출">수료 종합 시험 기출</option>
                <option value="외국어 단어 및 구문 공부">외국어 단어 및 구문 공부</option>
              </select>
            </div>

            {(category === '특별 신앙 및 교리 암송' || category === '개인 추가 시험 공부') && (
              <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="split-by-verse-checkbox"
                  checked={splitByVerse}
                  onChange={(e) => setSplitByVerse(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="split-by-verse-checkbox" className="text-xs text-indigo-950 font-semibold cursor-pointer leading-normal">
                  성경 구절인 경우 각 절별로 문제와 답 나누어 등록하기
                  <span className="text-[10px] text-slate-400 block font-normal mt-1 leading-normal">
                    ※ 모범 정답 원본에 엔터(줄바꿈)를 쳐서 각 절을 기입해주시면, '계 21:1', '계 21:2'와 같이 각각 고유 카드로 자동 분류 및 쪼개어 등록합니다!
                  </span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">식별 키워드 / 번호 <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="예: 문제 6 (성령 지식), 단어 암기 12번"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">암기 질문 / 발문 <span className="text-rose-500">*</span></label>
              <textarea
                placeholder="예: 성경대로 지어진 하나님의 인 맞은 쳐진 144,000이 소속되는 성경 기준 장과 교단을 쓰시오."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">모범 정답 원본 (전문 전체) <span className="text-rose-500">*</span></label>
              <textarea
                placeholder="암기할 모든 정답 텍스트를 완벽하게 기입해주세요."
                value={fullAnswer}
                onChange={(e) => setFullAnswer(e.target.value)}
                rows={4}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                2단계 빈칸 단어들 (쉼표로 구분) <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                placeholder="예: 하나님의 인, 144000, 12지파"
                value={blanksInput}
                onChange={(e) => setBlanksInput(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
                ※ 정답 원문과 완전히 일치하는 단어를 입력하세요. 미기입 시 자동으로 추천 단어가 가려집니다.
              </span>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="text-xs font-medium leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
            >
              학습 세트에 추가 등록하기
            </button>
          </form>
        </div>

        {/* Existing Custom List */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex flex-col min-h-[400px]">
          <h3 className="font-bold text-slate-800 text-lg mb-2">
            📋 내가 직접 기입한 질문 세트 ({customItems.length}개)
          </h3>
          <p className="text-xs text-slate-400 mb-4">현재 보관된 나의 시험 자료 리스트입니다. 학습하기 대시보드에서 함께 출제됩니다.</p>

          <div className="flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-3 pr-1" id="custom-questions-list">
            {customItems.length === 0 ? (
              <div className="m-auto text-center py-10">
                <HelpCircle className="w-12 h-12 text-slate-300 m-auto mb-2" />
                <p className="text-slate-400 text-sm italic">현재 수동 등록된 개인 시험 문제가 없습니다.</p>
                <p className="text-xs text-slate-400 mt-1">좌측 서식을 이용하여 나만의 맞춤 암송 학습 세트를 만들어보세요.</p>
              </div>
            ) : (
              customItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 bg-slate-50/50 flex justify-between items-start gap-4 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded-full">
                        {item.category}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800">
                        {item.keyword}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-1 mb-2">Q. {item.question}</p>
                    <div className="p-2.5 bg-white border border-slate-100 rounded-lg text-xs text-slate-600 font-medium leading-relaxed">
                      <strong className="text-indigo-700 block mb-0.5">답안:</strong>
                      {item.fullAnswer}
                    </div>
                    {item.blanks && item.blanks.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-400">빈칸 지정:</span>
                        {item.blanks.map((b, i) => (
                          <span key={i} className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50/75 text-indigo-700 border border-indigo-100 rounded-md">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => onDeleteCustomItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="항목 제거"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
