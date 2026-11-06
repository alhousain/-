export type DayId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayInfo {
  id: DayId;
  name: string; // e.g. "السبت", "الأحد"
  shortName: string;
  isWeekend?: boolean;
}

export type SessionStatus = 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';

export interface Student {
  id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  grade: string; // e.g. "الصف الثالث الثانوي"
  subject: string; // e.g. "رياضيات"
  fee?: number; // fee per session
  color: string;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  subject: string;
  grade: string;
  dayOfWeek: DayId; // 6: السبت, 0: الأحد, 1: الإثنين, etc.
  startTime: string; // "HH:MM" 24h
  endTime: string; // "HH:MM" 24h
  durationMinutes: number;
  status: SessionStatus;
  color: string;
  isRecurring: boolean; // recurring weekly
  fee?: number;
  notes?: string;
  createdAt: string;
}

export interface TeacherSettings {
  teacherName: string;
  subject: string;
  workingDays: DayId[]; // active days
  dayStartHour: number; // e.g. 10 (10:00 AM)
  dayEndHour: number; // e.g. 22 (10:00 PM)
  defaultDurationMinutes: number; // e.g. 60
  bufferMinutes: number; // minimum break between sessions
  strictConflictBlocking: boolean; // block saving if conflict detected
}

export interface ConflictDetail {
  conflictingAppointment: Appointment;
  overlapMinutes: number;
  conflictType: 'exact' | 'overlap' | 'contains' | 'buffer';
  description: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
  hasBufferWarning: boolean;
  bufferWarnings: ConflictDetail[];
}

export interface AvailableSlot {
  dayOfWeek: DayId;
  dayName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  period: 'morning' | 'afternoon' | 'evening';
  isIdeal: boolean;
  adjacentAppointmentBefore?: Appointment;
  adjacentAppointmentAfter?: Appointment;
}
