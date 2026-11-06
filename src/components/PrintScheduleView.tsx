import React, { useId } from 'react';
import { Appointment, TeacherSettings } from '../types';
import { DAYS_LIST, formatTimeArabic, formatTimeRangeArabic, timeToMinutes } from '../utils/timeUtils';
import { Printer, X } from 'lucide-react';

interface PrintScheduleViewProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  settings: TeacherSettings;
}

export const PrintScheduleView: React.FC<PrintScheduleViewProps> = ({
  isOpen,
  onClose,
  appointments,
  settings,
}) => {
  const titleId = useId();
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden transition-all text-right"
      >
        {/* Modal Controls - hidden when printing */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-base font-bold text-slate-900 dark:text-white">
              معاينة الجدول للطباعة أو الحفظ كـ PDF
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الجدول الآن</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-8 bg-white text-slate-900 print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                الجدول الأسبوعي لمواعيد الدروس والحصص
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {settings.teacherName} · مادة {settings.subject}
              </p>
            </div>
            <div className="text-left font-mono text-xs text-slate-500">
              <div>تاريخ التحديث: {new Date().toLocaleDateString('ar-EG')}</div>
              <div>إجمالي الحصص: {appointments.filter((a) => a.status !== 'cancelled').length}</div>
            </div>
          </div>

          {/* Grid Table */}
          <div className="grid grid-cols-7 border-t border-r border-slate-300">
            {DAYS_LIST.map((day) => {
              const dayApps = appointments
                .filter((a) => a.dayOfWeek === day.id && a.status !== 'cancelled')
                .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

              return (
                <div key={day.id} className="border-l border-b border-slate-300 min-h-[380px] flex flex-col">
                  {/* Day header */}
                  <div className="bg-slate-100 p-2.5 text-center font-bold text-xs border-b border-slate-300">
                    <div>{day.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {dayApps.length} {dayApps.length === 1 ? 'حصة' : 'حصص'}
                    </div>
                  </div>

                  {/* Day contents */}
                  <div className="p-1.5 space-y-2 flex-1">
                    {dayApps.length === 0 ? (
                      <div className="text-[11px] text-slate-300 text-center py-6">
                        - شاغر -
                      </div>
                    ) : (
                      dayApps.map((app) => (
                        <div
                          key={app.id}
                          className="p-2 rounded border border-slate-300 bg-slate-50 text-[11px] space-y-0.5"
                          style={{ borderRight: `3px solid ${app.color}` }}
                        >
                          <div className="font-bold text-slate-900">
                            {app.studentName}
                          </div>
                          <div className="text-[10px] text-slate-700 font-semibold tabular-nums">
                            {formatTimeRangeArabic(app.startTime, app.endTime)}
                          </div>
                          {app.subject && (
                            <div className="text-[10px] text-slate-500 truncate">
                              {app.subject}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Notes */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
            <span>تم تنظيم الجدول بواسطة نظام جدولي الذكي لمنع تعارض المواعيد.</span>
            <span>يرجى الالتزام بالمواعيد المحددة والاعتذار مسبقاً قبل الموعد بـ 24 ساعة.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
