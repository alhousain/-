import React, { useState } from 'react';
import { Appointment, DayId, Student, TeacherSettings } from '../types';
import { DAYS_LIST, formatDurationArabic, formatTimeArabic, formatTimeRangeArabic, getDayName, timeToMinutes } from '../utils/timeUtils';
import { ChevronRight, ChevronLeft, Clock, MapPin, Phone, MessageSquare, Plus, AlertCircle, CheckCircle2, User, Users, Trash2, Edit3, X } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface DailyScheduleProps {
  appointments: Appointment[];
  students: Student[];
  settings: TeacherSettings;
  onSelectAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onAddAppointmentForDay: (dayOfWeek: DayId) => void;
  onUpdateStatus: (appointmentId: string, status: Appointment['status']) => void;
}

export const DailySchedule: React.FC<DailyScheduleProps> = ({
  appointments,
  students,
  settings,
  onSelectAppointment,
  onDeleteAppointment,
  onAddAppointmentForDay,
  onUpdateStatus,
}) => {
  // Default to today or Saturday (6)
  const [selectedDay, setSelectedDay] = useState<DayId>(() => {
    const todayJs = new Date().getDay(); // 0 is Sunday, 6 is Saturday
    return todayJs as DayId;
  });

  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const dayApps = appointments
    .filter((app) => app.dayOfWeek === selectedDay && app.status !== 'cancelled')
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const totalTeachingMinutes = dayApps.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  const prevDay = () => {
    setSelectedDay((prev) => (prev === 0 ? 6 : ((prev - 1) as DayId)));
  };

  const nextDay = () => {
    setSelectedDay((prev) => (prev === 6 ? 0 : ((prev + 1) as DayId)));
  };

  const sendWhatsAppReminder = (app: Appointment) => {
    const student = students.find((s) => s.id === app.studentId);
    const phone = student?.phone || student?.parentPhone || '';
    if (!phone) {
      setToastMessage(`لا يوجد رقم هاتف مسجل للطالب "${app.studentName}". يمكنك تعديل بياناته لإضافة رقم.`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `السلام عليكم ورحمة الله، تذكير بموعد حصتنا (${app.subject}) اليوم ${getDayName(app.dayOfWeek)} الساعة ${formatTimeArabic(app.startTime)} بالتوفيق دائماً إن شاء الله.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-amber-600 hover:text-amber-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Day Selector Header Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevDay}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="اليوم السابق"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[130px]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              يوم {getDayName(selectedDay)}
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {dayApps.length} {dayApps.length === 1 ? 'حصة مجدولة' : 'حصص مجدولة'}
            </span>
          </div>

          <button
            type="button"
            onClick={nextDay}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="اليوم التالي"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Days Pill Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {DAYS_LIST.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDay(d.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                selectedDay === d.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onAddAppointmentForDay(selectedDay)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة حصة اليوم</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">إجمالي الحصص</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {dayApps.length}
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">ساعات التدريس</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {(totalTeachingMinutes / 60).toFixed(1)} ساعة
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">الحصص المؤكدة</span>
          <span className="text-lg font-bold text-emerald-600 font-mono tabular-nums">
            {dayApps.filter((a) => a.status === 'confirmed').length}
          </span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">الفاصل الموصى به</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {settings.bufferMinutes} دقيقة
          </span>
        </div>
      </div>

      {/* Timeline of Appointments */}
      {dayApps.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            لا توجد أي حصص مجدولة ليوم {getDayName(selectedDay)}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            هذا اليوم خالٍ تماماً من المواعيد. يمكنك إضافة حصص جديدة أو تركه كيوم راحة.
          </p>
          <button
            type="button"
            onClick={() => onAddAppointmentForDay(selectedDay)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>جدولة أول حصة في هذا اليوم</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dayApps.map((app, index) => {
            const student = students.find((s) => s.id === app.studentId);
            const nextApp = dayApps[index + 1];
            let gapMinutes = 0;
            if (nextApp) {
              gapMinutes = timeToMinutes(nextApp.startTime) - timeToMinutes(app.endTime);
            }

            return (
              <React.Fragment key={app.id}>
                <div
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  style={{ borderRight: `5px solid ${app.color}` }}
                >
                  {/* Time Badge and Duration */}
                  <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 min-w-[140px] shrink-0">
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatTimeArabic(app.startTime)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold tabular-nums">
                      إلى {formatTimeArabic(app.endTime)} ({formatDurationArabic(app.durationMinutes)})
                    </span>
                  </div>

                  {/* Student & Session Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {app.studentName}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>{app.subject}</span>
                      {app.grade && <span>· {app.grade}</span>}
                    </div>

                    {app.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg mt-2">
                        {app.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions & Contact */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => sendWhatsAppReminder(app)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      title="إرسال تذكير عبر واتساب"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">واتساب</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onSelectAppointment(app)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setAppointmentToDelete(app)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="حذف الحصة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Free Gap Indicator between classes */}
                {nextApp && (
                  <div className="flex items-center justify-center py-1">
                    <div className="px-3 py-1 text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800/60 rounded-full border border-dashed border-slate-300 dark:border-slate-700">
                      فاصل راحة / تنقل: {gapMinutes} دقيقة حتى الحصة القادمة
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(appointmentToDelete)}
        title="حذف موعد الحصة"
        message={
          appointmentToDelete
            ? `هل أنت متأكد من حذف حصة "${appointmentToDelete.studentName}" (${formatTimeArabic(
                appointmentToDelete.startTime
              )}) من جدول اليوم؟`
            : ''
        }
        confirmText="نعم، حذف الحصة"
        cancelText="تراجع"
        isDestructive={true}
        onConfirm={() => {
          if (appointmentToDelete) {
            onDeleteAppointment(appointmentToDelete.id);
            setAppointmentToDelete(null);
          }
        }}
        onCancel={() => setAppointmentToDelete(null)}
      />
    </div>
  );
};
