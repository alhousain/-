import React from 'react';
import { Calendar, CalendarDays, List, Users, Search, Plus, Settings, Sun, Moon, Printer, Cloud, CloudCheck, Loader2 } from 'lucide-react';

export type ActiveTab = 'weekly' | 'daily' | 'list' | 'students';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenFreeSlotFinder: () => void;
  onOpenAddAppointment: () => void;
  onOpenSettings: () => void;
  onOpenPrint: () => void;
  onCloudSave: () => void;
  isSavingCloud: boolean;
  cloudSaveSuccess: boolean;
  lastCloudSavedAt: string | null;
  isDark: boolean;
  toggleTheme: () => void;
  totalAppointmentsCount: number;
  totalStudentsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenFreeSlotFinder,
  onOpenAddAppointment,
  onOpenSettings,
  onOpenPrint,
  onCloudSave,
  isSavingCloud,
  cloudSaveSuccess,
  lastCloudSavedAt,
  isDark,
  toggleTheme,
  totalAppointmentsCount,
  totalStudentsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs font-bold text-lg">
            ج
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              جدولي الذكي
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-1">
              مساعد المعلم لإدارة المواعيد ومنع التعارض
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'weekly'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>الجدول الأفقي</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'daily'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>جدول اليوم</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'list'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <List className="w-4 h-4" />
            <span>قائمة الحصص</span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-mono tabular-nums">
              {totalAppointmentsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'students'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الطلاب</span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-mono tabular-nums">
              {totalStudentsCount}
            </span>
          </button>
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cloud Save Button ("زر الحفظ السحابي للجدول كله") */}
          <button
            type="button"
            onClick={onCloudSave}
            disabled={isSavingCloud}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border transition-all shadow-xs ${
              cloudSaveSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-800'
            }`}
            title={lastCloudSavedAt ? `آخر حفظ سحابي: ${new Date(lastCloudSavedAt).toLocaleTimeString('ar-EG')}` : 'حفظ الجدول سحابياً على الخادم'}
          >
            {isSavingCloud ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : cloudSaveSuccess ? (
              <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            )}
            <span className="hidden sm:inline">
              {isSavingCloud ? 'جارِ الحفظ...' : cloudSaveSuccess ? 'تم الحفظ سحابياً' : 'حفظ سحابي'}
            </span>
          </button>

          {/* Add Appointment Button */}
          <button
            type="button"
            onClick={onOpenAddAppointment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>حصة جديدة</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={onOpenPrint}
            title="طباعة الجدول"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="إعدادات مواعيد العمل والمعلم"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
