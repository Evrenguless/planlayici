/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle,
  Calendar as CalendarIcon,
  BookOpen,
  Pencil,
  Check,
  X,
  Trophy,
  Quote,
  Target,
  BarChart3,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  differenceInDays,
  startOfToday
} from 'date-fns';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Topic {
  id: string;
  text: string;
  completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

interface DayTasks {
  [date: string]: Subject[];
}

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [tasks, setTasks] = useState<DayTasks>(() => {
    const saved = localStorage.getItem('kpss-planner-tasks-v2');
    if (saved) return JSON.parse(saved);
    
    // Migration from old flat structure if exists
    const oldSaved = localStorage.getItem('kpss-planner-tasks');
    if (oldSaved) {
      const oldTasks = JSON.parse(oldSaved);
      const migrated: DayTasks = {};
      Object.keys(oldTasks).forEach(date => {
        migrated[date] = [{
          id: crypto.randomUUID(),
          name: "Genel",
          topics: oldTasks[date]
        }];
      });
      return migrated;
    }
    return {};
  });
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicText, setNewTopicText] = useState<{ [subjectId: string]: string }>({});
  const [editingTopic, setEditingTopic] = useState<{ subjectId: string, topicId: string, text: string } | null>(null);

  // Motivational Quotes
  const quotes = [
    "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.",
    "Gelecek, bugünden hazırlananlara aittir.",
    "Zorluklar, başarının değerini artıran süslerdir.",
    "Ertelemek, zaman hırsızıdır. Şimdi başla!",
    "Hedefine odaklan, engelleri basamak yap.",
    "Bugün yapacağın fedakarlık, yarınki özgürlüğündür.",
    "Pes etmediğin sürece mağlup sayılmazsın."
  ];
  const [dailyQuote] = useState(quotes[new Date().getDay() % quotes.length]);

  // Monthly Stats Logic
  const getMonthlyStats = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    let total = 0;
    let completed = 0;
    
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const daySubjects = tasks[dateKey] || [];
      daySubjects.forEach(sub => {
        total += sub.topics.length;
        completed += sub.topics.filter(t => t.completed).length;
      });
    });
    
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getMonthlyStats();

  // Exam Countdown Logic
  const examDate = new Date('2026-09-06'); // Örnek KPSS Tarihi
  const daysLeft = differenceInDays(examDate, startOfToday());

  // Subject-wise Stats for current month
  const getSubjectStats = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const subjectMap: { [name: string]: { total: number, completed: number } } = {};
    
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const daySubjects = tasks[dateKey] || [];
      daySubjects.forEach(sub => {
        const name = sub.name.trim().toUpperCase();
        if (!subjectMap[name]) subjectMap[name] = { total: 0, completed: 0 };
        subjectMap[name].total += sub.topics.length;
        subjectMap[name].completed += sub.topics.filter(t => t.completed).length;
      });
    });
    
    return Object.entries(subjectMap).map(([name, data]) => ({
      name,
      ...data,
      percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    })).sort((a, b) => b.percent - a.percent);
  };

  const subjectStats = getSubjectStats();

  // Persist tasks to localStorage
  useEffect(() => {
    localStorage.setItem('kpss-planner-tasks-v2', JSON.stringify(tasks));
  }, [tasks]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const addSubject = () => {
    if (!selectedDate || !newSubjectName.trim()) return;
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: newSubjectName.trim(),
      topics: [],
    };

    setTasks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newSubject]
    }));
    setNewSubjectName('');
  };

  const addTopic = (subjectId: string) => {
    if (!selectedDate || !newTopicText[subjectId]?.trim()) return;
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      text: newTopicText[subjectId].trim(),
      completed: false,
    };

    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(subject => 
        subject.id === subjectId 
          ? { ...subject, topics: [...subject.topics, newTopic] }
          : subject
      )
    }));
    
    setNewTopicText(prev => ({ ...prev, [subjectId]: '' }));
  };

  const toggleTopic = (dateKey: string, subjectId: string, topicId: string) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(subject => 
        subject.id === subjectId 
          ? { 
              ...subject, 
              topics: subject.topics.map(topic => 
                topic.id === topicId ? { ...topic, completed: !topic.completed } : topic
              ) 
            }
          : subject
      )
    }));
  };

  const deleteSubject = (dateKey: string, subjectId: string) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(subject => subject.id !== subjectId)
    }));
  };

  const deleteTopic = (dateKey: string, subjectId: string, topicId: string) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(subject => 
        subject.id === subjectId 
          ? { ...subject, topics: subject.topics.filter(topic => topic.id !== topicId) }
          : subject
      )
    }));
  };

  const updateTopic = (dateKey: string, subjectId: string, topicId: string, newText: string) => {
    if (!newText.trim()) return;
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(subject => 
        subject.id === subjectId 
          ? { 
              ...subject, 
              topics: subject.topics.map(topic => 
                topic.id === topicId ? { ...topic, text: newText.trim() } : topic
              ) 
            }
          : subject
      )
    }));
    setEditingTopic(null);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col px-6 py-8 bg-white border-b border-slate-200 gap-6">
        {/* Exam Countdown Banner */}
        <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between overflow-hidden relative">
          <div className="flex items-center gap-4 z-10">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Target size={24} />
            </div>
            <div>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">KPSS 2026 Hedefi</p>
              <h3 className="text-white font-bold text-lg">Sınava Kalan Süre</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-4xl font-black text-white tracking-tighter">{daysLeft}</span>
            <span className="text-emerald-400 font-bold text-sm uppercase">Gün</span>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                KPSS Çalışma Planlayıcı
              </h1>
              <div className="flex items-center gap-2 text-slate-400">
                <Quote size={12} />
                <p className="text-xs italic font-medium">{dailyQuote}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                  viewMode === 'calendar' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Takvim
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                  viewMode === 'list' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Liste
              </button>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-4">
              <button 
                onClick={prevMonth}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-slate-700 min-w-[140px] text-center capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: tr })}
              </h2>
              <button 
                onClick={nextMonth}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Progress Bar */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <span className="text-sm font-bold text-slate-700">Aylık Genel İlerleme</span>
            </div>
            <span className="text-sm font-black text-emerald-600">%{stats.percent}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.percent}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            Toplam {stats.total} konudan {stats.completed} tanesi tamamlandı.
          </p>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="flex flex-col">
        {/* Subject Summary Cards */}
        {subjectStats.length > 0 && (
          <div className="p-6 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Ders Bazlı Özet</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {subjectStats.map((sub, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 min-w-[140px] shadow-sm shrink-0">
                  <p className="text-[10px] font-black text-slate-400 mb-1 truncate">{sub.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-800">%{sub.percent}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{sub.completed}/{sub.total}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${sub.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {days.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySubjects = tasks[dateKey] || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div key={idx} className={cn(
              "p-6 hover:bg-slate-50/50 transition-colors group",
              isToday && "bg-emerald-50/30"
            )}>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-48 shrink-0">
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-3xl font-black",
                      isToday ? "text-emerald-600" : "text-slate-800"
                    )}>
                      {format(day, 'dd')}
                    </span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      {format(day, 'EEEE', { locale: tr })}
                    </span>
                  </div>
                  {isToday && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">
                      Bugün
                    </span>
                  )}
                  <button 
                    onClick={() => onDateClick(day)}
                    className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Plus size={14} /> Ders Düzenle
                  </button>
                </div>

                <div className="flex-1">
                  {daySubjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {daySubjects.map(subject => (
                        <div key={subject.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm group/subject relative">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <div className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                              {subject.name}
                            </h4>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSubject(dateKey, subject.id);
                              }}
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover/subject:opacity-100 transition-opacity p-1"
                              title="Dersi Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {subject.topics.map(topic => (
                              <div 
                                key={topic.id}
                                className={cn(
                                  "group/topic text-xs p-2 rounded-lg border flex items-center justify-between gap-2 transition-all",
                                  topic.completed 
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 opacity-60" 
                                    : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200"
                                )}
                              >
                                <div 
                                  className="flex items-center gap-2 cursor-pointer flex-1"
                                  onClick={() => toggleTopic(dateKey, subject.id, topic.id)}
                                >
                                  {topic.completed ? (
                                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <Circle size={14} className="text-slate-300 shrink-0" />
                                  )}
                                  <span className={cn(topic.completed && "line-through")}>
                                    {topic.text}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDateClick(day);
                                      setEditingTopic({ subjectId: subject.id, topicId: topic.id, text: topic.text });
                                    }}
                                    className="text-slate-400 hover:text-emerald-600 p-0.5"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTopic(dateKey, subject.id, topic.id);
                                    }}
                                    className="text-slate-400 hover:text-red-500 p-0.5"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center">
                      <p className="text-sm text-slate-300 italic">Bu gün için planlanmış ders yok.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    return (
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {days.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 border-l border-t border-slate-200">
        {calendarDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySubjects = tasks[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          const totalTopics = daySubjects.reduce((acc, sub) => acc + sub.topics.length, 0);
          const completedTopics = daySubjects.reduce((acc, sub) => acc + sub.topics.filter(t => t.completed).length, 0);

          return (
            <div
              key={idx}
              onClick={() => onDateClick(day)}
              className={cn(
                "min-h-[140px] p-2 bg-white border-r border-b border-slate-200 cursor-pointer transition-all hover:bg-slate-50 group relative",
                !isCurrentMonth && "bg-slate-50/50 text-slate-300",
                isSelected && "ring-2 ring-emerald-500 ring-inset z-10"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isToday && "bg-emerald-600 text-white",
                  !isToday && isCurrentMonth && "text-slate-700",
                  !isToday && !isCurrentMonth && "text-slate-300"
                )}>
                  {format(day, 'd')}
                </span>
                {totalTopics > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {completedTopics}/{totalTopics}
                  </span>
                )}
              </div>
              
              <div className="space-y-1 overflow-hidden">
                {daySubjects.slice(0, 3).map(subject => (
                  <div 
                    key={subject.id}
                    className={cn(
                      "text-[11px] px-2 py-1 rounded truncate flex items-center gap-1.5",
                      subject.topics.length > 0 && subject.topics.every(t => t.completed)
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      subject.topics.length > 0 && subject.topics.every(t => t.completed) ? "bg-emerald-400" : "bg-slate-400"
                    )} />
                    <span className="font-semibold">{subject.name}</span>
                  </div>
                ))}
                {daySubjects.length > 3 && (
                  <div className="text-[10px] text-slate-400 pl-2">
                    + {daySubjects.length - 3} ders...
                  </div>
                )}
              </div>

              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-full">
                  <Plus size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200">
          {renderHeader()}
          {viewMode === 'calendar' ? (
            <>
              {renderDays()}
              {renderCells()}
            </>
          ) : (
            renderListView()
          )}
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedDate(null); setEditingTopic(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
                  </h3>
                  <p className="text-sm text-slate-500">Günlük Çalışma Programı</p>
                </div>
                <button 
                  onClick={() => { setSelectedDate(null); setEditingTopic(null); }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <ChevronRight className="rotate-90" size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                    placeholder="Ders adı ekle (örn: Matematik)..."
                    className="flex-1 px-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                  <button 
                    onClick={addSubject}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={18} /> Ders Ekle
                  </button>
                </div>

                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {tasks[format(selectedDate, 'yyyy-MM-dd')]?.length ? (
                    tasks[format(selectedDate, 'yyyy-MM-dd')].map(subject => (
                      <div key={subject.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-2 h-4 bg-emerald-500 rounded-full" />
                            {subject.name}
                          </h4>
                          <button 
                            onClick={() => deleteSubject(format(selectedDate, 'yyyy-MM-dd'), subject.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="space-y-2 mb-4">
                          {subject.topics.map(topic => (
                            <div 
                              key={topic.id}
                              className={cn(
                                "group flex items-center justify-between p-2.5 rounded-xl border transition-all",
                                topic.completed 
                                  ? "bg-emerald-50 border-emerald-100" 
                                  : "bg-white border-slate-100"
                              )}
                            >
                              {editingTopic?.topicId === topic.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input 
                                    type="text"
                                    autoFocus
                                    value={editingTopic.text}
                                    onChange={(e) => setEditingTopic({ ...editingTopic, text: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') updateTopic(format(selectedDate, 'yyyy-MM-dd'), subject.id, topic.id, editingTopic.text);
                                      if (e.key === 'Escape') setEditingTopic(null);
                                    }}
                                    className="flex-1 px-2 py-1 bg-white border border-emerald-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-emerald-500"
                                  />
                                  <button 
                                    onClick={() => updateTopic(format(selectedDate, 'yyyy-MM-dd'), subject.id, topic.id, editingTopic.text)}
                                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingTopic(null)}
                                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div 
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                    onClick={() => toggleTopic(format(selectedDate, 'yyyy-MM-dd'), subject.id, topic.id)}
                                  >
                                    {topic.completed ? (
                                      <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                                    ) : (
                                      <Circle className="text-slate-300 shrink-0" size={18} />
                                    )}
                                    <span className={cn(
                                      "text-sm font-medium transition-all",
                                      topic.completed ? "text-emerald-700 line-through opacity-60" : "text-slate-700"
                                    )}>
                                      {topic.text}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setEditingTopic({ subjectId: subject.id, topicId: topic.id, text: topic.text })}
                                      className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                                      title="Düzenle"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button 
                                      onClick={() => deleteTopic(format(selectedDate, 'yyyy-MM-dd'), subject.id, topic.id)}
                                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                      title="Sil"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={newTopicText[subject.id] || ''}
                            onChange={(e) => setNewTopicText(prev => ({ ...prev, [subject.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addTopic(subject.id)}
                            placeholder="Konu ekle..."
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                          />
                          <button 
                            onClick={() => addTopic(subject.id)}
                            className="bg-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-300 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-slate-300" size={32} />
                      </div>
                      <p className="text-slate-400 text-sm">Henüz bir ders eklenmemiş.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => { setSelectedDate(null); setEditingTopic(null); }}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
