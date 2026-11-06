import { DayId, DayInfo } from '../types';

export const DAYS_LIST: DayInfo[] = [
  { id: 6, name: 'السبت', shortName: 'سبت' },
  { id: 0, name: 'الأحد', shortName: 'أحد' },
  { id: 1, name: 'الإثنين', shortName: 'إثنين' },
  { id: 2, name: 'الثلاثاء', shortName: 'ثلاثاء' },
  { id: 3, name: 'الأربعاء', shortName: 'أربعاء' },
  { id: 4, name: 'الخميس', shortName: 'خميس' },
  { id: 5, name: 'الجمعة', shortName: 'جمعة', isWeekend: true },
];

export function getDayName(dayId: DayId): string {
  const day = DAYS_LIST.find((d) => d.id === dayId);
  return day ? day.name : '';
}

/**
 * Converts "HH:MM" (24h) to total minutes from 00:00
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Converts minutes from 00:00 to "HH:MM" (24h)
 */
export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats 24h "HH:MM" to Arabic friendly 12h format e.g. "04:30 م"
 */
export function formatTimeArabic(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;

  const period = h >= 12 ? 'م' : 'ص';
  if (h === 0) {
    h = 12;
  } else if (h > 12) {
    h -= 12;
  }

  return `${h}:${m} ${period}`;
}

/**
 * Formats time range e.g. "04:00 م - 05:30 م"
 */
export function formatTimeRangeArabic(startTime: string, endTime: string): string {
  return `${formatTimeArabic(startTime)} - ${formatTimeArabic(endTime)}`;
}

/**
 * Adds minutes to "HH:MM" and returns new "HH:MM"
 */
export function addMinutes(timeStr: string, minutesToAdd: number): string {
  const currentMinutes = timeToMinutes(timeStr);
  return minutesToTime(currentMinutes + minutesToAdd);
}

/**
 * Calculates duration between start and end in minutes
 */
export function getDurationMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return Math.max(0, end - start);
}

/**
 * Determines period of the day
 */
export function getTimePeriod(timeStr: string): 'morning' | 'afternoon' | 'evening' {
  const minutes = timeToMinutes(timeStr);
  if (minutes < 12 * 60) return 'morning'; // before 12:00 PM
  if (minutes < 17 * 60) return 'afternoon'; // 12:00 PM to 05:00 PM
  return 'evening'; // 05:00 PM onwards
}

/**
 * Generates an array of hours between start and end
 */
export function getHourRange(startHour: number, endHour: number): number[] {
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }
  return hours;
}

/**
 * Format minutes duration to readable Arabic e.g. "ساعة ونصف (90 دقيقة)"
 */
export function formatDurationArabic(minutes: number): string {
  if (minutes === 30) return 'نصف ساعة (30 دقيقة)';
  if (minutes === 45) return '45 دقيقة';
  if (minutes === 60) return 'ساعة واحدة (60 دقيقة)';
  if (minutes === 90) return 'ساعة ونصف (90 دقيقة)';
  if (minutes === 120) return 'ساعتان (120 دقيقة)';
  if (minutes === 150) return 'ساعتان ونصف (150 دقيقة)';
  if (minutes % 60 === 0) return `${minutes / 60} ساعات`;
  return `${minutes} دقيقة`;
}
