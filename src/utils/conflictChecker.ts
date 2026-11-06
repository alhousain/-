import { Appointment, AvailableSlot, ConflictCheckResult, ConflictDetail, DayId, TeacherSettings } from '../types';
import { formatTimeArabic, formatTimeRangeArabic, getDayName, getTimePeriod, minutesToTime, timeToMinutes } from './timeUtils';

export interface ProposedSession {
  id?: string;
  studentId?: string;
  studentName?: string;
  dayOfWeek: DayId;
  startTime: string;
  endTime: string;
}

/**
 * Checks whether a proposed appointment conflicts with any existing appointments.
 */
export function checkAppointmentConflict(
  proposed: ProposedSession,
  allAppointments: Appointment[],
  bufferMinutes: number = 0,
  excludeId?: string
): ConflictCheckResult {
  const result: ConflictCheckResult = {
    hasConflict: false,
    conflicts: [],
    hasBufferWarning: false,
    bufferWarnings: [],
  };

  if (!proposed.startTime || !proposed.endTime || proposed.dayOfWeek === undefined) {
    return result;
  }

  const pStart = timeToMinutes(proposed.startTime);
  const pEnd = timeToMinutes(proposed.endTime);

  if (pEnd <= pStart) {
    // End time before start time is invalid
    return result;
  }

  // Filter to active appointments on the same day, excluding the one being edited
  const sameDayAppointments = allAppointments.filter((app) => {
    if (excludeId && app.id === excludeId) return false;
    if (app.status === 'cancelled') return false;
    return app.dayOfWeek === proposed.dayOfWeek;
  });

  for (const existing of sameDayAppointments) {
    const eStart = timeToMinutes(existing.startTime);
    const eEnd = timeToMinutes(existing.endTime);

    // Check direct time overlap:
    // Overlap occurs if candidate starts before existing ends AND candidate ends after existing starts
    const isOverlapping = pStart < eEnd && pEnd > eStart;

    if (isOverlapping) {
      result.hasConflict = true;

      const overlapStart = Math.max(pStart, eStart);
      const overlapEnd = Math.min(pEnd, eEnd);
      const overlapMins = overlapEnd - overlapStart;

      let conflictType: ConflictDetail['conflictType'] = 'overlap';
      let desc = '';

      if (pStart === eStart && pEnd === eEnd) {
        conflictType = 'exact';
        desc = `تعارض تام في نفس التوقيت بالضبط مع حصة "${existing.studentName}" (${formatTimeRangeArabic(existing.startTime, existing.endTime)})`;
      } else if (pStart >= eStart && pEnd <= eEnd) {
        conflictType = 'contains';
        desc = `الموعد المقترح يقع بالكامل داخل حصة "${existing.studentName}" (${formatTimeRangeArabic(existing.startTime, existing.endTime)})`;
      } else if (pStart <= eStart && pEnd >= eEnd) {
        conflictType = 'contains';
        desc = `الموعد المقترح يحتوي بالكامل على حصة "${existing.studentName}" (${formatTimeRangeArabic(existing.startTime, existing.endTime)})`;
      } else {
        desc = `تعارض وتداخل زمني (${overlapMins} دقيقة) مع حصة "${existing.studentName}" (${formatTimeRangeArabic(existing.startTime, existing.endTime)})`;
      }

      result.conflicts.push({
        conflictingAppointment: existing,
        overlapMinutes: overlapMins,
        conflictType,
        description: desc,
      });
    } else if (bufferMinutes > 0) {
      // Check buffer / rest time between consecutive sessions
      // Case 1: Proposed is immediately before existing
      if (pEnd <= eStart && eStart - pEnd < bufferMinutes) {
        result.hasBufferWarning = true;
        const gap = eStart - pEnd;
        result.bufferWarnings.push({
          conflictingAppointment: existing,
          overlapMinutes: 0,
          conflictType: 'buffer',
          description: `الفاصل الزمني قبل حصة "${existing.studentName}" (${gap} دقيقة) أقل من الفاصل الموصى به (${bufferMinutes} دقيقة)`,
        });
      }
      // Case 2: Proposed is immediately after existing
      else if (pStart >= eEnd && pStart - eEnd < bufferMinutes) {
        result.hasBufferWarning = true;
        const gap = pStart - eEnd;
        result.bufferWarnings.push({
          conflictingAppointment: existing,
          overlapMinutes: 0,
          conflictType: 'buffer',
          description: `الفاصل الزمني بعد حصة "${existing.studentName}" (${gap} دقيقة) أقل من الفاصل الموصى به (${bufferMinutes} دقيقة)`,
        });
      }
    }
  }

  return result;
}

/**
 * Searches for all free conflict-free slots of a given duration across specified days.
 */
