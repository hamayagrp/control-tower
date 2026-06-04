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

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('app_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

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
          status: status || "-", // シートの文字をそのまま表示（未知のステータスにも対応！）
          note: note || "",
          fileUrl: fileUrl || "",
          dandoriUrl: dandoriUrl || "",
        };
      }
    });
    return formatted;
  };

  useEffect(() => {
    if (!isAuthenticated) return;

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
  
  // ▼ リスト表示用のデータ（1日〜月末まで順番に並べる）
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const listDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    return { day, weekDay: weekDays[dateObj.getDay()], dateStr, dayOfWeek: dateObj.getDay() };
  });

  // ▼ カレンダー表示用のデータ（空白のマス目も計算する）
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const calendarGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.push(null); // 月初の空白
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);       // 日付
  const remainingSlots = (7 - (calendarGrid.length % 7)) % 7;
  for (let i = 0; i < remainingSlots; i++) calendarGrid.push(null);  // 月末の空白

  const getDayColor = (dayOfWeek: number) => {
    if (dayOfWeek === 0) return 'text-rose-500';
    if (dayOfWeek === 6) return 'text-blue-500';
    return 'text-slate-700';
  };

  // 📝 セルの中身を描画する関数（汎用）
  const renderCellData = (data: SheetData | undefined, isLoading: boolean) => {
    if (isLoading) return <span className="text-slate-400 text-sm animate-pulse">読込中...</span>;
    if (!data) return <span className="text-slate-300">-</span>;
    
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <span className="text-sm font-bold text-slate-700 break-words text-center">
          {data.status !== '-' ? data.status : ''}
        </span>
        {(data.dandoriUrl || data.fileUrl || data.note) && (
          <div className="flex flex-wrap justify-center items-center gap-1.5 mt-1.5">
            {data.dandoriUrl && <span title="ダンドリワーク"><LinkIcon size={16} className="text-blue-500" /></span>}
            {data.fileUrl && <span title="添付ファイル"><Paperclip size={16} className="text-slate-500" /></span>}
            {data.note && <span title={data.note}><MessageSquare size={16} className="text-amber-500" /></span>}
          </div>
        )}
      </div>
    );
  };

  // 🔓 ログイン画面（明るい爽やかデザイン）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={28} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">協力会社アプリスケジュール用</h1>
          <p className="text-sm text-slate-500 mb-6">関係者限定ページです。合言葉を入力してください。</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="パスワードを入力"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full bg-white border ${passwordError ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'} rounded-xl px-4 py-3 text-slate-800 text-center focus:outline-none focus:ring-4 placeholder-slate-400 transition-all`}
              />
              {passwordError && (
                <p className="text-rose-500 text-xs text-left mt-2 pl-1">※ パスワードが正しくありません。</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-blue-600/20"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 🔓 本番画面
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto mb-6 bg-white rounded-xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm border border-slate-200 gap-4">
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
          <button onClick={handlePrevMonth} className="p-1 text-slate-500 hover:text-blue-600 transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-slate-800 font-bold text-lg min-w-[120px] text-center">
            {year}年 {month + 1}月
          </span>
          <button onClick={handleNextMonth} className="p-1 text-slate-500 hover:text-blue-600 transition-colors"><ChevronRight size={20} /></button>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setActiveView('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${activeView === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
            <LayoutGrid size={16} /> 全体マトリクス
          </button>
          <button 
            onClick={() => setActiveView('hasegawa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${activeView === 'hasegawa' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
            <Calendar size={16} /> 長谷川ガラス
          </button>
          <button 
            onClick={() => setActiveView('demo2')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${activeView === 'demo2' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
            <Calendar size={16} /> デモ②
          </button>
          <button 
            onClick={() => setActiveView('demo3')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${activeView === 'demo3' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
            <Calendar size={16} /> デモ③
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* =========================================
            パターンA: 全体マトリクス（リスト表示）
        ========================================= */}
        {activeView === 'all' && (
          <div>
            <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-100">
              <div className="p-4 font-bold text-center text-slate-600 border-r border-slate-200">日付</div>
              <div className="p-4 font-bold text-center text-slate-800 border-r border-slate-200">長谷川ガラス</div>
              <div className="p-4 font-bold text-center text-slate-800 border-r border-slate-200">デモ②</div>
              <div className="p-4 font-bold text-center text-slate-800">デモ③</div>
            </div>
            <div className="divide-y divide-slate-100">
              {listDays.map(({ day, weekDay, dateStr, dayOfWeek }) => (
                <div key={day} className="grid grid-cols-4 hover:bg-blue-50/50 transition-colors">
                  <div className={`p-3 border-r border-slate-100 flex flex-col items-center justify-center ${getDayColor(dayOfWeek)}`}>
                    <span className="text-lg font-bold">{day}</span>
                    <span className="text-xs font-bold">({weekDay})</span>
                  </div>
                  <div className="p-3 border-r border-slate-100 flex flex-col items-center justify-center min-h-[70px]">
                    {renderCellData(hasegawaData[dateStr], loading)}
                  </div>
                  <div className="p-3 border-r border-slate-100 flex flex-col items-center justify-center min-h-[70px]">
                    {renderCellData(demo2Data[dateStr], loading)}
                  </div>
                  <div className="p-3 flex flex-col items-center justify-center min-h-[70px]">
                    {renderCellData(demo3Data[dateStr], loading)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            パターンB: 個別企業（月間ブロックカレンダー表示）
        ========================================= */}
        {activeView !== 'all' && (
          <div>
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                <div key={day} className={`p-3 font-bold text-center text-sm border-r border-slate-200 last:border-0 ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100">
              {calendarGrid.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-[120px] bg-slate-50 border-r border-b border-slate-100"></div>;

                const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
                const dayOfWeek = index % 7;
                
                // 選択されている企業のデータを抽出
                let targetData;
                if (activeView === 'hasegawa') targetData = hasegawaData[dateStr];
                else if (activeView === 'demo2') targetData = demo2Data[dateStr];
                else if (activeView === 'demo3') targetData = demo3Data[dateStr];

                return (
                  <div key={day} className="min-h-[120px] p-2 border-r border-b border-slate-100 hover:bg-blue-50/30 transition-colors flex flex-col group">
                    <div className={`text-right text-sm font-bold mb-1 ${getDayColor(dayOfWeek)}`}>
                      {day}
                    </div>
                    <div className="flex-grow flex flex-col items-center justify-center bg-slate-50 rounded-lg p-2 group-hover:bg-white transition-colors border border-transparent group-hover:border-blue-100">
                      {renderCellData(targetData, loading)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}