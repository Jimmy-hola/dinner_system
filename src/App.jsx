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
  AlertTriangle,
  Flag,           
  CalendarDays,
  Edit3,
  TrendingUp,
  Database,
  Utensils,
  Copy,
  ClipboardList, 
  BellRing,      
  CheckSquare,
  FileText,
  FilePenLine,
  AlertCircle,
  Filter,
  Plus,
  Palette,
  Lock,
  Unlock,
  CalendarClock,
  Eye,      // 新增：顯示圖示
  EyeOff,   // 新增：隱藏圖示
  Ghost     // 新增：幽靈圖示(代表備用帳號)
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

// --- 0. Constants & Defaults ---

const INITIAL_SUBJECTS_CONFIG = {
  physics: { label: '理化', days: [1, 4], color: 'blue' }, 
  english: { label: '英文', days: [2, 5], color: 'green' },
  math:    { label: '數學', days: [3],    color: 'red' }
};

const COLOR_THEMES = {
  blue:   { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' },
  green:  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
  red:    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
  pink:   { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', dot: 'bg-pink-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
  teal:   { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-500' },
  gray:   { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', dot: 'bg-gray-500' },
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
].map(s => ({ ...s, subjects: parseScheduleString(s.rawDays), customSchedule: null })); 

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
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDay, setSelectedDay] = useState(new Date()); 

  const [subjectsConfig, setSubjectsConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return parsed.subjectsConfig || INITIAL_SUBJECTS_CONFIG;
        } catch (e) { return INITIAL_SUBJECTS_CONFIG; }
    }
    return INITIAL_SUBJECTS_CONFIG;
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { 
      try { 
        const parsed = JSON.parse(saved);
        const loadedStudents = parsed.students || INITIAL_STUDENTS;
        return loadedStudents.map(s => ({
          ...s,
          subjects: Array.isArray(s.subjects) ? s.subjects : [],
          customSchedule: Array.isArray(s.customSchedule) ? s.customSchedule : null 
        }));
      } catch (e) { 
        console.error("Load error", e); 
        return INITIAL_STUDENTS; 
      } 
    }
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

  // Change Logging States
  const [pendingTodos, setPendingTodos] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).pendingTodos || [] : [];
  });
  const [changeLogs, setChangeLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).changeLogs || [] : [];
  });

  const [isTrackingMode, setIsTrackingMode] = useState(true);
  const [showTodoModal, setShowTodoModal] = useState(false);
  
  // 🔥 新增：是否顯示備用帳號 (預設關閉)
  const [showSpareAccounts, setShowSpareAccounts] = useState(false);

  // 異動確認視窗狀態
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    studentId: null,
    studentName: '',
    date: null,
    actionType: '',
    note: ''
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState(null);
  const [historyFilterDate, setHistoryFilterDate] = useState(null);

  // 個人自訂排程視窗 & 草稿狀態
  const [showCustomScheduleModal, setShowCustomScheduleModal] = useState(false);
  const [selectedCustomStudent, setSelectedCustomStudent] = useState(null);
  const [draftSchedule, setDraftSchedule] = useState(null); 

  const [showSettings, setShowSettings] = useState(false);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);
  const [editingDate, setEditingDate] = useState(null); 
  const [showSpecialDatesList, setShowSpecialDatesList] = useState(false); 
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSchool, setNewStudentSchool] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Persistence
  useEffect(() => {
    const dataToSave = { 
      students, bookings, deposits, mealPrice, specialDates, eventTypes, pendingTodos, changeLogs, subjectsConfig,
      lastUpdated: new Date().toISOString() 
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSaved(new Date());
    } catch (err) { console.error("Save failed", err); }
  }, [students, bookings, deposits, mealPrice, specialDates, eventTypes, pendingTodos, changeLogs, subjectsConfig]);

  // Self-Healing
  useEffect(() => {
    setStudents(prevStudents => {
      let needsFix = false;
      const fixedStudents = prevStudents.map(s => {
        let fixed = { ...s };
        if (!Array.isArray(s.subjects)) {
          needsFix = true;
          fixed.subjects = [];
        }
        if (s.customSchedule === undefined) {
          needsFix = true;
          fixed.customSchedule = null;
        }
        return fixed;
      });
      return needsFix ? fixedStudents : prevStudents;
    });
  }, []);

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

  // 🔥 過濾學生列表：決定顯示哪些學生
  const visibleStudents = useMemo(() => {
    return students.filter(s => {
        // 如果學校是 "備用"，則根據開關決定是否顯示
        if (s.school === '備用') {
            return showSpareAccounts;
        }
        return true; // 正常學生永遠顯示
    });
  }, [students, showSpareAccounts]);

  const hasChangesInMonth = useCallback((studentId) => {
    return changeLogs.some(log => 
      log.studentId === studentId && 
      log.targetDate.startsWith(monthKey)
    );
  }, [changeLogs, monthKey]);

  const hasChangesOnDate = useCallback((studentId, dateKey) => {
    return changeLogs.some(log => 
      log.studentId === studentId && 
      log.targetDate === dateKey
    );
  }, [changeLogs]);

  // Auto Schedule Logic
  const shouldBookBasedOnRules = useCallback((student, date) => {
    const day = getDayOfWeek(date);
    
    // Priority 1: Check Custom Schedule
    if (student.customSchedule && Array.isArray(student.customSchedule)) {
        return student.customSchedule.includes(day);
    }

    // Priority 2: Fallback to Subject Config
    if (!student.subjects || !Array.isArray(student.subjects)) return false;
    return student.subjects.some(subKey => subjectsConfig[subKey]?.days.includes(day));
  }, [subjectsConfig]);

  const applyAutoSchedule = (studentId) => {
    if (isTrackingMode) {
      alert("⚠️ 功能受限：請先關閉右上角的『追蹤模式』，才能進行自動排程。");
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const scheduleSource = student.customSchedule ? "個人自訂排程" : "科目設定";
    if (!window.confirm(`確定要為「${student.name}」重置本月排程嗎？\n系統將依據【${scheduleSource}】重新打勾。`)) return;

    setBookings(prevBookings => {
      const newBookings = { ...prevBookings };
      daysInMonth.forEach(date => {
        const dateKey = formatDateKey(date);
        const bookingKey = `${studentId}_${dateKey}`;
        const day = getDayOfWeek(date);
        if (day !== 0 && day !== 6) {
           if (shouldBookBasedOnRules(student, date)) {
             newBookings[bookingKey] = true;
           } else {
             delete newBookings[bookingKey];
           }
        }
      });
      return newBookings;
    });
  };

  const applyAutoScheduleAll = () => {
    if (isTrackingMode) {
      alert("⚠️ 功能受限：請先關閉右上角的『追蹤模式』，才能進行全班自動排程。");
      return;
    }

    if (window.confirm(`確定要重置 ${year}年${month+1}月 的所有平日訂餐嗎？\n(有自訂排程者將優先採用，其餘依科目設定)`)) {
      setBookings(prevBookings => {
        const newBookings = { ...prevBookings };
        students.forEach(student => {
          daysInMonth.forEach(date => {
            const dateKey = formatDateKey(date);
            const bookingKey = `${student.id}_${dateKey}`;
            const day = getDayOfWeek(date);
            if (day !== 0 && day !== 6) {
              const shouldBook = shouldBookBasedOnRules(student, date);
              if (shouldBook) {
                newBookings[bookingKey] = true;
              } else {
                delete newBookings[bookingKey];
              }
            }
          });
        });
        return newBookings;
      });
      alert(`排程完成！已更新本月訂餐紀錄。`);
    }
  };

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
    const isCurrentlyBooked = bookings[key];
    
    if (isTrackingMode) {
      const student = students.find(s => s.id === studentId);
      setConfirmModal({
        isOpen: true,
        studentId,
        studentName: student ? student.name : '未知',
        date,
        actionType: isCurrentlyBooked ? '取消訂餐' : '新增訂餐',
        note: ''
      });
      return; 
    }

    setBookings(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      return next;
    });
  };

  const handleConfirmAction = () => {
    const { studentId, date, actionType, note } = confirmModal;
    const dateKey = formatDateKey(date);
    const key = `${studentId}_${dateKey}`;
    const timestamp = new Date().toLocaleString();

    setBookings(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      return next;
    });

    const newTodo = {
      id: Date.now(),
      studentName: confirmModal.studentName,
      dateStr: `${date.getMonth() + 1}/${date.getDate()} (${getWeekdayLabel(date)})`,
      action: actionType,
      timestamp: timestamp,
      isDone: false
    };
    setPendingTodos(prev => [newTodo, ...prev]);

    const newLog = {
      id: Date.now() + 1,
      studentId: studentId,
      studentName: confirmModal.studentName,
      targetDate: dateKey,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
      action: actionType,
      timestamp: timestamp,
      note: note 
    };
    setChangeLogs(prev => [newLog, ...prev]);

    setConfirmModal({ ...confirmModal, isOpen: false, note: '' });
  };

  const handleResolveTodo = (todoId) => {
    setPendingTodos(prev => prev.filter(t => t.id !== todoId));
  };

  const handleClearAllTodos = () => {
    if(window.confirm("確定要清空所有待辦事項嗎？請確認您已同步至紙本訂餐本。")) {
      setPendingTodos([]);
    }
  }

  const handleUpdateLogNote = (logId, newNote) => {
    setChangeLogs(prevLogs => prevLogs.map(log => 
      log.id === logId ? { ...log, note: newNote } : log
    ));
  };

  const openHistoryModal = (e, studentId) => {
    e.stopPropagation();
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedHistoryStudent(student);
      setHistoryFilterDate(null); 
      setShowHistoryModal(true);
    }
  };

  const openHistoryForDate = (e, studentId, dateKey) => {
    e.stopPropagation();
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedHistoryStudent(student);
      setHistoryFilterDate(dateKey); 
      setShowHistoryModal(true);
    }
  };

  // Custom Schedule Modal
  const openCustomScheduleModal = (e, studentId) => {
    e.stopPropagation();
    if (isTrackingMode) {
        alert("⚠️ 功能受限：請先關閉『追蹤模式』才能修改排程設定。");
        return;
    }
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedCustomStudent(student);
      setDraftSchedule(student.customSchedule); 
      setShowCustomScheduleModal(true);
    }
  };

  const handleSaveCustomSchedule = () => {
    if (!selectedCustomStudent) return;
    setStudents(prev => prev.map(s => 
        s.id === selectedCustomStudent.id ? { ...s, customSchedule: draftSchedule } : s
    ));
    setShowCustomScheduleModal(false);
    setDraftSchedule(null);
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setDate(1); 
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    const newSelected = new Date(selectedDay);
    newSelected.setMonth(newSelected.getMonth() + delta);
    setSelectedDay(newSelected);
  };

  const changeSelectedDay = (delta) => {
    const newDate = new Date(selectedDay);
    newDate.setDate(newDate.getDate() + delta);
    if (newDate.getMonth() !== currentDate.getMonth()) {
        setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
    setSelectedDay(newDate);
  }

  const handleAddStudent = () => {
    if (!newStudentName.trim()) { alert('請輸入姓名'); return; }
    const maxId = students.length > 0 ? Math.max(...students.map(s => s.id)) : 0;
    setStudents([...students, { id: maxId + 1, name: newStudentName, school: newStudentSchool || '未填寫', subjects: [], rawDays: '', customSchedule: null }]);
    setNewStudentName(''); setNewStudentSchool(''); setShowAddStudent(false);
  };

  // 🔥 產生備用帳號 (Batch Create)
  const handleCreateSpareAccounts = () => {
    const spares = [
        { name: '臨時 A', school: '備用' },
        { name: '臨時 B', school: '備用' },
        { name: '臨時 C', school: '備用' }
    ];
    
    // 檢查是否已存在
    const existingSpares = students.filter(s => s.school === '備用');
    if (existingSpares.length >= 3) {
        alert("已經有足夠的備用帳號了！");
        return;
    }

    const newStudents = spares.map((spare, index) => ({
        id: Date.now() + index, // Unique ID
        name: spare.name,
        school: spare.school,
        subjects: [],
        rawDays: '',
        customSchedule: null
    }));

    setStudents([...students, ...newStudents]);
    alert("已建立 3 個備用帳號！");
    setShowSpareAccounts(true); // 自動開啟顯示，讓使用者看到
  };

  const handleDepositChange = (studentId, value) => {
    const key = `${studentId}_${monthKey}`;
    setDeposits(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  const toggleSubject = (studentId, subjectKey) => {
    if (isTrackingMode) {
      alert("⚠️ 功能受限：請先關閉『追蹤模式』才能修改科目設定。");
      return;
    }

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const currentSubjects = Array.isArray(s.subjects) ? s.subjects : [];
      const newSubjects = currentSubjects.includes(subjectKey)
        ? currentSubjects.filter(sub => sub !== subjectKey)
        : [...currentSubjects, subjectKey];
      return { ...s, subjects: newSubjects };
    }));
  };

  const exportData = () => {
    const data = { students, bookings, deposits, mealPrice, specialDates, eventTypes, pendingTodos, changeLogs, subjectsConfig };
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
        if (data.pendingTodos) setPendingTodos(data.pendingTodos);
        if (data.changeLogs) setChangeLogs(data.changeLogs); 
        if (data.subjectsConfig) setSubjectsConfig(data.subjectsConfig); 
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

  const copyDailySummary = () => {
    const dateStr = `${selectedDay.getMonth()+1}/${selectedDay.getDate()}`;
    const dateKey = formatDateKey(selectedDay);
    const bookedStudents = students.filter(s => bookings[`${s.id}_${dateKey}`]);
    
    if (bookedStudents.length === 0) {
      alert(`${dateStr} 尚無人訂餐`);
      return;
    }

    const text = `📅 ${dateStr} (${getWeekdayLabel(selectedDay)}) 訂餐統計\n🍱 總份數：${bookedStudents.length} 份\n📝 名單：\n${bookedStudents.map(s => s.name).join('、')}\n💰 總金額：${bookedStudents.length * mealPrice} 元`;

    navigator.clipboard.writeText(text).then(() => {
      alert('✅ 已複製訂餐資訊到剪貼簿！');
    }).catch(err => {
      console.error('複製失敗:', err);
      alert('複製失敗，請手動選取');
    });
  };

  // Subject Config Handlers
  const handleUpdateSubject = (key, field, value) => {
    setSubjectsConfig(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleToggleSubjectDay = (key, day) => {
    setSubjectsConfig(prev => {
        const currentDays = prev[key].days;
        const newDays = currentDays.includes(day) 
            ? currentDays.filter(d => d !== day) 
            : [...currentDays, day].sort();
        return { ...prev, [key]: { ...prev[key], days: newDays } };
    });
  };

  const handleAddSubject = () => {
    const newId = `sub_${Date.now()}`;
    setSubjectsConfig(prev => ({
        ...prev,
        [newId]: { label: '新科目', days: [], color: 'gray' }
    }));
  };

  const handleDeleteSubject = (key) => {
    if (window.confirm("確定刪除此科目規則嗎？這不會刪除學生的訂餐紀錄，但會移除該科目的自動排程設定。")) {
        const newConfig = { ...subjectsConfig };
        delete newConfig[key];
        setSubjectsConfig(newConfig);
    }
  };
  
  // --- UI Components ---

  const currentSpecialInfo = getSpecialDateInfo(selectedDay);
  const currentDailyCount = dailyStats.daily[formatDateKey(selectedDay)] || 0;

  // Custom Schedule Modal Component (Updated with Draft Logic)
  const CustomScheduleModal = () => {
    if (!showCustomScheduleModal || !selectedCustomStudent) return null;
    
    // Use draftSchedule for rendering instead of direct student data
    const currentSchedule = draftSchedule || [];

    const toggleDay = (day) => {
        let newSchedule = [...currentSchedule];
        if (newSchedule.includes(day)) {
            newSchedule = newSchedule.filter(d => d !== day);
        } else {
            newSchedule.push(day);
        }
        setDraftSchedule(newSchedule); // Update draft only
    };

    const clearCustom = () => {
        setDraftSchedule(null); // Update draft to null
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-indigo-600"/>
                    設定個人排程
                </h3>
                <p className="text-gray-600 mb-4 font-bold text-xl">{selectedCustomStudent.name}</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                    <p>若設定此排程，自動排程時將<strong>忽略科目設定</strong>，僅依據下方勾選的星期進行訂餐。</p>
                </div>

                <label className="block text-sm font-bold text-gray-700 mb-2">固定訂餐日</label>
                <div className="flex justify-between mb-6">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                        <button
                            key={day}
                            onClick={() => toggleDay(day)}
                            className={`
                                w-8 h-8 rounded-full font-bold transition-all border
                                ${currentSchedule && currentSchedule.includes(day) 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}
                            `}
                        >
                            {day === 0 ? '日' : ['一','二','三','四','五','六'][day-1]}
                        </button>
                    ))}
                </div>

                {/* Status Indicator for Draft */}
                {draftSchedule === null && (
                    <div className="text-center text-gray-500 text-sm mb-4">
                        目前狀態：<span className="font-bold text-green-600">跟隨科目排程</span>
                    </div>
                )}
                {draftSchedule !== null && draftSchedule.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mb-4">
                        目前狀態：<span className="font-bold text-red-500">不訂餐 (空排程)</span>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <button onClick={handleSaveCustomSchedule} className="w-full py-2 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700">
                        完成設定
                    </button>
                    <button onClick={clearCustom} className="w-full py-2 text-gray-500 hover:bg-gray-100 rounded-md text-sm">
                        清除自訂 (恢復跟隨科目)
                    </button>
                </div>
            </div>
        </div>
    );
  };

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
            {/* 追蹤模式開關 (Toggle Switch) */}
            <div 
              onClick={() => setIsTrackingMode(!isTrackingMode)}
              className={`
                cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all select-none
                ${isTrackingMode ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-100 border-gray-200 text-gray-500'}
              `}
              title="開啟後，任何修改都會強制跳出確認視窗，且禁止使用自動排程"
            >
              <BellRing className={`w-4 h-4 ${isTrackingMode ? 'fill-red-600 animate-pulse' : ''}`} />
              <span className="text-xs font-bold hidden sm:inline">{isTrackingMode ? '追蹤中' : '追蹤關閉'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             {/* Todo List Button */}
             <button 
                onClick={() => setShowTodoModal(true)} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative"
                title="待辦事項 (紙本同步)"
             >
               <ClipboardList className="w-5 h-5" />
               {pendingTodos.length > 0 && (
                 <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                   {pendingTodos.length}
                 </span>
               )}
             </button>

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
            <span className="px-4 font-semibold text-lg min-w-[200px] text-center">
              {year}年 <span className="text-sm font-normal text-gray-500">(民國{year-1911}年)</span> {month + 1}月
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 rounded text-gray-600"><ChevronRight className="w-5 h-5" /></button>
          </div>

          {/* Desktop Tools (Hidden on Mobile) */}
          <div className="hidden md:flex gap-2">
             <button onClick={() => setShowSpecialDatesList(true)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">
                <Flag className="w-4 h-4 text-yellow-600" /> 行事曆
             </button>
             {/* 🔒 鎖定狀態下的自動排程按鈕 */}
             <button 
                onClick={applyAutoScheduleAll} 
                className={`flex items-center gap-1 px-3 py-1.5 border rounded text-sm transition-all ${
                  isTrackingMode 
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
                title={isTrackingMode ? "追蹤模式下無法自動排程" : "全班自動排程"}
             >
                <Calculator className="w-4 h-4" /> 全班自動排程
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
                        <span>學生 ({visibleStudents.length})</span>
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
                  <th className="sticky top-0 z-30 min-w-[100px] p-2 border-b border-r bg-gray-100 text-xs font-bold text-gray-600 shadow-sm">期初</th>
                  <th className="sticky top-0 z-30 min-w-[140px] p-2 border-b bg-indigo-50 text-xs font-bold text-indigo-700 shadow-sm">結餘</th>
                </tr>
             </thead>
             <tbody>
                {visibleStudents.map(student => {
                    const stats = getMonthlyStats(student.id);
                    const hasChanged = hasChangesInMonth(student.id);
                    // 🔥 Check if custom schedule is active
                    const hasCustomSchedule = student.customSchedule !== null;

                    return (
                        <tr key={student.id} className="hover:bg-gray-50 group">
                            <td className="sticky left-0 z-20 bg-white border-b border-r p-2 font-medium flex-col justify-center group-hover:bg-gray-50">
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-1">
                                        <span className={student.school === '備用' ? 'text-gray-500 italic' : ''}>{student.name}</span>
                                        {/* 🔥 歷史異動按鈕 (Desktop) */}
                                        <button 
                                          onClick={(e) => openHistoryModal(e, student.id)}
                                          className={`p-1 rounded-full transition-all ${hasChanged ? 'text-purple-600 bg-purple-50 hover:bg-purple-100 animate-pulse' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                          title="檢視異動紀錄"
                                        >
                                          <FileText className="w-4 h-4"/>
                                        </button>
                                        {/* 🔥 自訂排程按鈕 */}
                                        <button 
                                          onClick={(e) => openCustomScheduleModal(e, student.id)}
                                          className={`p-1 rounded-full transition-all ${hasCustomSchedule ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                          title={hasCustomSchedule ? "已啟用個人排程" : "設定個人排程"}
                                        >
                                          <CalendarClock className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => applyAutoSchedule(student.id)} 
                                        className={`p-1 rounded ${isTrackingMode ? 'text-gray-300 cursor-not-allowed' : 'text-blue-400 hover:bg-blue-50'}`}
                                        title={isTrackingMode ? "追蹤模式下禁用" : "重新排程此學生"}
                                      >
                                        <RefreshCw className="w-3 h-3"/>
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteClick(student)} 
                                        className="text-red-400 hover:bg-red-50 p-1 rounded" 
                                        title="刪除學生"
                                      >
                                        <Trash2 className="w-3 h-3"/>
                                      </button>
                                    </div>
                                </div>
                                {/* 🔥 Render Subject Toggles from Dynamic Config */}
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {Object.entries(subjectsConfig).map(([key, info]) => (
                                    <button
                                      key={key}
                                      onClick={() => toggleSubject(student.id, key)}
                                      className={`text-[10px] px-1 rounded border transition-colors ${
                                        isTrackingMode ? 'cursor-not-allowed opacity-50' : ''
                                      } ${
                                        student.subjects && student.subjects.includes(key) 
                                          ? `${COLOR_THEMES[info.color].bg} ${COLOR_THEMES[info.color].text} ${COLOR_THEMES[info.color].border}` 
                                          : 'bg-white text-gray-300 border-gray-200'
                                      }`}
                                    >
                                      {info.label}
                                    </button>
                                  ))}
                                </div>
                            </td>
                            {daysInMonth.map(date => {
                                const dateKey = formatDateKey(date);
                                const isBooked = bookings[`${student.id}_${dateKey}`];
                                const sp = getSpecialDateInfo(date);
                                const isHoliday = sp && sp.type === 'holiday';
                                const hasCellChange = hasChangesOnDate(student.id, dateKey);

                                return (
                                    <td key={date.toString()} onClick={() => toggleBooking(student.id, date)} 
                                        className={`border-b border-r text-center cursor-pointer relative ${isBooked ? 'bg-green-100' : ''} ${isHoliday ? 'bg-red-50' : ''}`}>
                                        
                                        {isBooked && <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto"/>}

                                        {hasCellChange && (
                                          <div 
                                            onClick={(e) => openHistoryForDate(e, student.id, dateKey)}
                                            className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full hover:scale-125 transition-transform"
                                            title="有點名異動，點擊查看"
                                          ></div>
                                        )}
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
                    return <td key={date.toString()} className="border-b border-r text-center text-sm font-bold text-gray-700 py-2">
                    {c > 0 ? c : '-'}
                  </td>
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
            {visibleStudents.map(student => {
                const dateKey = formatDateKey(selectedDay);
                const isBooked = bookings[`${student.id}_${dateKey}`];
                const specialInfo = getSpecialDateInfo(selectedDay);
                const isHoliday = specialInfo && specialInfo.type === 'holiday';
                const hasCellChange = hasChangesOnDate(student.id, dateKey);

                return (
                    <div key={student.id} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors relative">
                        <div className="flex items-center gap-3">
                            {student.school === '備用' ? (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 bg-gray-50 text-gray-400 border-gray-200`}>
                                    <Ghost className="w-5 h-5"/>
                                </div>
                            ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white ${isBooked ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    {student.name[0]}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className={`font-bold text-lg ${student.school === '備用' ? 'text-gray-500' : 'text-gray-800'}`}>{student.name}</div>
                                    {/* Mobile Change Indicator */}
                                    {hasCellChange && (
                                        <button 
                                          onClick={(e) => openHistoryForDate(e, student.id, dateKey)}
                                          className="p-1 rounded-full text-orange-500 bg-orange-50 animate-pulse"
                                        >
                                          <FileText className="w-4 h-4"/>
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mb-1">{student.school}</div>
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
         <div onClick={copyDailySummary} className="cursor-pointer active:opacity-70 transition-opacity">
            <div className="text-xs text-gray-500 flex items-center gap-1">
                今日訂餐 <Copy className="w-3 h-3"/>
            </div>
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

      {/* Modals */}
      {/* Settings Modal (Enhanced with Subject Config & Lock) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-lg mb-4">設定</h3>
                
                {/* 1. 費用設定 */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">單餐費用</label>
                    <input type="number" value={mealPrice} onChange={(e) => setMealPrice(Number(e.target.value))} className="w-full border p-2 rounded"/>
                </div>

                {/* 備用帳號開關 */}
                <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Ghost className="w-4 h-4"/> 備用帳號管理
                        </label>
                        <button 
                            onClick={() => setShowSpareAccounts(!showSpareAccounts)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${showSpareAccounts ? 'bg-indigo-100 text-indigo-600 font-bold' : 'bg-gray-200 text-gray-500'}`}
                        >
                            {showSpareAccounts ? <><Eye className="w-3 h-3"/> 顯示中</> : <><EyeOff className="w-3 h-3"/> 已隱藏</>}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">隱藏學校為「備用」的學生，保持版面整潔。</p>
                    <button 
                        onClick={handleCreateSpareAccounts}
                        className="w-full py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-3 h-3"/> 一鍵建立 3 個備用帳號
                    </button>
                </div>

                {/* 2. 科目與排程管理 (Locked by Default) */}
                <div className="mb-6 border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Edit3 className="w-4 h-4"/> 科目與排程管理
                      </label>
                      <button 
                        onClick={() => setIsEditingSubjects(!isEditingSubjects)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${isEditingSubjects ? 'bg-red-100 text-red-600 font-bold' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {isEditingSubjects ? <><Unlock className="w-3 h-3"/> 編輯中</> : <><Lock className="w-3 h-3"/> 解鎖編輯</>}
                      </button>
                    </div>

                    {/* Mask for locking */}
                    <div className={`space-y-4 transition-all duration-300 ${isEditingSubjects ? '' : 'opacity-50 pointer-events-none grayscale'}`}>
                        {Object.entries(subjectsConfig).map(([key, info]) => (
                            <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                {/* Header: Color, Name, Delete */}
                                <div className="flex items-center gap-2 mb-2">
                                    <button 
                                        className={`w-5 h-5 rounded-full border-2 border-white shadow-sm ${COLOR_THEMES[info.color].dot}`}
                                        title="點擊切換顏色"
                                        onClick={() => {
                                            const colors = Object.keys(COLOR_THEMES);
                                            const nextColor = colors[(colors.indexOf(info.color) + 1) % colors.length];
                                            handleUpdateSubject(key, 'color', nextColor);
                                        }}
                                    ></button>
                                    <input 
                                        value={info.label} 
                                        onChange={e => handleUpdateSubject(key, 'label', e.target.value)} 
                                        className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm font-bold"
                                    />
                                    <button onClick={() => handleDeleteSubject(key)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                                {/* Days Selector */}
                                <div className="flex justify-between">
                                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                                        <button
                                            key={day}
                                            onClick={() => handleToggleSubjectDay(key, day)}
                                            className={`
                                                w-6 h-6 rounded-full text-[10px] font-bold transition-all
                                                ${info.days.includes(day) 
                                                    ? 'bg-indigo-600 text-white shadow-md transform scale-110' 
                                                    : 'bg-white text-gray-400 border border-gray-200'}
                                            `}
                                        >
                                            {day === 0 ? '日' : ['一','二','三','四','五','六'][day-1]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={handleAddSubject}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4"/> 新增科目規則
                        </button>
                    </div>
                </div>

                {/* 3. 特殊日期標籤 (Label Editing) */}
                <div className="mb-6 border-t border-gray-100 pt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">標籤名稱</label>
                    <div className="space-y-2">
                        {Object.entries(eventTypes).map(([k,v]) => (
                            <div key={k} className="flex gap-2"><div className={`w-4 h-4 rounded ${v.color.split(' ')[0].replace('text','bg').replace('100','500')}`}></div><input value={v.label} onChange={e=>handleEventTypeChange(k,e.target.value)} className="border rounded px-1 text-sm flex-1"/></div>
                        ))}
                    </div>
                </div>

                {/* 4. Reset */}
                <div className="pt-2">
                    <button onClick={handleResetAllData} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium border border-red-200">
                        清除所有資料 (重置)
                    </button>
                    <button onClick={() => setShowSettings(false)} className="w-full mt-2 px-4 py-2 bg-gray-100 rounded-md text-gray-600 text-sm font-medium">關閉</button>
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

      {/* Todo List Modal */}
      {showTodoModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                   <ClipboardList className="w-5 h-5 text-indigo-600"/> 待辦事項 (紙本同步)
                 </h3>
                 <button onClick={()=>setShowTodoModal(false)}><X/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                 {pendingTodos.length === 0 ? (
                   <div className="text-center text-gray-400 py-8">目前沒有待處理的異動</div>
                 ) : (
                   pendingTodos.map(todo => (
                     <div key={todo.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-start">
                        <div>
                          <div className="font-bold text-gray-800">{todo.studentName} <span className="font-normal text-gray-500 text-sm">({todo.dateStr})</span></div>
                          <div className={`text-sm font-bold ${todo.action === '取消訂餐' ? 'text-red-500' : 'text-green-600'}`}>{todo.action}</div>
                          <div className="text-xs text-gray-400 mt-1">{todo.timestamp}</div>
                        </div>
                        <button 
                          onClick={() => handleResolveTodo(todo.id)}
                          className="text-gray-400 hover:text-green-600 p-2"
                          title="標記為已完成"
                        >
                          <CheckSquare className="w-6 h-6"/>
                        </button>
                     </div>
                   ))
                 )}
              </div>
              <div className="p-4 border-t bg-white rounded-b-xl flex justify-between items-center">
                 <span className="text-xs text-gray-500">請記得同步修改紙本訂餐本</span>
                 {pendingTodos.length > 0 && (
                   <button onClick={handleClearAllTodos} className="text-sm text-red-500 font-bold hover:underline">全部清除</button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 border-t-4 border-red-500">
              <div className="text-center">
                 <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                 </div>
                 <h3 className="font-bold text-xl text-gray-900 mb-1">
                   確認{confirmModal.actionType}？
                 </h3>
                 <p className="text-gray-600 font-medium text-lg mb-4">
                   {confirmModal.studentName} <span className="text-sm text-gray-400">|</span> {confirmModal.date.getMonth()+1}/{confirmModal.date.getDate()}
                 </p>
                 
                 <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 text-left">
                    <p className="text-red-800 text-sm font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4"/> 
                      請現在拿起筆！
                    </p>
                    <p className="text-red-600 text-xs mt-1">
                      務必同步修改紙本訂餐表上的數字或名單。
                    </p>
                 </div>

                 <div className="text-left mb-4">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">備註 (選填)</label>
                    <input 
                      type="text" 
                      placeholder="例如：家長Line請假..." 
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:border-indigo-500 outline-none"
                      value={confirmModal.note}
                      onChange={(e) => setConfirmModal({...confirmModal, note: e.target.value})}
                      autoFocus
                    />
                 </div>

                 <div className="flex gap-3">
                    <button 
                      onClick={() => setConfirmModal({...confirmModal, isOpen: false})} 
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleConfirmAction} 
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md"
                    >
                      確認執行
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 🔥 新增：歷史紀錄視窗 (History Modal) */}
      {showHistoryModal && selectedHistoryStudent && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b bg-purple-50 rounded-t-xl">
                 <h3 className="font-bold text-lg flex items-center gap-2 text-purple-900">
                   <FileText className="w-5 h-5 text-purple-600"/> 
                   {selectedHistoryStudent.name} 的異動紀錄
                 </h3>
                 <button onClick={()=>setShowHistoryModal(false)}><X/></button>
              </div>

              {/* 篩選器提示 */}
              {historyFilterDate && (
                <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-100 flex justify-between items-center">
                  <span className="text-sm text-yellow-800 flex items-center gap-1">
                    <Filter className="w-3 h-3"/> 僅顯示 {historyFilterDate.split('-').slice(1).join('/')} 的紀錄
                  </span>
                  <button 
                    onClick={() => setHistoryFilterDate(null)}
                    className="text-xs text-blue-600 underline"
                  >
                    顯示全部
                  </button>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                 {(() => {
                    const studentLogs = changeLogs.filter(log => {
                      if (log.studentId !== selectedHistoryStudent.id) return false;
                      // 如果有設定篩選日期，只顯示該日期的紀錄
                      if (historyFilterDate) return log.targetDate === historyFilterDate;
                      // 否則顯示本月的紀錄
                      return log.targetDate.startsWith(monthKey);
                    });

                    if (studentLogs.length === 0) {
                      return <div className="text-center text-gray-400 py-10">
                        {historyFilterDate ? '該日期無異動紀錄' : '本月尚無異動紀錄'}
                      </div>;
                    }

                    return studentLogs.map(log => (
                      <div key={log.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                         <div className="flex justify-between items-start mb-2">
                            <div>
                               <div className="font-bold text-gray-700 flex items-center gap-2">
                                 {log.displayDate} 
                                 <span className={`text-xs px-2 py-0.5 rounded-full ${log.action === '取消訂餐' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                   {log.action}
                                 </span>
                               </div>
                               <div className="text-xs text-gray-400 mt-1">{log.timestamp}</div>
                            </div>
                         </div>
                         
                         {/* 備註編輯區 */}
                         <div className="flex items-center gap-2 mt-2">
                            <FilePenLine className="w-4 h-4 text-gray-400" />
                            <input 
                              type="text" 
                              placeholder="點此新增備註 (如：家長Line請假)..."
                              value={log.note || ''}
                              onChange={(e) => handleUpdateLogNote(log.id, e.target.value)}
                              className="flex-1 text-sm border-b border-gray-200 focus:border-purple-500 outline-none bg-transparent py-1 text-gray-600 placeholder-gray-300"
                            />
                         </div>
                      </div>
                    ));
                 })()}
              </div>
              
              <div className="p-3 border-t bg-gray-50 rounded-b-xl text-center">
                 <button onClick={()=>setShowHistoryModal(false)} className="px-6 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100">關閉</button>
              </div>
           </div>
        </div>
      )}

      {/* Custom Schedule Modal */}
      <CustomScheduleModal />

    </div>
  );
};

export default App;