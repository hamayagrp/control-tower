"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar, Link as LinkIcon, Paperclip, MessageSquare } from 'lucide-react';

// データの型定義
type SheetData = {
  date: string;
  status: string;
  note: string;
  fileUrl: string;
  dandoriUrl: string;
};

export default function ControlTower() {
  const [hasegawaData, setHasegawaData] = useState<Record<string, SheetData>>({});
  const [loading, setLoading] = useState(true);

  // 裏側のパイプ（API）からデータを吸い上げる処理
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheets');
        const json = await res.json();
        
        if (json.data) {
          const formattedData: Record<string, SheetData> = {};
          // スプレッドシートの1行目（ヘッダー）を飛ばしてデータを保存
          json.data.slice(1).forEach((row: string[]) => {
            const [date, status, note, fileUrl, dandoriUrl] = row;
            if (date) {
              formattedData[date] = {
                date: date || "",
                status: status || "-",
                note: note || "",
                fileUrl: fileUrl || "",
                dandoriUrl: dandoriUrl || "",
              };
            }
          });
          setHasegawaData(formattedData);
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // カレンダーの日付生成 (2026年6月)
  const daysInMonth = 30;
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    // スプレッドシートの YYYY/MM/DD 形式に合わせる
    const dateStr = `2026/06/${day.toString().padStart(2, '0')}`;
    const dateObj = new Date(2026, 5, day);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekDay = weekDays[dateObj.getDay()];
    return { day, weekDay, dateStr };
  });

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 p-4 md:p-8 font-sans">
      
      {/* ヘッダー部分 */}
      <div className="max-w-7xl mx-auto mb-8 bg-[#151E32] rounded-xl p-4 flex items-center justify-between shadow-lg border border-slate-800">
        <div className="flex items-center gap-4 bg-[#0B1120] px-4 py-2 rounded-lg border border-slate-700">
          <button className="p-1 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-white font-bold text-lg min-w-[100px] text-center">2026年 6月</span>
          <button className="p-1 hover:text-white transition-colors"><ChevronRight size={20} /></button>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <LayoutGrid size={16} /> 全体マトリクス
          </button>
          <button className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
            <Calendar size={16} /> 長谷川ガラス
          </button>
          <button className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
            <Calendar size={16} /> デモ②
          </button>
          <button className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
            <Calendar size={16} /> デモ③
          </button>
        </div>
      </div>

      {/* カレンダーテーブル */}
      <div className="max-w-7xl mx-auto bg-[#151E32] rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-4 border-b border-slate-700/50 bg-[#0F172A]">
          <div className="p-4 font-bold text-center text-slate-400 border-r border-slate-700/50">日付</div>
          <div className="p-4 font-bold text-center text-blue-400 border-r border-slate-700/50">長谷川ガラス</div>
          <div className="p-4 font-bold text-center text-emerald-400 border-r border-slate-700/50">デモ②</div>
          <div className="p-4 font-bold text-center text-amber-400">デモ③</div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {calendarDays.map(({ day, weekDay, dateStr }) => {
            // スプレッドシートのデータから、この日付のデータを引っ張ってくる
            const hgData = hasegawaData[dateStr];
            const statusText = hgData?.status || "-";

            return (
              <div key={day} className="grid grid-cols-4 hover:bg-[#1E293B] transition-colors group">
                {/* 日付セル */}
                <div className={`p-3 border-r border-slate-700/50 flex flex-col items-center justify-center
                  ${weekDay === '日' ? 'text-rose-400' : weekDay === '土' ? 'text-blue-400' : 'text-slate-300'}`}>
                  <span className="text-lg font-bold">{day}</span>
                  <span className="text-xs font-medium">({weekDay})</span>
                </div>

                {/* 長谷川ガラス セル */}
                <div className="p-3 border-r border-slate-700/50 flex flex-col items-center justify-center relative min-h-[60px]">
                  {loading ? (
                    <span className="text-slate-500 animate-pulse">読込中...</span>
                  ) : (
                    <>
                      <span className={`text-sm font-medium ${statusText !== '-' ? 'text-white' : 'text-slate-600'}`}>
                        {statusText}
                      </span>
                      {/* 備考やURLがある場合のみアイコンを表示 */}
                      {(hgData?.dandoriUrl || hgData?.fileUrl || hgData?.note) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {hgData.dandoriUrl && <span title="ダンドリワーク登録済"><LinkIcon size={14} className="text-cyan-400" /></span>}
                          {hgData.fileUrl && <span title="添付ファイルあり"><Paperclip size={14} className="text-slate-400" /></span>}
                          {hgData.note && <span title={hgData.note}><MessageSquare size={14} className="text-amber-400" /></span>}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* デモ② セル */}
                <div className="p-3 border-r border-slate-700/50 flex items-center justify-center">
                  <span className="text-slate-600">-</span>
                </div>

                {/* デモ③ セル */}
                <div className="p-3 flex items-center justify-center">
                  <span className="text-slate-600">-</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}