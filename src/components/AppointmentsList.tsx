import React, { useState } from 'react';
import { Appointment, DayId } from '../types';
import { DAYS_LIST, formatDurationArabic, formatTimeArabic, getDayName, timeToMinutes } from '../utils/timeUtils';
import { Search, Trash2, Edit3, Calendar } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface AppointmentsListProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onOpenAddAppointment: () => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  appointments,
  onSelectAppointment,
  onDeleteAppointment,
  onOpenAddAppointment,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const filtered = appointments.filter((app) => {
    if (selectedDay !== 'all' && app.dayOfWeek.toString() !== selectedDay) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        app.studentName.toLowerCase().includes(q) ||
        app.subject.toLowerCase().includes(q) ||
        app.grade.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort by dayOfWeek then by startTime
  const sorted = [...filtered].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      const getDayOrder = (d: number) => (d === 6 ? 0 : d + 1);
      return getDayOrder(a.dayOfWeek) - getDayOrder(b.dayOfWeek);
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في المواعيد باسم الطالب أو المادة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Day Filter */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">كل الأيام</option>
            {DAYS_LIST.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenAddAppointment}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
        >
          + حصة جديدة
        </button>
      </div>

      {/* Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">لا توجد مواعيد مطابقة لخيارات البحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">اليوم</th>
                  <th className="py-3 px-4">التوقيت والمدة</th>
                  <th className="py-3 px-4">اسم الطالب والمادة</th>
                  <th className="py-3 px-4">قيمة الحصة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sorted.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Day */}
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {getDayName(app.dayOfWeek)}
                    </td>

                    {/* Timing */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {formatTimeArabic(app.startTime)} - {formatTimeArabic(app.endTime)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDurationArabic(app.durationMinutes)}
                      </div>
                    </td>

                    {/* Student & Subject */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: app.color }}
                        />
                        <span>{app.studentName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {app.subject} {app.grade ? `· ${app.grade}` : ''}
                      </div>
                    </td>

                    {/* Fee */}
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {app.fee ? `${app.fee} ج.م` : '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectAppointment(app)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="تعديل الموعد"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppointmentToDelete(app)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(appointmentToDelete)}
        title="حذف موعد الحصة"
        message={
          appointmentToDelete
            ? `هل أنت متأكد من رغبتك في حذف حصة "${appointmentToDelete.studentName}" يوم ${getDayName(
                appointmentToDelete.dayOfWeek
              )} (${formatTimeArabic(appointmentToDelete.startTime)})؟`
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