export function findAvailableSlots(options: {
  durationMinutes: number;
  days?: DayId[];
  existingAppointments: Appointment[];
  settings: TeacherSettings;
  timePreference?: 'all' | 'morning' | 'afternoon' | 'evening';
  stepMinutes?: number; // granularity, e.g. every 15 or 30 mins
}): AvailableSlot[] {
  const {
    durationMinutes,
    days = options.settings.workingDays,
    existingAppointments,
    settings,
    timePreference = 'all',
    stepMinutes = 15,
  } = options;

  const results: AvailableSlot[] = [];
  const buffer = settings.bufferMinutes || 0;
  const startDayMin = settings.dayStartHour * 60;
  const endDayMin = settings.dayEndHour * 60;

  for (const day of days) {
    const dayAppointments = existingAppointments
      .filter((app) => app.dayOfWeek === day && app.status !== 'cancelled')
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // Iterate through day in increments of stepMinutes
    for (let slotStart = startDayMin; slotStart + durationMinutes <= endDayMin; slotStart += stepMinutes) {
      const slotEnd = slotStart + durationMinutes;
      const startStr = minutesToTime(slotStart);
      const endStr = minutesToTime(slotEnd);

      const period = getTimePeriod(startStr);
      if (timePreference !== 'all' && period !== timePreference) {
        continue;
      }

      // Check conflict
      let isBlocked = false;
      let adjacentBefore: Appointment | undefined;
      let adjacentAfter: Appointment | undefined;

      for (const app of dayAppointments) {
        const appStart = timeToMinutes(app.startTime);
        const appEnd = timeToMinutes(app.endTime);

        // Check overlap (including buffer if configured)
        const overlap = slotStart < appEnd && slotEnd > appStart;
        if (overlap) {
          isBlocked = true;
          break;
        }

        // Check buffer requirement
        if (buffer > 0) {
          if (slotEnd <= appStart && appStart - slotEnd < buffer) {
            isBlocked = true;
            break;
          }
          if (slotStart >= appEnd && slotStart - appEnd < buffer) {
            isBlocked = true;
            break;
          }
        }

        if (slotStart === appEnd + buffer || slotStart === appEnd) {
          adjacentBefore = app;
        }
        if (slotEnd + buffer === appStart || slotEnd === appStart) {
          adjacentAfter = app;
        }
      }

      if (!isBlocked) {
        // This is an available conflict-free slot!
        // Mark as ideal if it neatly connects with existing sessions or sits at standard hourly marks
        const isIdeal =
          Boolean(adjacentBefore || adjacentAfter) ||
          slotStart % 60 === 0 ||
          slotStart % 60 === 30;

        results.push({
          dayOfWeek: day,
          dayName: getDayName(day),
          startTime: startStr,
          endTime: endStr,
          durationMinutes,
          period,
          isIdeal,
          adjacentAppointmentBefore: adjacentBefore,
          adjacentAppointmentAfter: adjacentAfter,
        });
      }
    }
  }

  return results;
}

/**
 * Suggests the closest available alternative slots when a conflict is encountered.
 */
export function suggestAlternativeSlots(
  dayOfWeek: DayId,
  durationMinutes: number,
  preferredTime: string,
  existingAppointments: Appointment[],
  settings: TeacherSettings,
  maxSuggestions: number = 3
): AvailableSlot[] {
  // First look on the same day
  const sameDaySlots = findAvailableSlots({
    durationMinutes,
    days: [dayOfWeek],
    existingAppointments,
    settings,
    timePreference: 'all',
  });

  const preferredMins = timeToMinutes(preferredTime);

  // Sort by proximity to preferred time
  sameDaySlots.sort((a, b) => {
    const diffA = Math.abs(timeToMinutes(a.startTime) - preferredMins);
    const diffB = Math.abs(timeToMinutes(b.startTime) - preferredMins);
    return diffA - diffB;
  });

  if (sameDaySlots.length >= maxSuggestions) {
    return sameDaySlots.slice(0, maxSuggestions);
  }

  // If not enough on the same day, look across all working days
  const otherDays = settings.workingDays.filter((d) => d !== dayOfWeek);
  const otherDaySlots = findAvailableSlots({
    durationMinutes,
    days: otherDays,
    existingAppointments,
    settings,
    timePreference: 'all',
  });

  otherDaySlots.sort((a, b) => {
    const diffA = Math.abs(timeToMinutes(a.startTime) - preferredMins);
    const diffB = Math.abs(timeToMinutes(b.startTime) - preferredMins);
    return diffA - diffB;
  });

  const combined = [...sameDaySlots, ...otherDaySlots];
  return combined.slice(0, maxSuggestions);
}
