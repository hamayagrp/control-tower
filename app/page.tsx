'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Loader2, TableProperties, 
  Calendar as CalendarIcon, X, Save, MessageSquare, Paperclip, 
  Link as LinkIcon, ExternalLink
} from 'lucide-react';

// --- 型定義 ---
// 1日分の1社あたりのデータ構造（A〜E列に相当）
interface DailyCompanyData {
  status: string;      // B列
  note: string;        // C列
  fileUrl: string;     // D列
  dandoriUrl: string;  // E列（新規追加：ダンドリワークURL）
}

// 1日分の全社統合データ
interface ScheduleRecord {
  dateStr: string;     // A列
  companies: Record<string, DailyCompanyData>;
}

// 協力会社マスタ（今後スプレッドシートのタブが増えたらここに追加/動的取得する想定）
const COMPANIES = [
  { id: 'HASEGAWA', name: '長谷川ガラス', color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-900/20' },
  { id: 'DEMO2', name: 'デモ②', color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-900/20' },
  { id: 'DEMO3', name: 'デモ③', color: 'text-amber-400', border: 'border-amber-500', bg: 'bg-amber-900/20' }
];

// ステータスの選択肢（スプレッドシートの画像に合わせた共通リスト）
const STATUS_OPTIONS = [
  "(未設定)", "朝一便可", "AM中可", "指定なし", "残りわずか", 
  "予約済", "空きなし", "要相談", "定休日"
];

// バッジの色分けロジック
const getBadgeColor = (status: string) => {
  switch(status) {
    case '予約済': case '空きなし': return 'bg-slate-700 text-slate-300 border-slate-600';
    case '定休日': return 'bg-slate-800 text-slate-500 border-slate-700';
    case '朝一便可': case 'AM中可': return 'bg-blue-900/50 text-blue-300 border-blue-700/50';
    case '残りわずか': return 'bg-red-900/50 text-red-300 border-red-700/50';
    case '要相談': case '指定なし': return 'bg-amber-900/50 text-amber-300 border-amber-700/50';
    default: return 'bg-slate-800 text-slate-400 border-slate-700';
  }
};

const getJapaneseDay = (dateObj: Date) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dateObj.getDay()];
};

