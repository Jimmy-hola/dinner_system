import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Upload, 
  Download, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  XCircle,
  Calculator,
  Settings,
  RefreshCw,
  UserPlus,
  Trash2,
  X,
  Sparkles,
  MessageCircle,
  Copy,
  Loader2,
  AlertTriangle,
  Flag,           
  CalendarDays,
  Edit3,
  TrendingUp,
  Database,
  Utensils
} from 'lucide-react';

// --- 🛠️ 樣式救援區 (Style Rescue) ---
if (typeof document !== 'undefined') {
  const existingScript = document.querySelector('script[src="https://cdn.tailwindcss.com"]');
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);
  }
}

// --- 0. Gemini API Utility ---
const callGemini = async (prompt) => {
  const apiKey = ""; // The execution environment provides the key at runtime.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "無法產生回應，請稍後再試。";
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      attempt++;
      if (attempt < maxRetries) await delay(1000 * Math.pow(2, attempt));
    }
  }
  return "AI 服務目前繁忙，請檢查網路連線或稍後再試。";
};

// --- 1. 資料初始化與解析 ---
const SUBJECT_MAPPING = {
  physics: { name: '理化', days: [1, 4], color: 'bg-blue-100 text-blue-800 border-blue-200' }, 
  english: { name: '英文', days: [2, 5], color: 'bg-green-100 text-green-800 border-green-200' },
  math:    { name: '數學', days: [3],    color: 'bg-red-100 text-red-800 border-red-200' }
};

const parseScheduleString = (str) => {
  if (!str) return [];
  const subjects = new Set();
  if (str.includes('一~五')) return ['physics', 'english', 'math'];
  if (str.includes('一') || str.includes('四')) subjects.add('physics');
  if (str.includes('二') || str.includes('五')) subjects.add('english');
  if (str.includes('三')) subjects.add('math');
  return Array.from(subjects);
};

const INITIAL_STUDENTS = [
  { id: 1, name: '張棨鈞', school: '光華', rawDays: '一~五' },
  { id: 2, name: '張歆翎', school: '光華', rawDays: '一~五' },
  { id: 3, name: '林宜萱', school: '英明', rawDays: '一~五' },
  { id: 4, name: '王子璇', school: '英明', rawDays: '一~五' },
  { id: 5, name: '陳孟辰', school: '獅甲', rawDays: '一~五' },
  { id: 6, name: '李秉恩', school: '光華', rawDays: '一二三五' },
  { id: 7, name: '李姿紜', school: '五福', rawDays: '三~五' },
  { id: 8, name: '羅奕晴', school: '五福', rawDays: '二三五' },
  { id: 9, name: '許淥為', school: '光華', rawDays: '' },
  { id: 10, name: '潘嘉偉', school: '光華', rawDays: '' },
  { id: 11, name: '沈妍彤', school: '苓雅', rawDays: '' },
  { id: 12, name: '沈妍希', school: '苓雅', rawDays: '' },
  { id: 13, name: '吳婉鈺', school: '苓雅', rawDays: '' },
  { id: 14, name: '王增婕', school: '獅甲', rawDays: '' },
].map(s => ({ ...s, subjects: parseScheduleString(s.rawDays) }));

