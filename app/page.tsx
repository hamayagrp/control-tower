"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar, Link as LinkIcon, Paperclip, MessageSquare } from 'lucide-react';

type SheetData = {
  date: string;
  status: string;
  note: string;
  fileUrl: string;
  dandoriUrl: string;
};

export default function ControlTower() {
  const [hasegawaData, setHasegawaData] = useState<Record<string, SheetData>>({});
  const [demo2Data, setDemo2Data] = useState<Record<string, SheetData>>({});
  const [demo3Data, setDemo3Data] = useState<Record<string, SheetData>>({});
  const [loading, setLoading] = useState(true);

  // 🌟 新しく追加した魔法（状態管理）
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // 現在の表示月（初期値は2026年6月）
  const [activeView, setActiveView] = useState('all'); // 現在の表示モード（'all', 'hasegawa', 'demo2', 'demo3'）

  const formatSheetData = (rows: any[]) => {
    const formatted: Record<string, SheetData> = {};
    if (!rows || rows.length === 0) return formatted;
    
    rows.slice(1).forEach((row: string[]) => {
      const [date, status, note, fileUrl, dandoriUrl] = row;
      if (date) {
        formatted[date] = {
          date: date || "",
          status: status || "-",
          note: note || "",
          fileUrl: fileUrl || "",
          dandoriUrl: dandoriUrl || "",
        };
      }
    });
    return formatted;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheets');
        const json = await res.json();
        
        if (json) {
          setHasegawaData(formatSheetData(json.hasegawa));
          setDemo2Data(formatSheetData(json.demo2));
          setDemo3Data(formatSheetData(json.demo3));
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🌟 月を切り替えるボタンの処理
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 🌟 表示中の月に合わせてカレンダーの日付を自動生成する処理
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // その月が何日まであるか自動計算

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    // YYYY/MM/DD 形式にする（例: 2026/06/01）
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekDay = weekDays[dateObj.getDay()];
    return { day, weekDay, dateStr };
  });

  const renderCell = (data: SheetData, isLoading: boolean, defaultTextColor: string) => {
    if (isLoading) return <span className="text-slate-500 animate-pulse">読込中...</span>;
    const statusText = data?.status || "-";
    return (
      <>
        <span className={`text-sm font-medium ${statusText !== '-' ? defaultTextColor : 'text-slate-600'}`}>
          {statusText}
        </span>
        {(data?.dandoriUrl || data?.fileUrl || data?.note) && (
          <div className="flex items-center gap-1.5 mt-1">
            {data.dandoriUrl && <span title="ダンドリワーク登録済"><LinkIcon size={14} className="text-cyan-400" /></span>}
            {data.fileUrl && <span title="添付ファイルあり"><Paperclip size={14} className="text-slate-400" /></span>}
            {data.note && <span title={data.note}><MessageSquare size={14} className="text-amber-400" /></span>}
          </div>
        )}
      </>
    );
  };

  // 🌟 表示モードによって列の数（4列か2列か）を変える
  const gridColsClass = activeView === 'all' ? 'grid-cols-4' : 'grid-cols-2';

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 p-4 md:p-8 font-sans">
      
      {/* ヘッダー部分 */}
      <div className="max-w-7xl mx-auto mb-8 bg-[#151E32] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between shadow-lg border border-slate-800 gap-4">
        
        {/* 年月切り替えボタン */}
        <div className="flex items-center gap-4 bg-[#0B1120] px-4 py-2 rounded-lg border border-slate-700">
          <button onClick={handlePrevMonth} className="p-1 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-white font-bold text-lg min-w-[120px] text-center">
            {year}年 {month + 1}月
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:text-white transition-colors"><ChevronRight size={20} /></button>
        </div>
        
        {/* タブ切り替えボタン（選択されているものは青く光るように変更！） */}
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setActiveView('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeView === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#1E293B] text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
            <LayoutGrid size={16} /> 全体マトリクス
          </button>
          <button 
            onClick={() => setActiveView('hasegawa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeView === 'hasegawa' ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#1E293B] text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
            <Calendar size={16} /> 長谷川ガラス
          </button>
          <button 
            onClick={() => setActiveView('demo2')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeView === 'demo2' ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#1E293B] text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
            <Calendar size={16} /> デモ②
          </button>
          <button 
            onClick={() => setActiveView('demo3')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${activeView === 'demo3' ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#1E293B] text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
            <Calendar size={16} /> デモ③
          </button>
        </div>
      </div>

      {/* カレンダーテーブル */}
      <div className="max-w-7xl mx-auto bg-[#151E32] rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* テーブル見出し（タブの選択に合わせて出し分ける） */}
        <div className={`grid ${gridColsClass} border-b border-slate-700/50 bg-[#0F172A]`}>
          <div className="p-4 font-bold text-center text-slate-400 border-r border-slate-700/50">日付</div>
          {(activeView === 'all' || activeView === 'hasegawa') && <div className={`p-4 font-bold text-center text-blue-400 ${activeView === 'all' ? 'border-r border-slate-700/50' : ''}`}>長谷川ガラス</div>}
          {(activeView === 'all' || activeView === 'demo2') && <div className={`p-4 font-bold text-center text-emerald-400 ${activeView === 'all' ? 'border-r border-slate-700/50' : ''}`}>デモ②</div>}
          {(activeView === 'all' || activeView === 'demo3') && <div className="p-4 font-bold text-center text-amber-400">デモ③</div>}
        </div>

        {/* テーブル本体 */}
        <div className="divide-y divide-slate-700/50">
          {calendarDays.map(({ day, weekDay, dateStr }) => {
            const hgData = hasegawaData[dateStr];
            const d2Data = demo2Data[dateStr];
            const d3Data = demo3Data[dateStr];

            return (
              <div key={day} className={`grid ${gridColsClass} hover:bg-[#1E293B] transition-colors group`}>
                
                {/* 日付セル */}
                <div className={`p-3 border-r border-slate-700/50 flex flex-col items-center justify-center
                  ${weekDay === '日' ? 'text-rose-400' : weekDay === '土' ? 'text-blue-400' : 'text-slate-300'}`}>
                  <span className="text-lg font-bold">{day}</span>
                  <span className="text-xs font-medium">({weekDay})</span>
                </div>

                {/* 長谷川ガラス セル */}
                {(activeView === 'all' || activeView === 'hasegawa') && (
                  <div className={`p-3 flex flex-col items-center justify-center relative min-h-[60px] ${activeView === 'all' ? 'border-r border-slate-700/50' : ''}`}>
                    {renderCell(hgData, loading, 'text-white')}
                  </div>
                )}

                {/* デモ② セル */}
                {(activeView === 'all' || activeView === 'demo2') && (
                  <div className={`p-3 flex flex-col items-center justify-center relative min-h-[60px] ${activeView === 'all' ? 'border-r border-slate-700/50' : ''}`}>
                    {renderCell(d2Data, loading, 'text-emerald-100')}
                  </div>
                )}

                {/* デモ③ セル */}
                {(activeView === 'all' || activeView === 'demo3') && (
                  <div className="p-3 flex flex-col items-center justify-center relative min-h-[60px]">
                    {renderCell(d3Data, loading, 'text-amber-100')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}