export default function ControlTowerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<ScheduleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 💡表示モード管理 ('matrix' または 会社ID)
  const [viewMode, setViewMode] = useState<string>('matrix');
  
  // モーダル・編集用ステート
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, DailyCompanyData>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startingDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  // データ取得（API連携までのモック処理）
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // ※ここは実際にはNext.jsのAPIルート（Google Sheets API）を叩きます
      const res = await fetch(`/api/admin/schedule?year=${year}&month=${month + 1}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error(error);
      // APIがない環境でのテスト用に空配列をセット
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 1ヶ月分の日付リストを生成（マトリクス表示用）
  const getDaysInMonthList = () => {
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, dateObj });
    }
    return days;
  };

  // 日付セル・行をクリックした時の処理（モーダルを開く）
  const handleCellClick = (dateStr: string) => {
    const exist = records.find(r => r.dateStr === dateStr);
    
    // 全社の初期データをセット
    const initialFormData: Record<string, DailyCompanyData> = {};
    COMPANIES.forEach(company => {
      initialFormData[company.id] = {
        status: exist?.companies[company.id]?.status || '(未設定)',
        note: exist?.companies[company.id]?.note || '',
        fileUrl: exist?.companies[company.id]?.fileUrl || '',
        dandoriUrl: exist?.companies[company.id]?.dandoriUrl || '',
      };
    });

    setSelectedDateStr(dateStr);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  // 保存処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // ※ここにGoogle Sheetsを更新するAPIへのPOST処理を実装します
      await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDateStr, data: formData })
      });
      setIsModalOpen(false);
      fetchData(); // 再読み込み
    } catch (error) {
      alert('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------
  // ❶ 全体マトリクスビューのレンダリング
  // ---------------------------------------------
  const renderMatrixView = () => (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 font-bold whitespace-nowrap">
              <th className="py-4 px-4 text-center sticky left-0 bg-slate-900 z-10 w-24">日付</th>
              {COMPANIES.map(company => (
                <th key={company.id} className={`py-4 px-6 border-l border-slate-700 text-center ${company.color}`}>
                  {company.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {getDaysInMonthList().map((day) => {
              const record = records.find(r => r.dateStr === day.dateStr);
              const isWeekend = day.dateObj.getDay() === 0 || day.dateObj.getDay() === 6;
              const dayColor = day.dateObj.getDay() === 0 ? 'text-red-400' : day.dateObj.getDay() === 6 ? 'text-blue-400' : 'text-slate-300';
              
              return (
                <tr key={day.dateStr} onClick={() => handleCellClick(day.dateStr)} className="hover:bg-slate-700/40 transition-colors cursor-pointer group">
                  <td className={`py-3 px-4 text-center sticky left-0 bg-slate-800 group-hover:bg-slate-700 border-r border-slate-700 ${isWeekend ? 'bg-slate-800/80' : ''}`}>
                    <div className="font-bold text-white">{day.dayNum}</div>
                    <div className={`text-[10px] ${dayColor}`}>({getJapaneseDay(day.dateObj)})</div>
                  </td>
                  
                  {COMPANIES.map(company => {
                    const compData = record?.companies[company.id];
                    return (
                      <td key={company.id} className="py-3 px-2 border-r border-slate-700 text-center align-middle">
                        {compData && compData.status !== '(未設定)' ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded border whitespace-nowrap ${getBadgeColor(compData.status)}`}>
                              {compData.status}
                            </span>
                            <div className="flex gap-2 text-slate-500">
                              {/* 💡ダンドリアイコンの表示 */}
                              {compData.dandoriUrl && <LinkIcon size={12} className="text-cyan-400" />}
                              {compData.note && <MessageSquare size={12} className="text-emerald-400" />}
                              {compData.fileUrl && <Paperclip size={12} className="text-slate-400" />}
                            </div>
                          </div>
                        ) : <span className="text-slate-600 text-xs">-</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---------------------------------------------
  // ❷ 個別カレンダービューのレンダリング
  // ---------------------------------------------
  const renderCalendarView = (companyId: string) => {
    const company = COMPANIES.find(c => c.id === companyId);
    if (!company) return null;

    return (
      <div className={`bg-slate-800 border-t-4 ${company.border} rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-300`}>
        <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
          <h2 className={`text-lg font-bold ${company.color}`}>{company.name} 専用カレンダー</h2>
          <span className="text-xs text-slate-400">セルをタップして編集</span>
        </div>
        
        <div className="grid grid-cols-7 bg-slate-900 border-b border-slate-700 font-bold">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={d} className={`py-3 text-center text-xs tracking-widest ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 bg-slate-800">
          {[...Array(startingDay)].map((_, i) => <div key={`empty-${i}`} className="h-24 md:h-32 border-b border-r border-slate-700/50 bg-slate-900/30" />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
            const record = records.find(r => r.dateStr === dateStr);
            const data = record?.companies[companyId];
            
            const isHoliday = data?.status === '定休日';
            const cellClasses = `h-24 md:h-32 border-b border-r border-slate-700 p-1 sm:p-2 flex flex-col cursor-pointer transition-all relative ${isHoliday ? 'bg-slate-900/50' : 'hover:bg-slate-700/30 bg-slate-800'}`;

            return (
              <div key={day} onClick={() => handleCellClick(dateStr)} className={cellClasses}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col xl:flex-row items-center gap-1">
                    <span className={`text-xs md:text-sm font-semibold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full ${new Date().toDateString() === new Date(year, month, day).toDateString() ? `${company.bg} ${company.color}` : 'text-slate-300'}`}>
                      {day}
                    </span>
                    
                    {/* 💡 マス上部のアイコン群（ダンドリURLがあれば表示） */}
                    {data && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {data.dandoriUrl && <LinkIcon size={12} className="text-cyan-400" title="ダンドリワーク登録済" />}
                        {data.fileUrl && <Paperclip size={12} className="text-slate-400" />}
                        {data.note && <MessageSquare size={12} className="text-slate-400" />}
                      </div>
                    )}
                  </div>
                </div>
                
                {data && data.status !== '(未設定)' && (
                  <div className="mt-auto mb-1 flex justify-center w-full">
                    <span className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${getBadgeColor(data.status)}`}>
                      {data.status}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-2 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        
        {/* ヘッダー＆ナビゲーション */}
        <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md pt-2 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-700 p-4 md:p-5 rounded-2xl shadow-xl gap-4">
            
            {/* 月めくり */}
            <div className="flex items-center gap-4 bg-slate-950 border border-slate-700 p-1.5 rounded-xl">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
              <span className="font-extrabold px-2 text-base md:text-lg text-center tracking-wide min-w-[120px] text-white">{year}年 {month + 1}月</span>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight size={20} /></button>
            </div>

            {/* 💡 ビュー切り替えタブ（全体＋各社） */}
            <div className="flex flex-wrap justify-center gap-2">
              <button 
                onClick={() => setViewMode('matrix')} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${viewMode === 'matrix' ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
              >
                <TableProperties size={16} /> 全体マトリクス
              </button>
              
              {/* 各社のタブを動的に生成 */}
              {COMPANIES.map(company => (
                <button 
                  key={company.id}
                  onClick={() => setViewMode(company.id)} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${viewMode === company.id ? `${company.bg} ${company.color} ${company.border} shadow-lg` : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                >
                  <CalendarIcon size={16} /> {company.name}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* コンテンツ描画 */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="text-sm font-bold text-slate-400 tracking-widest">LOADING...</p>
          </div>
        ) : viewMode === 'matrix' ? (
          renderMatrixView()
        ) : (
          renderCalendarView(viewMode)
        )}

        {/* 🛠 一括編集用 モーダルウインドウ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
              
              <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/80 rounded-t-3xl">
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-wider text-white">スケジュール＆ダンドリ登録</h2>
                  <p className="text-sm font-bold text-blue-400 mt-1">{selectedDateStr}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSave} className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 各社の入力フォームをループで生成 */}
                  {COMPANIES.map(company => (
                    <div key={company.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl space-y-4">
                      <label className={`block text-base font-black ${company.color} border-b border-slate-700 pb-2`}>
                        {company.name}
                      </label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-400 block mb-1">ステータス</span>
                          <select 
                            value={formData[company.id].status} 
                            onChange={e => setFormData({...formData, [company.id]: {...formData[company.id], status: e.target.value}})} 
                            className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 text-white"
                          >
                            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>

                        {/* 💡 E列：ダンドリワークURL入力欄 */}
                        <div>
                          <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                            <LinkIcon size={12} /> ダンドリワークURL
                          </span>
                          <input 
                            type="url"
                            placeholder="https://dandori-work.com/..."
                            value={formData[company.id].dandoriUrl} 
                            onChange={e => setFormData({...formData, [company.id]: {...formData[company.id], dandoriUrl: e.target.value}})} 
                            className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500 text-cyan-300 placeholder-slate-600"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400 block mb-1">連絡コメント・備考</span>
                        <textarea 
                          value={formData[company.id].note} 
                          onChange={e => setFormData({...formData, [company.id]: {...formData[company.id], note: e.target.value}})} 
                          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-xs h-16 text-white placeholder-slate-600" 
                          placeholder="現場への指示などを入力" 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 保存ボタン */}
                <div className="sticky bottom-0 bg-slate-800 pt-2 pb-2">
                  <button disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 text-base shadow-blue-900/50">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    スプレッドシートへ一括保存する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}