const INITIAL_EVENT_TYPES = {
  holiday: { label: '國定假日', color: 'bg-red-100 text-red-700 border-red-200' },
  exam:    { label: '段考',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  activity:{ label: '學校活動', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  other:   { label: '其他',     color: 'bg-gray-100 text-gray-700 border-gray-200' }
};

const STORAGE_KEY = 'LUNCH_SYSTEM_V1_DATA';

// --- 2. 核心應用程式 (Main Application) ---
const App = () => {
  // --- 樣式載入 ---
  useEffect(() => {
    const scriptId = 'tailwind-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://cdn.tailwindcss.com";
      script.async = true; 
      document.head.appendChild(script);
    }
  }, []);

  // --- State Management ---
  
  // 1. 初始化當前月份 (自動抓取現在時間)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    // 預設為當前月份的 1 號，避免月底切換月份時的 Bug
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // 2. 初始化手機版選定日期 (自動抓取今天)
  const [selectedDay, setSelectedDay] = useState(new Date()); 

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { return JSON.parse(saved).students || INITIAL_STUDENTS; } catch (e) { return INITIAL_STUDENTS; } }
    return INITIAL_STUDENTS;
  });
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).bookings || {} : {};
  });
  const [deposits, setDeposits] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).deposits || {} : {};
  });
  const [mealPrice, setMealPrice] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).mealPrice || 90 : 90;
  });
  const [specialDates, setSpecialDates] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).specialDates || {} : {};
  });
  const [eventTypes, setEventTypes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).eventTypes || INITIAL_EVENT_TYPES : INITIAL_EVENT_TYPES;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [editingDate, setEditingDate] = useState(null); 
  const [showSpecialDatesList, setShowSpecialDatesList] = useState(false); 
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSchool, setNewStudentSchool] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  // Persistence
  useEffect(() => {
    const dataToSave = { students, bookings, deposits, mealPrice, specialDates, eventTypes, lastUpdated: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSaved(new Date());
    } catch (err) { console.error("Save failed", err); }
  }, [students, bookings, deposits, mealPrice, specialDates, eventTypes]);

  // Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = useMemo(() => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [year, month]);

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const getDayOfWeek = (date) => date.getDay();
  const formatDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const getWeekdayLabel = (date) => new Intl.DateTimeFormat('zh-TW', { weekday: 'narrow' }).format(date);
  const getSpecialDateInfo = (date) => specialDates[formatDateKey(date)];

  // Auto Schedule Logic
  const shouldBookBasedOnSubjects = useCallback((student, date) => {
    const day = getDayOfWeek(date);
    return student.subjects.some(subKey => SUBJECT_MAPPING[subKey].days.includes(day));
  }, []);

  const applyAutoSchedule = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const newBookings = { ...bookings };
    daysInMonth.forEach(date => {
      const dateKey = formatDateKey(date);
      const bookingKey = `${studentId}_${dateKey}`;
      const day = getDayOfWeek(date);
      if (day !== 0 && day !== 6) {
        if (shouldBookBasedOnSubjects(student, date)) newBookings[bookingKey] = true;
        else delete newBookings[bookingKey];
      }
    });
    setBookings(newBookings);
  };

  const applyAutoScheduleAll = () => {
    if (window.confirm(`確定要根據科目設定重置 ${year}年${month+1}月 紀錄嗎？`)) {
      const newBookings = { ...bookings };
      students.forEach(student => {
        daysInMonth.forEach(date => {
          const dateKey = formatDateKey(date);
          const bookingKey = `${student.id}_${dateKey}`;
          const day = getDayOfWeek(date);
          if (day !== 0 && day !== 6 && shouldBookBasedOnSubjects(student, date)) {
            newBookings[bookingKey] = true;
          } else if (day !== 0 && day !== 6) {
             delete newBookings[bookingKey];
          }
        });
      });
      setBookings(newBookings);
    }
  };

  // Financial Logic
  const calculateOpeningBalance = (studentId) => {
    const startYear = 2025;
    const startMonth = 2; 
    let balance = 0;
    let loopDate = new Date(startYear, startMonth, 1);
    const targetDate = new Date(year, month, 1);
    while (loopDate < targetDate) {
      const loopYear = loopDate.getFullYear();
      const loopMonth = loopDate.getMonth();
      const loopMonthKey = `${loopYear}-${String(loopMonth + 1).padStart(2, '0')}`;
      const deposit = deposits[`${studentId}_${loopMonthKey}`] || 0;
      const daysInLoopMonth = new Date(loopYear, loopMonth + 1, 0).getDate();
      let mealCount = 0;
      for (let d = 1; d <= daysInLoopMonth; d++) {
        const dStr = `${loopYear}-${String(loopMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (bookings[`${studentId}_${dStr}`]) mealCount++;
      }
      balance += (deposit - (mealCount * mealPrice));
      loopDate.setMonth(loopDate.getMonth() + 1);
    }
    return balance;
  };

  const getMonthlyStats = (studentId) => {
    let count = 0;
    daysInMonth.forEach(date => {
      if (bookings[`${studentId}_${formatDateKey(date)}`]) count++;
    });
    const cost = count * mealPrice;
    const depositKey = `${studentId}_${monthKey}`;
    const paid = deposits[depositKey] || 0;
    const opening = calculateOpeningBalance(studentId);
    return { count, cost, paid, opening, closing: opening + paid - cost };
  };

  const dailyStats = useMemo(() => {
    const stats = {};
    let monthTotalCount = 0;
    daysInMonth.forEach(date => {
      const dateKey = formatDateKey(date);
      let count = 0;
      students.forEach(student => { if (bookings[`${student.id}_${dateKey}`]) count++; });
      stats[dateKey] = count;
      monthTotalCount += count;
    });
    return { daily: stats, totalCount: monthTotalCount, totalRevenue: monthTotalCount * mealPrice };
  }, [daysInMonth, students, bookings, mealPrice]);

  // Handlers
  const toggleBooking = (studentId, date) => {
    const key = `${studentId}_${formatDateKey(date)}`;
    setBookings(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      return next;
    });
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setDate(1); 
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    // Sync selected day for mobile
    const newSelected = new Date(selectedDay);
    newSelected.setMonth(newSelected.getMonth() + delta);
    setSelectedDay(newSelected);
  };

  const changeSelectedDay = (delta) => {
    const newDate = new Date(selectedDay);
    newDate.setDate(newDate.getDate() + delta);
    // If month changes, update calendar
    if (newDate.getMonth() !== currentDate.getMonth()) {
        setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
    setSelectedDay(newDate);
  }

  const handleAddStudent = () => {
    if (!newStudentName.trim()) { alert('請輸入姓名'); return; }
    const maxId = students.length > 0 ? Math.max(...students.map(s => s.id)) : 0;
    setStudents([...students, { id: maxId + 1, name: newStudentName, school: newStudentSchool || '未填寫', subjects: [], rawDays: '' }]);
    setNewStudentName(''); setNewStudentSchool(''); setShowAddStudent(false);
  };

  const handleDepositChange = (studentId, value) => {
    const key = `${studentId}_${monthKey}`;
    setDeposits(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  // NEW: Subject Toggle Handler
  const toggleSubject = (studentId, subjectKey) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const newSubjects = s.subjects.includes(subjectKey)
        ? s.subjects.filter(sub => sub !== subjectKey)
        : [...s.subjects, subjectKey];
      return { ...s, subjects: newSubjects };
    }));
  };

  // AI & Modals...
  const handleGenerateReport = async () => { 
    setAiTitle(`✨ ${year}年${month + 1}月 財務智能分析報告`);
    setAiContent(''); setAiModalOpen(true); setAiLoading(true);
    let totalCost = 0; let totalPaid = 0; let totalBalance = 0;
    const studentStatus = students.map(s => {
      const stats = getMonthlyStats(s.id);
      totalCost += stats.cost; totalPaid += stats.paid; totalBalance += stats.closing;
      return { name: s.name, balance: stats.closing };
    });
    const debtors = studentStatus.filter(s => s.balance < 0).map(s => `${s.name}(欠${Math.abs(s.balance)})`).join(', ');
    const prompt = `你是一位補習班財務顧問。${year}年${month+1}月數據：應收${totalCost}, 實收${totalPaid}, 總結餘${totalBalance}, 欠費者:${debtors||"無"}。請用繁體中文給出簡短財務分析與催繳建議。`;
    const result = await callGemini(prompt);
    setAiContent(result); setAiLoading(false);
  };

  const handleGenerateReminder = async (studentName, balance) => {
    setAiTitle(`✨ 產生催繳通知 - ${studentName}`);
    setAiContent(''); setAiModalOpen(true); setAiLoading(true);
    const prompt = `請為補習班撰寫給家長的催繳訊息。學生:${studentName}, 月份:${year}年${month+1}月, 欠費:${Math.abs(balance)}元。語氣委婉禮貌，適合Line。繁體中文。`;
    const result = await callGemini(prompt);
    setAiContent(result); setAiLoading(false);
  };

  const exportData = () => {
    const data = { students, bookings, deposits, mealPrice, specialDates, eventTypes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lunch_system_backup_${formatDateKey(new Date())}.json`; a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.students) setStudents(data.students);
        if (data.bookings) setBookings(data.bookings);
        if (data.deposits) setDeposits(data.deposits);
        if (data.mealPrice) setMealPrice(data.mealPrice);
        if (data.specialDates) setSpecialDates(data.specialDates);
        if (data.eventTypes) setEventTypes(data.eventTypes);
        alert("資料匯入成功！");
      } catch (err) { alert("資料格式錯誤"); }
    };
    reader.readAsText(file);
  };

  const handleResetAllData = () => {
    if (window.confirm("嚴重警告：這將清除所有資料！確定嗎？")) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    }
  };

  const handleDateHeaderClick = (date) => { setEditingDate(date); };
  const handleDeleteClick = (student) => { setStudentToDelete(student); setDeleteModalOpen(true); };
  const confirmDeleteStudent = () => { setStudents(students.filter(s => s.id !== studentToDelete.id)); setDeleteModalOpen(false); };
  
  const saveSpecialDate = (type, label) => {
    if (!editingDate) return;
    const key = formatDateKey(editingDate);
    if (!label) {
      const newDates = { ...specialDates }; delete newDates[key]; setSpecialDates(newDates);
    } else {
      setSpecialDates(prev => ({ ...prev, [key]: { type, label } }));
    }
    setEditingDate(null);
  };

  const clearBookingsForDate = () => {
    if (!editingDate) return;
    if (window.confirm(`確定要清除 ${formatDateKey(editingDate)} 當天所有訂餐嗎？`)) {
      const dateKey = formatDateKey(editingDate);
      const newBookings = { ...bookings };
      Object.keys(newBookings).forEach(key => { if (key.endsWith(`_${dateKey}`)) delete newBookings[key]; });
      setBookings(newBookings);
    }
  };

  const handleEventTypeChange = (key, newLabel) => {
    setEventTypes(prev => ({ ...prev, [key]: { ...prev[key], label: newLabel } }));
  };
  
  // --- UI Components ---

  const currentSpecialInfo = getSpecialDateInfo(selectedDay);
  const currentDailyCount = dailyStats.daily[formatDateKey(selectedDay)] || 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
      {/* 1. Header (Responsive) */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-20 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-gray-800 hidden sm:block">補習班智能訂餐</h1>
            <h1 className="text-lg font-bold text-gray-800 sm:hidden">訂餐系統</h1>
            {lastSaved && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
                <Database className="w-3 h-3" /> 已儲存
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
             <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
               <Settings className="w-5 h-5" />
             </button>
             {/* Desktop Export Buttons */}
             <div className="hidden md:flex gap-2">
                <button onClick={exportData} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full" title="備份">
                  <Download className="w-5 h-5" />
                </button>
                <label className="p-2 text-gray-600 hover:bg-gray-50 rounded-full cursor-pointer" title="匯入">
                  <Upload className="w-5 h-5" />
                  <input type="file" onChange={importData} className="hidden" accept=".json" />
                </label>
             </div>
          </div>
        </div>

        {/* 2. Controls & Month Switcher */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          
          {/* Month Switcher (Always Visible) */}
          <div className="flex items-center justify-center bg-white rounded-lg border border-gray-300 p-1 shadow-sm w-full md:w-auto">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 rounded text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
            <span className="flex-1 text-center px-4 font-bold text-gray-700 min-w-[140px]">
              {year}年 {month + 1}月
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 rounded text-gray-600"><ChevronRight className="w-5 h-5" /></button>
          </div>

          {/* Desktop Tools */}
          <div className="hidden md:flex gap-2">
             <button onClick={() => setShowSpecialDatesList(true)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">
                <Flag className="w-4 h-4 text-yellow-600" /> 行事曆
             </button>
             <button onClick={applyAutoScheduleAll} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-100">
                <Calculator className="w-4 h-4" /> 自動排程
             </button>
          </div>
        </div>

        {/* 3. Mobile Day Picker (Mobile Only) */}
        <div className="md:hidden bg-white px-4 py-3 border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => changeSelectedDay(-1)} className="p-2 bg-gray-100 rounded-full text-gray-600"><ChevronLeft className="w-5 h-5"/></button>
                <div className="flex flex-col items-center" onClick={() => handleDateHeaderClick(selectedDay)}>
                    <span className="text-sm font-medium text-gray-500">{getWeekdayLabel(selectedDay)}</span>
                    <span className="text-2xl font-bold text-indigo-600">{selectedDay.getDate()}</span>
                </div>
                <button onClick={() => changeSelectedDay(1)} className="p-2 bg-gray-100 rounded-full text-gray-600"><ChevronRight className="w-5 h-5"/></button>
            </div>
            
            {/* Mobile Special Date Banner */}
            {currentSpecialInfo ? (
                <div className={`text-center py-1 px-3 rounded-md text-sm font-bold border ${eventTypes[currentSpecialInfo.type].color}`}>
                    {eventTypes[currentSpecialInfo.type].label}: {currentSpecialInfo.label}
                </div>
            ) : (
                <div className="text-center text-xs text-gray-400 py-1">本日無特殊活動</div>
            )}
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-auto bg-white relative">
        
        {/* VIEW 1: DESKTOP TABLE (Hidden on Mobile) */}
        <div className="hidden md:block min-w-full">
           <table className="w-full border-collapse">
             <thead className="sticky top-0 z-30 bg-white shadow-sm">
                <tr>
                  <th className="sticky left-0 z-40 bg-white p-3 border-b border-r border-gray-200 min-w-[200px] text-left">
                     <div className="flex items-center justify-between">
                        <span>學生 ({students.length})</span>
                        <button onClick={() => setShowAddStudent(true)} className="p-1 bg-indigo-50 text-indigo-600 rounded"><UserPlus className="w-4 h-4"/></button>
                     </div>
                  </th>
                  {daysInMonth.map(date => {
                      const sp = getSpecialDateInfo(date);
                      return (
                        <th key={date.toString()} onClick={() => handleDateHeaderClick(date)} 
                            className={`min-w-[40px] border-b border-r p-1 cursor-pointer hover:bg-gray-50 ${sp ? eventTypes[sp.type].color.replace('text-', 'bg-').split(' ')[0] : ''}`}>
                            <div className="text-[10px] text-gray-500">{getWeekdayLabel(date)}</div>
                            <div className="font-bold">{date.getDate()}</div>
                        </th>
                      )
                  })}
                  <th className="sticky top-0 z-30 min-w-[80px] p-2 border-b border-r bg-gray-100 text-xs font-bold text-gray-600 shadow-sm">統計</th>
                  <th className="sticky top-0 z-30 min-w-[80px] p-2 border-b border-r bg-gray-100 text-xs font-bold text-gray-600 shadow-sm">應繳</th>
                  <th className="sticky top-0 z-30 min-w-[80px] p-2 border-b border-r bg-gray-100 text-xs font-bold text-gray-600 shadow-sm">實繳</th>
                  <th className="sticky top-0 z-30 min-w-[80px] p-2 border-b border-r bg-gray-100 text-xs font-bold text-gray-600 shadow-sm">期初</th>
                  <th className="sticky top-0 z-30 min-w-[80px] p-2 border-b bg-indigo-50 text-xs font-bold text-indigo-700 shadow-sm">結餘</th>
                </tr>
             </thead>
             <tbody>
                {students.map(student => {
                    const stats = getMonthlyStats(student.id);
                    return (
                        <tr key={student.id} className="hover:bg-gray-50 group">
                            <td className="sticky left-0 z-20 bg-white border-b border-r p-2 font-medium flex-col justify-center group-hover:bg-gray-50">
                                <div className="flex justify-between items-center w-full">
                                    <span>{student.name}</span>
                                    <button onClick={() => handleDeleteClick(student)} className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 className="w-3 h-3"/></button>
                                </div>
                                {/* Desktop Subject Toggles (Fixed: Added Back) */}
                                <div className="flex gap-1 mt-1">
                                  {Object.entries(SUBJECT_MAPPING).map(([key, info]) => (
                                    <button
                                      key={key}
                                      onClick={() => toggleSubject(student.id, key)}
                                      className={`text-[10px] px-1 rounded border transition-colors ${
                                        student.subjects.includes(key) 
                                          ? info.color 
                                          : 'bg-white text-gray-300 border-gray-200'
                                      }`}
                                    >
                                      {info.name}
                                    </button>
                                  ))}
                                </div>
                            </td>
                            {daysInMonth.map(date => {
                                const isBooked = bookings[`${student.id}_${formatDateKey(date)}`];
                                const sp = getSpecialDateInfo(date);
                                const isHoliday = sp && sp.type === 'holiday';
                                return (
                                    <td key={date.toString()} onClick={() => toggleBooking(student.id, date)} 
                                        className={`border-b border-r text-center cursor-pointer ${isBooked ? 'bg-green-100' : ''} ${isHoliday ? 'bg-red-50' : ''}`}>
                                        {isBooked && <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto"/>}
                                    </td>
                                )
                            })}
                            <td className="border-b border-r text-center font-bold text-blue-600">{stats.count}</td>
                            <td className="border-b border-r text-center text-red-600">-{stats.cost}</td>
                            <td className="border-b border-r p-1"><input type="number" className="w-full text-center border rounded" value={stats.paid || ''} onChange={e => handleDepositChange(student.id, e.target.value)} /></td>
                            <td className="border-b border-r text-center text-gray-500">{stats.opening}</td>
                            <td className={`border-b text-center font-bold ${stats.closing < 0 ? 'text-red-600' : 'text-blue-600'}`}>{stats.closing}</td>
                        </tr>
                    );
                })}
             </tbody>
             <tfoot className="sticky bottom-0 z-40 bg-gray-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t-2 border-gray-200">
                <tr>
                  <td className="sticky left-0 z-50 bg-gray-50 border-b border-r border-gray-200 p-2 font-bold text-right text-xs">每日總數</td>
                  {daysInMonth.map(date => {
                    const c = dailyStats.daily[formatDateKey(date)] || 0;
                    return <td key={date.toString()} className="border-b border-r text-center text-xs font-bold">{c > 0 ? c : '-'}</td>
                  })}
                  <td className="border-b bg-indigo-50 text-center font-bold">{dailyStats.totalCount}</td>
                  <td colSpan={4} className="border-b bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="sticky left-0 z-50 bg-gray-50 border-r border-gray-200 p-2 font-bold text-right text-xs">每日金額</td>
                  {daysInMonth.map(date => {
                    const c = dailyStats.daily[formatDateKey(date)] || 0;
                    return <td key={date.toString()} className="border-r text-center text-[10px] text-gray-500">{c > 0 ? c*mealPrice : '-'}</td>
                  })}
                  <td colSpan={5} className="bg-gray-50 text-center font-bold text-indigo-700">${dailyStats.totalRevenue}</td>
                </tr>
             </tfoot>
           </table>
        </div>

        {/* VIEW 2: MOBILE CARD LIST (Visible only on Mobile) */}
        <div className="md:hidden pb-24">
            {students.map(student => {
                const dateKey = formatDateKey(selectedDay);
                const isBooked = bookings[`${student.id}_${dateKey}`];
                const specialInfo = getSpecialDateInfo(selectedDay);
                const isHoliday = specialInfo && specialInfo.type === 'holiday';

                return (
                    <div key={student.id} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white ${isBooked ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {student.name[0]}
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-lg">{student.name}</div>
                                <div className="text-xs text-gray-500 mb-1">{student.school}</div>
                                {/* Mobile Subject Toggles (Fixed: Added Back) */}
                                <div className="flex gap-1">
                                  {Object.entries(SUBJECT_MAPPING).map(([key, info]) => (
                                    <button
                                      key={key}
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering row click if any
                                        toggleSubject(student.id, key);
                                      }}
                                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                        student.subjects.includes(key) 
                                          ? info.color 
                                          : 'bg-gray-50 text-gray-300 border-gray-200'
                                      }`}
                                    >
                                      {info.name}
                                    </button>
                                  ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => !isHoliday && toggleBooking(student.id, selectedDay)}
                            disabled={isHoliday}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm
                                ${isHoliday 
                                    ? 'bg-red-100 text-red-400 cursor-not-allowed border border-red-200' 
                                    : isBooked 
                                        ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
                                        : 'bg-white text-gray-400 border border-gray-300 hover:border-gray-400'}
                            `}
                        >
                            {isHoliday ? (
                                <span className="text-xs">放假</span>
                            ) : isBooked ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" /> 已訂餐
                                </>
                            ) : (
                                <>
                                    <Utensils className="w-5 h-5" /> 未訂
                                </>
                            )}
                        </button>
                    </div>
                );
            })}
            
            <div className="p-8 text-center text-gray-400 text-sm">
                -- 已顯示全部學生 --
                <br/>
                <button onClick={() => setShowAddStudent(true)} className="mt-4 text-indigo-600 font-bold flex items-center justify-center gap-2 mx-auto">
                    <UserPlus className="w-4 h-4"/> 新增學生
                </button>
            </div>
        </div>

      </div>

      {/* Mobile Footer Stats (Sticky) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] p-4 flex justify-between items-center z-50">
         <div>
            <div className="text-xs text-gray-500">今日訂餐</div>
            <div className="text-2xl font-bold text-indigo-600 flex items-end gap-1">
                {currentDailyCount} <span className="text-sm font-normal text-gray-400 mb-1">人</span>
            </div>
         </div>
         <div className="text-right">
            <div className="text-xs text-gray-500">今日金額</div>
            <div className="text-xl font-bold text-gray-800 font-mono">
                ${currentDailyCount * mealPrice}
            </div>
         </div>
      </div>

      {/* Modals (Keeping simplified for space, logic remains) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="font-bold text-lg mb-4">設定</h3>
                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">單餐費用</label>
                    <input type="number" value={mealPrice} onChange={(e) => setMealPrice(Number(e.target.value))} className="w-full border p-2 rounded"/>
                </div>
                {/* Event Type Editing UI */}
                <div className="mb-4 space-y-2">
                    <label className="block text-sm text-gray-600">標籤名稱</label>
                    {Object.entries(eventTypes).map(([k,v]) => (
                        <div key={k} className="flex gap-2"><div className={`w-4 h-4 rounded ${v.color.split(' ')[0].replace('text','bg').replace('100','500')}`}></div><input value={v.label} onChange={e=>handleEventTypeChange(k,e.target.value)} className="border rounded px-1 text-sm flex-1"/></div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={handleResetAllData} className="flex-1 bg-red-100 text-red-600 py-2 rounded">重置資料</button>
                    <button onClick={() => setShowSettings(false)} className="flex-1 bg-gray-100 py-2 rounded">關閉</button>
                </div>
            </div>
        </div>
      )}
      {showAddStudent && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-sm p-6">
                  <h3 className="font-bold text-lg mb-4">新增學生</h3>
                  <input className="w-full border p-2 rounded mb-3" placeholder="姓名" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)}/>
                  <input className="w-full border p-2 rounded mb-4" placeholder="學校" value={newStudentSchool} onChange={e=>setNewStudentSchool(e.target.value)}/>
                  <div className="flex justify-end gap-2">
                      <button onClick={()=>setShowAddStudent(false)} className="px-4 py-2 text-gray-500">取消</button>
                      <button onClick={handleAddStudent} className="px-4 py-2 bg-indigo-600 text-white rounded">新增</button>
                  </div>
              </div>
          </div>
      )}
      {editingDate && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-sm p-6">
                  <h3 className="font-bold mb-2">設定日期備註</h3>
                  <p className="text-gray-500 mb-4">{formatDateKey(editingDate)}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      {Object.entries(eventTypes).map(([k,v]) => (
                          <button key={k} onClick={() => saveSpecialDate(k, v.label)} className={`p-2 border rounded ${v.color}`}>{v.label}</button>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={clearBookingsForDate} className="flex-1 text-xs bg-red-50 text-red-600 border border-red-200 p-2 rounded">一鍵取消全班</button>
                    <button onClick={() => saveSpecialDate('holiday', '')} className="flex-1 text-xs border p-2 rounded">刪除備註</button>
                  </div>
                  <button onClick={()=>setEditingDate(null)} className="w-full mt-4 p-2 bg-gray-100 rounded">關閉</button>
              </div>
          </div>
      )}
      {/* AI Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl p-6">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
               <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600"/> {aiTitle}</h3>
               <button onClick={()=>setAiModalOpen(false)}><X/></button>
             </div>
             <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-gray-700">
               {aiLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-purple-600"/></div> : aiContent}
             </div>
             <div className="mt-4 flex justify-end gap-2">
                <button onClick={copyToClipboard} className="bg-purple-600 text-white px-4 py-2 rounded flex gap-2 items-center"><Copy className="w-4 h-4"/> 複製</button>
                <button onClick={()=>setAiModalOpen(false)} className="bg-gray-100 px-4 py-2 rounded">關閉</button>
             </div>
          </div>
        </div>
      )}
      {/* Special Dates List Modal */}
      {showSpecialDatesList && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-sm p-6 max-h-[80vh] flex flex-col">
              <div className="flex justify-between mb-4 border-b pb-2">
                 <h3 className="font-bold">本月特殊日程</h3>
                 <button onClick={()=>setShowSpecialDatesList(false)}><X/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                 {Object.entries(specialDates).filter(([k])=>k.startsWith(monthKey)).map(([k,v]) => (
                    <div key={k} className="border p-2 rounded flex justify-between items-center">
                       <div><div className="font-bold text-gray-500">{k}</div><div className={eventTypes[v.type]?.color}>{v.label}</div></div>
                    </div>
                 ))}
                 {Object.entries(specialDates).filter(([k])=>k.startsWith(monthKey)).length === 0 && <div className="text-gray-400 text-center py-4">無</div>}
              </div>
           </div>
        </div>
      )}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
           <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4"/>
              <h3 className="font-bold text-lg">確認刪除 {studentToDelete?.name}?</h3>
              <p className="text-gray-500 text-sm mb-6">此動作無法復原。</p>
              <div className="flex gap-2">
                 <button onClick={()=>setDeleteModalOpen(false)} className="flex-1 border p-2 rounded">取消</button>
                 <button onClick={confirmDeleteStudent} className="flex-1 bg-red-600 text-white p-2 rounded">刪除</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;