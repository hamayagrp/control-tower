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

// 🌟 2026年の日本の祝日データ（振替休日・国民の休日含む）
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

// 🌟 ステータスの文字色を決定する専用ロボット
const getStatusColorClass = (status: string) => {
  if (!status || status === '-') return 'text-slate-400 font-normal';
  if (status.includes('指定なし')) return 'text-blue-600 font-bold'; // 余裕あり（青）
  if (status.includes('AM') || status.includes('朝')) return 'text-emerald-600 font-bold'; // 条件付き（緑）
  if (status.includes('相談') || status.includes('残り')) return 'text-orange-500 font-bold'; // 注意（オレンジ）
  if (status.includes('なし') || status.includes('不可')) return 'text-rose-600 font-bold'; // 限界（赤）
  if (status.includes('定休') || status.includes('休')) return 'text-slate-500 font-bold'; // 休み（グレー）
  return 'text-slate-700 font-bold'; // その他の文字は濃いグレー
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const listDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const holidayName = HOLIDAYS_2026[dateStr] || '';
    return { day, weekDay: weekDays[dateObj.getDay()], dateStr, day