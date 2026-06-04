"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar, Link as LinkIcon, Paperclip, MessageSquare, Lock, Check } from 'lucide-react';

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
  
  const [viewMode, setViewMode] = useState<'calendar' | 'matrix'>('calendar');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(['hasegawa']); 

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('app_authenticated');
    if (authStatus === 'true') setIsAuthenticated(true);
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

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId) 
        : [...prev, companyId]
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const listDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    return { day, weekDay: weekDays[dateObj.getDay()], dateStr, dayOfWeek: dateObj.getDay() };
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const calendarGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);
  const remainingSlots = (7 - (calendarGrid.length % 7)) % 7;
  for (let i = 0; i < remainingSlots; i++) calendarGrid.push(null);

  const getDayColor = (dayOfWeek: number) => {
    if (dayOfWeek === 0) return 'text-rose-500';
    if (dayOfWeek === 6) return 'text-blue-500';
    return 'text-slate-700';
  };

  // 🌟 カレンダー表示用のセル（アイコンをクリックできるように修正！）
  const renderCompactCell = (label: string, data: SheetData | undefined, colorClass: string, isLoading: boolean) => {
    if (isLoading) return null;
    const statusText = data?.status || "-";
    const isBlank = statusText === '-';

    return (
      <div className={`flex items-center gap-1.5 w-full text-xs mb-1 p-1 rounded-md transition-colors ${isBlank ? 'opacity-50 hover:opacity-100' : 'bg-white shadow-sm border border-slate-100'}`}>
        <span className={`font-bold shrink-0 ${colorClass}`}>[{label}]</span>
        <span className={`font-bold truncate ${isBlank ? 'text-slate-400 font-normal' : 'text-slate-700'}`}>
          {statusText}
        </span>
        {(data?.dandoriUrl || data?.fileUrl || data?.note) && (
          <div className="flex shrink-0 gap-1.5 ml-auto items-center">
            {/* 🔗 ダンドリワークリンク */}
            {data.dandoriUrl && (
              <a href={data.dandoriUrl} target="_blank" rel="noopener noreferrer" title="ダンドリワークを開く" className="hover:scale-125 hover:text-blue-700 transition-transform">
                <LinkIcon size={12} className="text-blue-500" />
              </a>
            )}
            {/* 📎 添付ファイルリンク */}
            {data.fileUrl && (
              <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" title="添付ファイルを開く" className="hover:scale-125 hover:text-slate-600 transition-transform">
                <Paperclip size={12} className="text-slate-400" />
              </a>
            )}
            {data.note && <span title={data.note}><MessageSquare size={12} className="text-amber-500" /></span>}
          </div>
        )}
      </div>
    );
  };

  // 🌟 マトリクス（リスト）表示用のセル（アイコンをクリックできるように修正！）
  const renderMatrixCell = (data: SheetData | undefined, isLoading: boolean) => {
    if (isLoading) return <span className="text-slate-400 text-sm animate-pulse">読込中...</span>;
    if (!data) return <span className="text-slate-300">-</span>;
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <span className="text-sm font-bold text-slate-700 break-words text-center">
          {data.status !== '-' ? data.status : ''}
        </span>
        {(data.dandoriUrl || data.fileUrl || data.note) && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-1.5">
            {/* 🔗 ダンドリワークリンク */}
            {data.dandoriUrl && (
              <a href={data.dandoriUrl} target="_blank" rel="noopener noreferrer" title="ダンドリワークを開く" className="hover:scale-125 hover:text-blue-700 transition-transform p-0.5">
                <LinkIcon size={16} className="text-blue-500" />
              </a>
            )}
            {/* 📎 添付ファイルリンク */}
            {data.fileUrl && (
              <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" title="添付ファイルを開く" className="hover:scale-125 hover:text-slate-700 transition-transform p-0.5">
                <Paperclip size={16} className="text-slate-500" />
              </a>
            )}
            {data.note && <span title={data.note}><MessageSquare size={16} className="text-amber-500" /></span>}
          </div>
        )}
      </div>
    );
  };

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
              <input type="password" placeholder="パスワードを入力" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className={`w-full bg-white border ${passwordError ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'} rounded-xl px-4 py-3 text-slate-800 text-center focus:outline-none focus:ring-4 placeholder-slate-400 transition-all`} />
              {passwordError && <p className="text-rose-500 text-xs text-left mt-2 pl-1">※ パスワードが正しくありません。</p>}
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-blue-600/20">ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto mb-6 bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <button onClick={handlePrevMonth} className="p-1 text-slate-500 hover:text-blue-600 transition-colors"><ChevronLeft size={20} /></button>
            <span className="text-slate-800 font-bold text-lg min-w-[120px] text-center">{year}年 {month + 1}月</span>
            <button onClick={handleNextMonth} className="p-1 text-slate-500 hover:text-blue-600 transition-colors"><ChevronRight size={20} /></button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Calendar size={16} /> カレンダー
            </button>
            <button onClick={() => setViewMode('matrix')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'matrix' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutGrid size={16} /> マトリクス
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm font-bold text-slate-500">表示する企業:</span>
          <button onClick={() => toggleCompany('hasegawa')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCompanies.includes('hasegawa') ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
            {selectedCompanies.includes('hasegawa') && <Check size={14} />} 長谷川ガラス
          </button>
          <button onClick={() => toggleCompany('demo2')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCompanies.includes('demo2') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
            {selectedCompanies.includes('demo2') && <Check size={14} />} デモ②
          </button>
          <button onClick={() => toggleCompany('demo3')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCompanies.includes('demo3') ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
            {selectedCompanies.includes('demo3') && <Check size={14} />} デモ③
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {viewMode === 'calendar' && (
          <div>
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                <div key={day} className={`p-3 font-bold text-center text-sm border-r border-slate-200 last:border-0 ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100">
              {calendarGrid.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-[140px] bg-slate-50 border-r border-b border-slate-100"></div>;
                const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
                const dayOfWeek = index % 7;
                return (
                  <div key={day} className="min-h-[140px] p-1.5 border-r border-b border-slate-100 flex flex-col group hover:bg-slate-50 transition-colors">
                    <div className={`text-right text-xs font-bold mb-2 pr-1 ${getDayColor(dayOfWeek)}`}>{day}</div>
                    <div className="flex-grow flex flex-col w-full gap-1 overflow-hidden">
                      {loading && <div className="text-slate-400 text-xs pl-1">読込中...</div>}
                      {!loading && selectedCompanies.includes('hasegawa') && renderCompactCell('長谷川', hasegawaData[dateStr], 'text-blue-600', loading)}
                      {!loading && selectedCompanies.includes('demo2') && renderCompactCell('デモ②', demo2Data[dateStr], 'text-emerald-600', loading)}
                      {!loading && selectedCompanies.includes('demo3') && renderCompactCell('デモ③', demo3Data[dateStr], 'text-amber-600', loading)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'matrix' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${Math.max(1, selectedCompanies.length)}, minmax(0, 1fr))` }} className="border-b border-slate-200 bg-slate-100">
              <div className="p-4 font-bold text-center text-slate-600 border-r border-slate-200">日付</div>
              {selectedCompanies.includes('hasegawa') && <div className="p-4 font-bold text-center text-blue-600 border-r border-slate-200">長谷川ガラス</div>}
              {selectedCompanies.includes('demo2') && <div className="p-4 font-bold text-center text-emerald-600 border-r border-slate-200">デモ②</div>}
              {selectedCompanies.includes('demo3') && <div className="p-4 font-bold text-center text-amber-400">デモ③</div>}
            </div>
            <div className="divide-y divide-slate-100">
              {listDays.map(({ day, weekDay, dateStr, dayOfWeek }) => (
                <div key={day} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${Math.max(1, selectedCompanies.length)}, minmax(0, 1fr))` }} className="hover:bg-blue-50/50 transition-colors">
                  <div className={`p-3 border-r border-slate-100 flex flex-col items-center justify-center ${getDayColor(dayOfWeek)}`}>
                    <span className="text-lg font-bold">{day}</span>
                    <span className="text-xs font-bold">({weekDay})</span>
                  </div>
                  {selectedCompanies.includes('hasegawa') && <div className="p-3 border-r border-slate-100 flex flex-col items-center justify-center min-h-[60px]">{renderMatrixCell(hasegawaData[dateStr], loading)}</div>}
                  {selectedCompanies.includes('demo2') && <div className="p-3 border-r border-slate-100 flex flex-col items-center justify-center min-h-[60px]">{renderMatrixCell(demo2Data[dateStr], loading)}</div>}
                  {selectedCompanies.includes('demo3') && <div className="p-3 flex flex-col items-center justify-center min-h-[60px]">{renderMatrixCell(demo3Data[dateStr], loading)}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}