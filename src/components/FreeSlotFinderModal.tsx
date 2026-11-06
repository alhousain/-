import React, { useState, useId } from 'react';
import { X, Search, Sparkles, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Appointment, AvailableSlot, DayId, TeacherSettings } from '../types';
import { DAYS_LIST, formatDurationArabic, formatTimeArabic } from '../utils/timeUtils';
import { findAvailableSlots } from '../utils/conflictChecker';

interface FreeSlotFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAppointments: Appointment[];
  settings: TeacherSettings;
  onSelectSlot: (slot: AvailableSlot) => void;
}

export const FreeSlotFinderModal: React.FC<FreeSlotFinderModalProps> = ({
  isOpen,
  onClose,
  existingAppointments,
  settings,
  onSelectSlot,
}) => {
  const [duration, setDuration] = useState<number>(settings.defaultDurationMinutes || 60);
  const [selectedDays, setSelectedDays] = useState<DayId[]>(settings.workingDays || [6, 0, 1, 2, 3, 4]);
  const [timePreference, setTimePreference] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const titleId = useId();

  if (!isOpen) return null;

  // Compute all available slots in real time
  const availableSlots = findAvailableSlots({
    durationMinutes: duration,
    days: selectedDays,
    existingAppointments,
    settings,
    timePreference,
    stepMinutes: 30, // scan every 30 minutes for clean, friendly slots
  });

  const toggleDay = (dayId: DayId) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const selectAllDays = () => {
    setSelectedDays(settings.workingDays);
  };

  // Group slots by day
  const slotsByDay: Record<number, AvailableSlot[]> = {};
  for (const slot of availableSlots) {
    if (!slotsByDay[slot.dayOfWeek]) {
      slotsByDay[slot.dayOfWeek] = [];
    }
    slotsByDay[slot.dayOfWeek].push(slot);
  }

  const durationOptions = [30, 45, 60, 90, 120];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden transition-all text-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-bold text-slate-900 dark:text-white">
                البحث الذكي عن موعد شاغر لطالب جديد
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ابحث عن أوقات خالية ومناسبة ومضمونة بنسبة 100% بدون أي تعارض زمني
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-6 space-y-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          {/* Duration Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                مدة الحصة المطلوبة للطالب:
              </label>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {formatDurationArabic(duration)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDuration(dur)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    duration === dur
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {dur} دقيقة
                </button>
              ))}
            </div>
          </div>

          {/* Days Filter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                الأيام المفضلة:
              </label>
              <button
                type="button"
                onClick={selectAllDays}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                تحديد كل أيام العمل
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_LIST.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {day.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              الفترة المفضلة خلال اليوم:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'أي وقت (الكل)' },
                { id: 'morning', label: 'صباحاً (قبل 12 ظهراً)' },
                { id: 'afternoon', label: 'بعد الظهر (12 - 5 مساءً)' },
                { id: 'evening', label: 'مساءً (بعد 5 مساءً)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTimePreference(item.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    timePreference === item.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              تم العثور على{' '}
              <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
                {availableSlots.length}
              </strong>{' '}
              موعد شاغر متاح
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تم مراعاة فاصل الراحة ({settings.bufferMinutes} دقيقة)
            </span>
          </div>

          {availableSlots.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                لا توجد مواعيد شاغرة بهذه المواصفات
              </p>
              <p className="text-xs text-slate-500">
                جرب تقليل مدة الحصة أو اختيار أيام إضافية أو توسيع ساعات العمل في الإعدادات.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDays.map((dayId) => {
                const daySlots = slotsByDay[dayId] || [];
                if (daySlots.length === 0) return null;
                const dayName = DAYS_LIST.find((d) => d.id === dayId)?.name;

                return (
                  <div key={dayId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                        {dayName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({daySlots.length} موعد شاغر)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {daySlots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="group p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col justify-between gap-2 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                {formatTimeArabic(slot.startTime)} - {formatTimeArabic(slot.endTime)}
                              </span>
                              {slot.isIdeal && (
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>مثالي</span>
                                </span>
                              )}
                            </div>

                            {slot.adjacentAppointmentBefore && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                بعد حصة: {slot.adjacentAppointmentBefore.studentName}
                              </p>
                            )}
                            {slot.adjacentAppointmentAfter && !slot.adjacentAppointmentBefore && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                قبل حصة: {slot.adjacentAppointmentAfter.studentName}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectSlot(slot);
                              onClose();
                            }}
                            className="w-full mt-1 py-1.5 px-2.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/50 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <span>حجز هذا الموعد لطالب</span>
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
