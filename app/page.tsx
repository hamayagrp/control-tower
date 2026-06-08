"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar, Link as LinkIcon, Paperclip, MessageSquare, Lock, Check, X } from 'lucide-react';

type SheetData = {
  date: string;
  status: string;
  note: string;
  fileUrl: string;
  dandoriUrl: string;
};

// 2026年の日本の祝日データ
const HOLIDAYS_2026: Record<string, string> = {
  '2026/01/01': '元日',
  '2026/01/12': '成人の日',
  '2026/02/11': '建国記念の日',
  '2026/02/23': '天皇誕生日',
  '2026/03/20': '春分の日',
  '2026/04/29': '昭和の日',
  '2026/05/03': '憲法記念日',
  '2026/05/04': 'みどりの日',
  '2026/05/05': 'こどもの日',
  '2026/05/06': '振替休日',
  '2026/07/20': '海の日',
  '2026/08/11': '山の日',
  '2026/09/21': '敬老の日',
  '2026/09/22': '国民の休日',
  '2026/09/23': '秋分の日',
  '2026/10/12': 'スポーツの日',
  '2026/11/03': '文化の日',
  '2026/11/23': '勤労感謝の日',
};

// ステータス文字色の判定
const getStatusColorClass = (status: string) => {
  if (!status || status === '-') return 'text-slate-400 font-normal';
  if (status.includes('指定なし')) return 'text-blue-600 font-bold';
  if (status.includes('AM') || status.includes('朝')) return 'text-emerald-600 font-bold';
  if (status.includes('相談') || status.includes('残り')) return 'text-orange-500 font-bold';
  if (status.includes('なし') || status.includes('不可')) return 'text-rose-600 font-bold';
  if (status.includes('定休') || status.includes('休')) return 'text-slate-500 font-bold';
  return 'text-slate-700 font-bold';
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

  // 🌟 ポップアップウィンドウ（詳細モーダル）用の状態管理
  const [selectedEvent, setSelectedEvent] = useState<{
    date: string;
    company: string;
    data: SheetData;
  } | null>(null);

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
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const listDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const holidayName = HOLIDAYS_2026[dateStr] || '';
    return { day, weekDay: weekDays[dateObj.getDay()], dateStr, dayOfWeek: dateObj.getDay(), isHoliday: !!holidayName, holidayName };
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const calendarGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);
  const remainingSlots = (7 - (calendarGrid.length % 7)) % 7;
  for (let i = 0; i < remainingSlots; i++) calendarGrid.push(null);

  const getDayTextColor = (dayOfWeek: number, isHoliday: boolean) => {
    if (isHoliday || dayOfWeek === 0) return 'text-rose-500';
    if (dayOfWeek === 6) return 'text-blue-500';
    return 'text-slate-700';
  };

  const getCellBgColor = (dayOfWeek: number, isHoliday: boolean) => {
    if (isHoliday || dayOfWeek === 0) return 'bg-rose-50/50';
    if (dayOfWeek === 6) return 'bg-blue-50/50';
    return 'bg-white';
  };

  // 🌟 カレンダー表示用のセル（クリックでウィンドウを開く処理を追加）
  const renderCompactCell = (label: string, data: SheetData | undefined, colorClass: string, isLoading: boolean, companyName: string, dateStr: string) => {
    if (isLoading) return null;
    const statusText = data?.status || "-";
    const isBlank = statusText === '-';

    return (
      <div 
        onClick={() => {
          // 空白でなければポップアップを開く
          if (!isBlank || data?.note || data?.dandoriUrl || data?.fileUrl) {
            setSelectedEvent({ date: dateStr, company: companyName, data: data || { date: dateStr, status: '-', note: '', fileUrl: '', dandoriUrl: '' } });
          }
        }}
        className={`flex items-center gap-1 w-full text-xs mb-1 p-1 rounded-md transition-all ${isBlank ? 'opacity-50' : 'bg-white/80 shadow-sm border border-slate-300 hover:border-blue-400 hover:shadow cursor-pointer'}`}
      >
        <span className={`font-bold shrink-0 ${colorClass}`}>[{label}]</span>
        <span className={`truncate ${getStatusColorClass(statusText)}`}>
          {statusText}
        </span>
        {(data?.dandoriUrl || data?.fileUrl || data?.note) && (
          <div className="flex shrink-0 gap-1.5 ml-auto items-center">
            {data.dandoriUrl && (
              <a href={data.dandoriUrl} target="_blank" rel="noopener noreferrer" title="ダンドリワークを開く" onClick={(e) => e.stopPropagation()} className="hover:scale-125 hover:text-blue-700 transition-transform">
                <LinkIcon size={12} className="text-blue-500" />
              </a>
            )}
            {data.fileUrl && (
              <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" title="添付ファイルを開く" onClick={(e) => e.stopPropagation()} className="hover:scale-125 hover:text-slate-600 transition-transform">
                <Paperclip size={12} className="text-slate-400" />
              </a>
            )}
            {data.note && <span title={data.note}><MessageSquare size={12} className="text-amber-500" /></span>}
          </div>
        )}
      </div>
    );
  };

  // 🌟 マトリクス用のセル（クリックでウィンドウを開く処理を追加）
  const renderMatrixCell = (data: SheetData | undefined, isLoading: boolean, companyName: string, dateStr: string) => {
    if (isLoading) return <span className="text-slate-400 text-sm animate-pulse">読込中...</span>;
    if (!data || data.status === '-') return <span className="text-slate-300">-</span>;
    return (
      <div 
        onClick={() => setSelectedEvent({ date: dateStr, company: companyName, data })}
        className="flex flex-col items-center justify-center w-full cursor-pointer hover:bg-slate-100/80 p-1.5 rounded-lg transition-colors group"
      >
        <span className={`text-sm break-words text-center group-hover:text-blue-600 transition-colors ${getStatusColorClass(data.status)}`}>
          {data.status !== '-' ? data.status : ''}
        </span>
        {(data.dandoriUrl || data.fileUrl || data.note) && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-1.5">
            {data.dandoriUrl && (
              <a href={data.dandoriUrl} target="_blank" rel="noopener noreferrer" title="ダンドリワークを開く" onClick={(e) => e.stopPropagation()} className="hover:scale-125 hover:text-blue-700 transition-transform p-0.5">
                <LinkIcon size={16} className="text-blue-500" />
              </a>
            )}
            {data.fileUrl && (
              <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" title="添付ファイルを開く" onClick={(e) => e.stopPropagation()} className="hover:scale-125 hover:text-slate-700 transition-transform p-0.5">
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
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-slate-300 text-center">
          <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={28} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">協力会社アプリスケジュール用</h1>
          <p className="text-sm text-slate-500 mb-6">関係者限定ページです。合言葉を入力してください。</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input type="password" placeholder="パスワードを入力" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className={`w-full bg-white border ${passwordError ? 'border-rose-400 focus:ring-rose-300' : 'border-slate-300 focus:ring-blue-200'} rounded-xl px-4 py-3 text-slate-800 text-center focus:outline-none focus:ring-4 placeholder-slate-400 transition-all`} />
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
      <div className="max-w-7xl mx-auto mb-6 bg-white rounded-xl p-5 shadow-sm border border-slate-300 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-300">
            <button onClick={handlePrevMonth} className="p-1 text-slate-500 hover:text-blue-600 transition-colors"><ChevronLeft size={20} /></button>
            <span className="text-slate-800 font-bold text-lg min-w-[120px] text-center">{year}年 {month + 1}月</span>
            <button onClick={handleNextMonth} className="p-1 text-slate-500 hover:text-blue-600 transition-colors"><ChevronRight size={20} /></button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-300">
            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}>
              <Calendar size={16} /> カレンダー
            </button>
            <button onClick={() => setViewMode('matrix')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'matrix' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}>
              <LayoutGrid size={16} /> マトリクス
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          <span className="text-sm font-bold text-slate-500">表示する企業:</span>
          <button onClick={() => toggleCompany('hasegawa')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCompanies.includes('hasegawa') ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
            {selectedCompanies.includes('hasegawa') && <Check size={14} />} 長谷川ガラス
          </button>
          <button onClick={() => toggleCompany('demo2')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCompanies.includes('demo2') ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
            {selectedCompanies.includes('demo2') && <Check size={14} />} デモ②
          </button>
          <button onClick={() => toggleCompany('demo3')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCompanies.includes('demo3') ? 'bg-amber-50 text-amber-600 border-amber-300' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
            {selectedCompanies.includes('demo3') && <Check size={14} />} デモ③
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
        {viewMode === 'calendar' && (
          <div>
            <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-100">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                <div key={day} className={`p-3 font-bold text-center text-sm border-r border-slate-300 last:border-0 ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-b border-slate-300">
              {calendarGrid.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-[140px] bg-slate-50/50 border-r border-b border-slate-300"></div>;
                const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
                const dayOfWeek = index % 7;
                const holidayName = HOLIDAYS_2026[dateStr] || '';
                const isHoliday = !!holidayName;

                return (
                  <div key={day} className={`min-h-[140px] p-1.5 border-r border-b border-slate-300 flex flex-col group transition-colors hover:brightness-95 ${getCellBgColor(dayOfWeek, isHoliday)}`}>
                    <div className={`flex justify-between items-start mb-2 ${getDayTextColor(dayOfWeek, isHoliday)}`}>
                      <span className="text-[10px] font-bold pl-1 pt-0.5 leading-tight">{holidayName}</span>
                      <span className="text-sm font-bold pr-1">{day}</span>
                    </div>
                    <div className="flex-grow flex flex-col w-full gap-1 overflow-hidden">
                      {loading && <div className="text-slate-400 text-xs pl-1">読込中...</div>}
                      {!loading && selectedCompanies.includes('hasegawa') && renderCompactCell('長谷川', hasegawaData[dateStr], 'text-blue-700', loading, '長谷川ガラス', dateStr)}
                      {!loading && selectedCompanies.includes('demo2') && renderCompactCell('デモ②', demo2Data[dateStr], 'text-emerald-700', loading, 'デモ②', dateStr)}
                      {!loading && selectedCompanies.includes('demo3') && renderCompactCell('デモ③', demo3Data[dateStr], 'text-amber-700', loading, 'デモ③', dateStr)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'matrix' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${Math.max(1, selectedCompanies.length)}, minmax(0, 1fr))` }} className="border-b border-slate-300 bg-slate-100">
              <div className="p-4 font-bold text-center text-slate-700 border-r border-slate-300">日付</div>
              {selectedCompanies.includes('hasegawa') && <div className="p-4 font-bold text-center text-blue-600 border-r border-slate-300">長谷川ガラス</div>}
              {selectedCompanies.includes('demo2') && <div className="p-4 font-bold text-center text-emerald-600 border-r border-slate-300">デモ②</div>}
              {selectedCompanies.includes('demo3') && <div className="p-4 font-bold text-center text-amber-600">デモ③</div>}
            </div>
            <div className="divide-y divide-slate-300">
              {listDays.map(({ day, weekDay, dateStr, dayOfWeek, isHoliday, holidayName }) => (
                <div key={day} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${Math.max(1, selectedCompanies.length)}, minmax(0, 1fr))` }} className={`hover:brightness-95 transition-colors ${getCellBgColor(dayOfWeek, isHoliday)}`}>
                  <div className={`p-2 border-r border-slate-300 flex flex-col items-center justify-center ${getDayTextColor(dayOfWeek, isHoliday)}`}>
                    <span className="text-lg font-bold">{day}</span>
                    <span className="text-xs font-bold">({weekDay})</span>
                    {isHoliday && <span className="text-[10px] mt-0.5 text-center font-bold leading-tight">{holidayName}</span>}
                  </div>
                  {selectedCompanies.includes('hasegawa') && <div className="p-3 border-r border-slate-300 flex flex-col items-center justify-center min-h-[60px]">{renderMatrixCell(hasegawaData[dateStr], loading, '長谷川ガラス', dateStr)}</div>}
                  {selectedCompanies.includes('demo2') && <div className="p-3 border-r border-slate-300 flex flex-col items-center justify-center min-h-[60px]">{renderMatrixCell(demo2Data[dateStr], loading, 'デモ②', dateStr)}</div>}
                  {selectedCompanies.includes('demo3') && <div className="p-3 flex flex-col items-center justify-center min-h-[60px]">{renderMatrixCell(demo3Data[dateStr], loading, 'デモ③', dateStr)}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🌟 ポップアップウィンドウ（詳細表示モーダルUI） */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
          onClick={() => setSelectedEvent(null)} // 背景をクリックしたら閉じる
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()} // ウィンドウ内でのクリックは閉じないようにする
          >
            {/* ヘッダー */}
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-0.5">{selectedEvent.date}</span>
                <h3 className="text-lg font-bold text-slate-800">{selectedEvent.company}</h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* 中身 */}
            <div className="space-y-4">
              {/* ステータス */}
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">現在の状況</span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm bg-slate-50 border border-slate-200 ${getStatusColorClass(selectedEvent.data.status)}`}>
                  {selectedEvent.data.status}
                </span>
              </div>

              {/* メモ */}
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">申し送り事項（メモ）</span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap min-h-[80px] max-h-[200px] overflow-y-auto leading-relaxed">
                  {selectedEvent.data.note || <span className="text-slate-400 italic">記載されたメモはありません。</span>}
                </div>
              </div>

              {/* 各種外部リンク（大きく押しやすいボタンに変身！） */}
              {(selectedEvent.data.dandoriUrl || selectedEvent.data.fileUrl) && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 block mb-0.5">関連リンク</span>
                  
                  {selectedEvent.data.dandoriUrl && (
                    <a 
                      href={selectedEvent.data.dandoriUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100/80 font-bold py-2.5 px-4 rounded-xl border border-blue-200 transition-all text-sm shadow-sm active:scale-[0.98]"
                    >
                      <LinkIcon size={16} /> ダンドリワークのページを開く
                    </a>
                  )}
                  
                  {selectedEvent.data.fileUrl && (
                    <a 
                      href={selectedEvent.data.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold py-2.5 px-4 rounded-xl border border-slate-300 transition-all text-sm shadow-sm active:scale-[0.98]"
                    >
                      <Paperclip size={16} /> 添付ファイル（資料・画像）を開く
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 下部閉じるボタン */}
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)} 
                className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2 px-5 rounded-xl transition-colors shadow-md"
              >
                閉じる
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}