import React, { useState } from 'react';
import { Appointment, DayId, TeacherSettings } from '../types';
import { DAYS_LIST, formatTimeArabic, formatTimeRangeArabic, getHourRange, timeToMinutes } from '../utils/timeUtils';
import { Search, Plus, AlertCircle, Clock, Sparkles, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface WeeklyScheduleProps {
  appointments: Appointment[];
  settings: TeacherSettings;
  onSelectAppointment: (appointment: Appointment) => void;
  onAddAtSlot: (dayOfWeek: DayId, startTime: string) => void;
  onOpenFreeSlotFinder: () => void;
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  appointments,
  settings,
  onSelectAppointment,
  onAddAtSlot,
  onOpenFreeSlotFinder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  // Hour column width in pixels (Horizontal expansion as requested!)
  // 170px gives a 45-min class ~128px width, and a 60-min class ~170px width!
  const [hourWidth, setHourWidth] = useState<number>(190);

  const { dayStartHour = 12, dayEndHour = 22, workingDays = [6, 0, 1, 2, 3, 4] } = settings;
  const hours = getHourRange(dayStartHour, dayEndHour);
  const totalDayMinutes = (dayEndHour - dayStartHour) * 60;
  const numHours = hours.length - 1 || 10;
  const totalTrackWidthPx = numHours * hourWidth;

  // Filtered appointments
  const filteredAppointments = appointments.filter((app) => {
    if (app.status === 'cancelled') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = app.studentName.toLowerCase().includes(q);
      const matchSub = app.subject.toLowerCase().includes(q);
      const matchGrade = app.grade.toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchGrade) return false;
    }
    return true;
  });

  // Calculate day-specific appointments sorted by time
  const getAppointmentsForDay = (dayId: DayId) => {
    return filteredAppointments
      .filter((app) => app.dayOfWeek === dayId)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  // Check if an appointment has collision with another on the schedule
  const hasScheduleCollision = (app: Appointment) => {
    const aStart = timeToMinutes(app.startTime);
    const aEnd = timeToMinutes(app.endTime);
    return appointments.some((other) => {
      if (other.id === app.id || other.status === 'cancelled') return false;
      if (other.dayOfWeek !== app.dayOfWeek) return false;
      const oStart = timeToMinutes(other.startTime);
      const oEnd = timeToMinutes(other.endTime);
      return aStart < oEnd && aEnd > oStart;
    });
  };

  // Check if two sessions hand off directly to each other ("تسليم مباشر")
  const isDirectHandoff = (prevApp: Appointment, nextApp: Appointment) => {
    return timeToMinutes(prevApp.endTime) === timeToMinutes(nextApp.startTime);
  };

  // Compute total occupied minutes across the week
  const totalOccupiedMinutes = filteredAppointments.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Width Expansion Controls, & Quick Summary */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم الطالب أو المادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Horizontal Width / Zoom Controller ("التحكم في عرض المستطيل أفقياً") */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          <span className="text-slate-500 dark:text-slate-400 px-2 font-medium">
            عرض المستطيل:
          </span>
          <button
            type="button"
            onClick={() => setHourWidth(140)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              hourWidth === 140
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            متوسط
          </button>
          <button
            type="button"
            onClick={() => setHourWidth(190)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              hourWidth === 190
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            عريض (افتراضي)
          </button>
          <button
            type="button"
            onClick={() => setHourWidth(250)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              hourWidth === 250
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            عريض جداً
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Direct Fine-tuning Zoom Buttons */}
          <button
            type="button"
            onClick={() => setHourWidth((prev) => Math.max(120, prev - 25))}
            title="تقليل العرض الأفقي"
            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setHourWidth((prev) => Math.min(360, prev + 25))}
            title="زيادة العرض الأفقي للمستطيل"
            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-indigo-500 inline-block shadow-2xs" />
            <span>محجوز</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
              تسليم مباشر
            </span>
            <span>مواعيد متصلة</span>
          </div>
        </div>

        {/* Quick CTA */}
        <button
          type="button"
          onClick={onOpenFreeSlotFinder}
          className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>البحث عن موعد شاغر</span>
        </button>
      </div>

      {/* Horizontal Timetable Schedule Board */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Horizontal Container with smooth scroll */}
        <div className="overflow-x-auto scrollbar-thin">
          <div style={{ width: `${totalTrackWidthPx + 130}px`, minWidth: '100%' }}>
            {/* Header Row: Days column label + Horizontal Time Axis */}
            <div className="grid grid-cols-[130px_1fr] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-20 select-none">
              {/* Days Column Header */}
              <div className="py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-100/80 dark:bg-slate-800/80">
                <span>اليوم</span>
                <span className="text-[10px] text-slate-400 font-normal">المواعيد</span>
              </div>

              {/* Time Axis Ruler */}
              <div className="relative h-10 flex">
                {hours.map((hour) => {
                  const hourTimeStr = `${hour.toString().padStart(2, '0')}:00`;
                  return (
                    <div
                      key={hour}
                      style={{ width: `${hourWidth}px`, minWidth: `${hourWidth}px` }}
                      className="border-l border-slate-200/80 dark:border-slate-700/60 px-2 py-1.5 flex flex-col justify-between text-right shrink-0"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatTimeArabic(hourTimeStr)}
                      </span>
                      <div className="flex items-center justify-between w-full h-1">
                        <div className="w-px h-1.5 bg-slate-300 dark:bg-slate-600" />
                        <div className="w-px h-1 bg-slate-200 dark:border-slate-700" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Days Rows (Slim height, wide horizontal tracks) */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {DAYS_LIST.map((day) => {
                const isWorkingDay = workingDays.includes(day.id);
                const dayApps = getAppointmentsForDay(day.id);
                const dayOccupiedMins = dayApps.reduce((acc, curr) => acc + curr.durationMinutes, 0);

                return (
                  <div
                    key={day.id}
                    className={`grid grid-cols-[130px_1fr] min-h-[48px] transition-colors ${
                      !isWorkingDay
                        ? 'bg-slate-50/40 dark:bg-slate-950/40 opacity-70'
                        : 'hover:bg-slate-50/20 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    {/* Day Info Column */}
                    <div className="py-1.5 px-3 border-l border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/40">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {day.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {dayApps.length > 0 ? `${dayApps.length}ح` : 'شاغر'}
                      </span>
                    </div>

                    {/* Horizontal Time Track - Wide horizontally, slim vertically */}
                    <div
                      style={{ width: `${totalTrackWidthPx}px` }}
                      className="relative h-[48px] flex items-center p-1 shrink-0"
                    >
                      {/* Background Hour Grid Lines & Click-to-Add Targets */}
                      <div className="absolute inset-0 flex pointer-events-auto">
                        {hours.map((hour) => {
                          const hourTimeStr = `${hour.toString().padStart(2, '0')}:00`;
                          return (
                            <div
                              key={hour}
                              style={{ width: `${hourWidth}px`, minWidth: `${hourWidth}px` }}
                              onClick={() => onAddAtSlot(day.id, hourTimeStr)}
                              className="border-l border-slate-100 dark:border-slate-800/50 hover:bg-indigo-50/25 dark:hover:bg-indigo-950/20 cursor-pointer group transition-colors relative shrink-0"
                              title={`اضغط لحجز موعد يوم ${day.name} الساعة ${formatTimeArabic(hourTimeStr)}`}
                            >
                              <span className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-white/95 dark:bg-slate-800/95 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none transition-opacity z-20">
                                + {formatTimeArabic(hourTimeStr)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Wide Horizontal Rectangles - Proportional to duration, SAME FONT as Days */}
                      {dayApps.map((app, index) => {
                        const appStartMins = timeToMinutes(app.startTime);
                        const viewStartMins = dayStartHour * 60;
                        const offsetMins = Math.max(0, appStartMins - viewStartMins);

                        // Horizontal position in pixels based on hourWidth
                        // Exact width strictly matching duration:
                        // 45 mins = (45/60)*hourWidth (noticeably smaller than 60 mins!)
                        // 60 mins = hourWidth
                        // 90 mins = 1.5 * hourWidth
                        const rightPx = (offsetMins / 60) * hourWidth;
                        const widthPx = (app.durationMinutes / 60) * hourWidth;

                        const hasConflict = hasScheduleCollision(app);
                        const nextApp = dayApps[index + 1];
                        const handsOffToNext = nextApp && isDirectHandoff(app, nextApp);

                        return (
                          <div
                            key={app.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAppointment(app);
                            }}
                            style={{
                              right: `${rightPx}px`,
                              width: `${widthPx}px`,
                              backgroundColor: hasConflict ? '#FEF2F2' : app.color,
                            }}
                            className={`absolute top-1 bottom-1 z-10 rounded-lg cursor-pointer transition-all shadow-xs hover:shadow-md hover:scale-[1.01] hover:z-30 overflow-hidden flex flex-col justify-center px-2.5 py-0.5 text-right ${
                              hasConflict
                                ? 'border-2 border-rose-500 ring-2 ring-rose-500/40 animate-pulse text-rose-900 font-bold'
                                : 'text-white border border-white/25'
                            } ${handsOffToNext ? 'rounded-l-none' : ''}`}
                            title={`${app.studentName} · ${formatTimeRangeArabic(app.startTime, app.endTime)} (${app.durationMinutes} دقيقة)`}
                          >
                            {/* Student Name - SAME CAIRO FONT AS DAYS, NEVER TRUNCATED BY TIME */}
                            <div className="flex items-center gap-1 min-w-0 w-full">
                              {hasConflict && (
                                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                              )}
                              <span className="font-bold text-xs sm:text-[13px] truncate text-white leading-tight">
                                {app.studentName}
                              </span>
                            </div>

                            {/* Time - SAME CAIRO FONT AS DAYS */}
                            <div className="text-[11px] font-semibold text-white/90 truncate leading-tight mt-0.5 whitespace-nowrap">
                              {formatTimeArabic(app.startTime)} - {formatTimeArabic(app.endTime)}
                            </div>

                            {/* Direct Hand-off Border Indicator ("تسليم مباشر") */}
                            {handsOffToNext && (
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1 bg-white/70 pointer-events-none"
                                title="تسليم مباشر للحصة التالية"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Time Axis Indicator Strip */}
        <div className="bg-slate-50 dark:bg-slate-800/40 py-2 px-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              إجمالي ساعات التدريس المشغولة:{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {(totalOccupiedMinutes / 60).toFixed(1)} ساعة
              </strong>
            </span>
          </div>

          <div className="text-slate-400 text-[11px]">
            يمكنك سحب شريط التمرير أو استخدام أزرار (عرض المستطيل) في الأعلى لضبط العرض الأفقي كما يناسبك.
          </div>
        </div>
      </div>
    </div>
  );
};
