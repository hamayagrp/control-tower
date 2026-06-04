"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar, Link as LinkIcon, Paperclip, MessageSquare, Lock } from 'lucide-react';

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

  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1));
  const [activeView, setActiveView] = useState('all');

  // 🔒 パスワード認証用の状態管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // 画面が開いたときに、すでにパスワード入力済かチェック（記憶機能）
  useEffect(() => {
    const authStatus = localStorage.getItem('app_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // パスワードチェック処理
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Hamay@') {
      localStorage.setItem('app_authenticated', 'true');
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

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
    if (!isAuthenticated) return; // 認証されるまではデータを読み込まない

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
  }, [isAuthenticated]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
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

  // 🔒 まだパスワードが合致していない場合は、ログイン画面を表示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 font-sans text-slate-300">
        <div className="max-w-md w-full bg-[#151E32] rounded-2xl p-8 shadow-2xl border border-slate-800 text-center">
          <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={28} className="text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">協力会社アプリスケジュール用</h1>
          <p className="text-sm text-slate-400 mb-6">関係者限定ページです。合言葉を入力してください。</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="パスワードを入力"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full bg-[#0B1120] border ${passwordError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-700 focus:ring-blue-500'} rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:ring-2 placeholder-slate-600 transition-all`}
              />
              {passwordError && (
                <p className="text-rose-400 text-xs text-left mt-2 pl-1">※ パスワードが正しくありません。</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  const gridColsClass = activeView === 'all' ? 'grid-cols-4' : 'grid-cols-2';

  // 🔓 認証済みの場合はいつものカレンダー画面を表示
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 p-4 md:p-8 font-sans">
      
      {/* ヘッダー部分 */}
      <div className="max-w-7xl mx-auto mb-8 bg-[#151E32] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between shadow-lg border border-slate-800 gap-4">
        <div className="flex items-center gap-4 bg-[#0B1120] px-4 py-2 rounded-lg border border-slate-700">
          <button onClick={handlePrevMonth} className="p-1 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-white font-bold text-lg min-w-[120px] text-center">
            {year}年 {month + 1}月
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:text-white transition-colors"><ChevronRight size={20} /></button>
        </div>
        
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
        <div className={`grid ${gridColsClass} border-b border-slate-700/50 bg-[#0F172A]`}>
          <div className="p-4 font-bold text-center text-slate-400 border-r border-slate-700/50">日付</div>
          {(activeView === 'all' || activeView === 'hasegawa') && <div className={`p-4 font-bold text-center text-blue-400 ${activeView === 'all' ? 'border-r border-slate-700/50' : ''}`}>長谷川ガラス</div>}
          {(activeView === 'all' || activeView === 'demo2') && <div className={`p-4 font-bold text-center text-emerald-400 ${activeView === 'all' ? 'border-r border-slate-700/50' : ''}`}>デモ②</div>}
          {(activeView === 'all' || activeView === 'demo3') && <div className="p-4 font-bold text-center text-amber-400">デモ③</div>}
        </div>

        <div className="divide-y divide-slate-700/50">
          {calendarDays.map(({ day, weekDay, dateStr }) => {
            const hgData = hasegawaData[dateStr];
            const d2Data = demo2Data[dateStr];
            const d3Data = demo3Data[dateStr];

            return (
              <div key={day} className={`grid ${gridColsClass} hover:bg-[#1E293B] transition-colors group`}>
                <div className={`p-3 border-r border-slate-700/50 flex flex-col items-center justify-center
                  ${weekDay === '日' ? 'text-rose-400' : weekDay === '土' ? 'text-blue-400' : 'text-slate-300'}`}>
                  <span className="text-lg font-bold">{day}</span>
                  <span className="text-xs font-medium">({weekDay})</span>
                </div>

                {(activeView === 'all' || activeView === 'hasegawa') && (
                  <div className={`p-3 flex flex-col items-center justify-center relative min-h-[60px] ${activeView === 'all' ? 'border-r border-slate-700/50' : ''}`}>
                    {renderCell(hgData, loading, 'text-white')}
                  </div>
                )}

                {(activeView === 'all' || activeView === 'demo2') && (
                  <div className={`p-3 flex flex-col items-center justify-center relative min-h-[60px] ${activeView === 'all' ? 'border-r border-slate-700/50' : ''}`}>
                    {renderCell(d2Data, loading, 'text-emerald-100')}
                  </div>
                )}

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