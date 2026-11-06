import React, { useState, useEffect } from 'react';
import { Appointment, AvailableSlot, DayId, Student, TeacherSettings } from './types';
import {
  loadAppointments,
  loadSettings,
  loadStudents,
  resetAllData,
  saveAppointments,
  saveSettings,
  saveStudents,
  saveToCloudServer,
  loadFromCloudServer,
  getLastCloudSyncTime,
} from './utils/storage';
import { Header, ActiveTab } from './components/Header';
import { WeeklySchedule } from './components/WeeklySchedule';
import { DailySchedule } from './components/DailySchedule';
import { AppointmentsList } from './components/AppointmentsList';
import { StudentManager } from './components/StudentManager';
import { AppointmentModal } from './components/AppointmentModal';
import { FreeSlotFinderModal } from './components/FreeSlotFinderModal';
import { SettingsModal } from './components/SettingsModal';
import { PrintScheduleView } from './components/PrintScheduleView';
import { timeToMinutes } from './utils/timeUtils';
import { CheckCircle2, AlertTriangle, Sparkles, Clock, Search, Plus, Calendar, ShieldCheck, Cloud, CloudCheck, Loader2 } from 'lucide-react';

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>(loadAppointments);
  const [students, setStudents] = useState<Student[]>(loadStudents);
  const [settings, setSettings] = useState<TeacherSettings>(loadSettings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('weekly');

  // Cloud sync states
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudSaveSuccess, setCloudSaveSuccess] = useState(false);
  const [lastCloudSavedAt, setLastCloudSavedAt] = useState<string | null>(getLastCloudSyncTime);

  // Dark mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teacher_scheduler_theme_data');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('teacher_scheduler_theme_data', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('teacher_scheduler_theme_data', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Modals state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Partial<Appointment> | null>(null);
  const [isFreeSlotFinderOpen, setIsFreeSlotFinderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Sync to local storage
  const handleSaveAppointment = (appointment: Appointment) => {
    const exists = appointments.some((a) => a.id === appointment.id);
    let updated: Appointment[];
    if (exists) {
      updated = appointments.map((a) => (a.id === appointment.id ? appointment : a));
    } else {
      updated = [...appointments, appointment];
    }
    setAppointments(updated);
    saveAppointments(updated);
  };

  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter((a) => a.id !== id);
    setAppointments(updated);
    saveAppointments(updated);
  };

  const handleSaveStudent = (student: Student) => {
    const exists = students.some((s) => s.id === student.id);
    let updated: Student[];
    if (exists) {
      updated = students.map((s) => (s.id === student.id ? student : s));
    } else {
      updated = [...students, student];
    }
    setStudents(updated);
    saveStudents(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const updatedStudents = students.filter((s) => s.id !== id);
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    // Also remove any appointments belonging to this student
    const updatedAppointments = appointments.filter((a) => a.studentId !== id);
    setAppointments(updatedAppointments);
    saveAppointments(updatedAppointments);
  };

  const handleSaveSettings = (newSettings: TeacherSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleResetData = () => {
    const defaults = resetAllData();
    setAppointments(defaults.appointments);
    setStudents(defaults.students);
    setSettings(defaults.settings);
  };

  const handleImportData = (data: {
    appointments: Appointment[];
    students: Student[];
    settings: TeacherSettings;
  }) => {
    setAppointments(data.appointments);
    setStudents(data.students);
    setSettings(data.settings);
    saveAppointments(data.appointments);
    saveStudents(data.students);
    saveSettings(data.settings);
  };

  // Cloud Save Action
  const handleCloudSave = async () => {
    setIsSavingCloud(true);
    setCloudSaveSuccess(false);
    try {
      const result = await saveToCloudServer({
        appointments,
        students,
        settings,
      });
      if (result.success && result.lastSavedAt) {
        setLastCloudSavedAt(result.lastSavedAt);
        setCloudSaveSuccess(true);
        setTimeout(() => setCloudSaveSuccess(false), 3500);
      }
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Open modal handlers
  const handleOpenAddAppointment = (slot?: {
    dayOfWeek: DayId;
    startTime: string;
    duration?: number;
    studentId?: string;
    studentName?: string;
  }) => {
    if (slot) {
      setEditingAppointment({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        durationMinutes: slot.duration || settings.defaultDurationMinutes || 60,
        studentId: slot.studentId,
        studentName: slot.studentName,
      });
    } else {
      setEditingAppointment(null);
    }
    setIsAppointmentModalOpen(true);
  };

  const handleSelectAppointment = (app: Appointment) => {
    setEditingAppointment(app);
    setIsAppointmentModalOpen(true);
  };

  const handleSelectSlotFromFinder = (slot: AvailableSlot) => {
    setEditingAppointment({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
    });
    setIsAppointmentModalOpen(true);
  };

  const handleScheduleForStudent = (student: Student) => {
    setEditingAppointment({
      studentId: student.id,
      studentName: student.name,
      subject: student.subject,
      grade: student.grade,
      fee: student.fee,
      color: student.color,
    });
    setIsAppointmentModalOpen(true);
  };

  // Check if any collisions currently exist in the whole timetable
  const checkGlobalConflicts = () => {
    let conflictCount = 0;
    const active = appointments.filter((a) => a.status !== 'cancelled');
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a1 = active[i];
        const a2 = active[j];
        if (a1.dayOfWeek === a2.dayOfWeek) {
          const s1 = timeToMinutes(a1.startTime);
          const e1 = timeToMinutes(a1.endTime);
          const s2 = timeToMinutes(a2.startTime);
          const e2 = timeToMinutes(a2.endTime);
          if (s1 < e2 && e1 > s2) {
            conflictCount++;
          }
        }
      }
    }
    return conflictCount;
  };

  const globalConflictCount = checkGlobalConflicts();
  const activeAppointmentsCount = appointments.filter((a) => a.status !== 'cancelled').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFreeSlotFinder={() => setIsFreeSlotFinderOpen(true)}
        onOpenAddAppointment={() => handleOpenAddAppointment()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        onCloudSave={handleCloudSave}
        isSavingCloud={isSavingCloud}
        cloudSaveSuccess={cloudSaveSuccess}
        lastCloudSavedAt={lastCloudSavedAt}
        isDark={isDark}
        toggleTheme={toggleTheme}
        totalAppointmentsCount={activeAppointmentsCount}
        totalStudentsCount={students.length}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome & Conflict Safety Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                مرحباً بك، {settings.teacherName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                مادة {settings.subject}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              الجدول الأفقي يعرض المواعيد المتسلسلة بوضوح. استخدم زر الحفظ السحابي لحفظ كافة بياناتك على السيرفر بأمان.
            </p>
          </div>

          {/* Quick Metrics & Cloud Status */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {globalConflictCount > 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>يوجد {globalConflictCount} تعارض!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>الجدول سليم 100% بدون أي تعارض</span>
              </div>
            )}

            {/* Cloud Save Action */}
            <button
              type="button"
              onClick={handleCloudSave}
              disabled={isSavingCloud}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all shadow-xs flex items-center gap-1.5 ${
                cloudSaveSuccess
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700'
              }`}
            >
              {isSavingCloud ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : cloudSaveSuccess ? (
                <CloudCheck className="w-3.5 h-3.5 text-white" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
              <span>
                {isSavingCloud ? 'جارِ الحفظ...' : cloudSaveSuccess ? 'تم الحفظ سحابياً!' : 'حفظ سحابي'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsFreeSlotFinderOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>بحث عن موعد شاغر</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'weekly' && (
          <WeeklySchedule
            appointments={appointments}
            settings={settings}
            onSelectAppointment={handleSelectAppointment}
            onAddAtSlot={(dayOfWeek, startTime) => handleOpenAddAppointment({ dayOfWeek, startTime })}
            onOpenFreeSlotFinder={() => setIsFreeSlotFinderOpen(true)}
          />
        )}

        {activeTab === 'daily' && (
          <DailySchedule
            appointments={appointments}
            students={students}
            settings={settings}
            onSelectAppointment={handleSelectAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onAddAppointmentForDay={(dayOfWeek) => handleOpenAddAppointment({ dayOfWeek, startTime: '16:00' })}
            onUpdateStatus={(id, status) => {
              const updated = appointments.map((a) => (a.id === id ? { ...a, status } : a));
              setAppointments(updated);
              saveAppointments(updated);
            }}
          />
        )}

        {activeTab === 'list' && (
          <AppointmentsList
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onOpenAddAppointment={() => handleOpenAddAppointment()}
          />
        )}

        {activeTab === 'students' && (
          <StudentManager
            students={students}
            appointments={appointments}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onScheduleForStudent={handleScheduleForStudent}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-slate-900 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>جدولي الذكي · مساعد المعلم لتنظيم المواعيد ومنع التعارض الزمني</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCloudSave}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>حفظ سحابي</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              إعدادات ساعات العمل
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsPrintOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              طباعة الجدول
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleResetData}
              className="hover:text-rose-600 transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialAppointment={editingAppointment}
        existingAppointments={appointments}
        students={students}
        onQuickAddStudent={handleSaveStudent}
        settings={settings}
      />

      <FreeSlotFinderModal
        isOpen={isFreeSlotFinderOpen}
        onClose={() => setIsFreeSlotFinderOpen(false)}
        existingAppointments={appointments}
        settings={settings}
        onSelectSlot={handleSelectSlotFromFinder}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetData={handleResetData}
        appointments={appointments}
        students={students}
        onImportData={handleImportData}
      />

      <PrintScheduleView
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        appointments={appointments}
        settings={settings}
      />
    </div>
  );
}
