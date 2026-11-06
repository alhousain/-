import { Appointment, Student, TeacherSettings } from '../types';

export const DEFAULT_SETTINGS: TeacherSettings = {
  teacherName: 'أ. محمود حسين',
  subject: 'الرياضيات',
  workingDays: [6, 0, 1, 2, 3, 4], // Saturday through Thursday
  dayStartHour: 12, // 12:00 PM
  dayEndHour: 22, // 10:00 PM
  defaultDurationMinutes: 60,
  bufferMinutes: 0,
  strictConflictBlocking: true,
};

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: 'عمر خالد السعيد',
    phone: '01012345678',
    parentPhone: '01098765432',
    grade: 'الصف الثالث الثانوي',
    subject: 'تفاضل وتكامل',
    fee: 250,
    color: '#3B82F6',
    notes: 'متابعة مسائل الامتحانات',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'std-2',
    name: 'سارة طارق إبراهيم',
    phone: '01123456789',
    parentPhone: '01187654321',
    grade: 'الصف الثاني الثانوي',
    subject: 'جبر وحساب مثلثات',
    fee: 200,
    color: '#8B5CF6',
    notes: 'حل تدريبات المعاصر',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'std-3',
    name: 'زياد مصطفى حسني',
    phone: '01234567890',
    parentPhone: '01276543210',
    grade: 'الصف الأول الثانوي',
    subject: 'هندسة فراغية',
    fee: 150,
    color: '#10B981',
    notes: 'حصة أسبوعية',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    title: 'تفاضل وتكامل',
    studentId: 'std-1',
    studentName: 'عمر خالد السعيد',
    subject: 'تفاضل وتكامل',
    grade: 'الصف الثالث الثانوي',
    dayOfWeek: 6, // السبت
    startTime: '14:00',
    endTime: '15:30',
    durationMinutes: 90,
    status: 'confirmed',
    color: '#3B82F6',
    isRecurring: true,
    fee: 250,
    notes: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-2',
    title: 'جبر وحساب مثلثات',
    studentId: 'std-2',
    studentName: 'سارة طارق إبراهيم',
    subject: 'جبر وحساب مثلثات',
    grade: 'الصف الثاني الثانوي',
    dayOfWeek: 6, // السبت (تسلم مباشرة بعد عمر خالد: 15:30 إلى 17:00)
    startTime: '15:30',
    endTime: '17:00',
    durationMinutes: 90,
    status: 'confirmed',
    color: '#8B5CF6',
    isRecurring: true,
    fee: 200,
    notes: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'app-3',
    title: 'هندسة فراغية',
    studentId: 'std-3',
    studentName: 'زياد مصطفى حسني',
    subject: 'هندسة فراغية',
    grade: 'الصف الأول الثانوي',
    dayOfWeek: 6, // السبت (تسلم مباشرة بعد سارة: 17:00 إلى 18:30)
    startTime: '17:00',
    endTime: '18:30',
    durationMinutes: 90,
    status: 'confirmed',
    color: '#10B981',
    isRecurring: true,
    fee: 150,
    notes: '',
    createdAt: new Date().toISOString(),
  },
];

const KEYS = {
  APPOINTMENTS: 'teacher_scheduler_appointments_data',
  STUDENTS: 'teacher_scheduler_students_data',
  SETTINGS: 'teacher_scheduler_settings_data',
  THEME: 'teacher_scheduler_theme_data',
  INITIALIZED: 'teacher_scheduler_is_initialized',
  LAST_CLOUD_SYNC: 'teacher_scheduler_last_cloud_sync',
};

// Legacy keys to rescue user data if present
const LEGACY_KEYS = {
  APP_V2: 'teacher_scheduler_appointments_v2',
  APP_V1: 'teacher_scheduler_appointments_v1',
  STD_V2: 'teacher_scheduler_students_v2',
  STD_V1: 'teacher_scheduler_students_v1',
  SET_V2: 'teacher_scheduler_settings_v2',
  SET_V1: 'teacher_scheduler_settings_v1',
};

export function loadAppointments(): Appointment[] {
  try {
    // 1. Check current persistent store
    const raw = localStorage.getItem(KEYS.APPOINTMENTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed; // Keep user's exact data, even if empty array!
      }
    }

    // 2. Rescue from previous versions if user had added data
    const legacyV2 = localStorage.getItem(LEGACY_KEYS.APP_V2);
    if (legacyV2 !== null) {
      const parsed = JSON.parse(legacyV2);
      if (Array.isArray(parsed)) {
        saveAppointments(parsed);
        return parsed;
      }
    }

    const legacyV1 = localStorage.getItem(LEGACY_KEYS.APP_V1);
    if (legacyV1 !== null) {
      const parsed = JSON.parse(legacyV1);
      if (Array.isArray(parsed)) {
        saveAppointments(parsed);
        return parsed;
      }
    }

    // 3. Brand new first-time setup
    saveAppointments(INITIAL_APPOINTMENTS);
    return INITIAL_APPOINTMENTS;
  } catch (err) {
    console.error('Error loading appointments:', err);
    return INITIAL_APPOINTMENTS;
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
  } catch (err) {
    console.error('Failed to save appointments:', err);
  }
}

export function loadStudents(): Student[] {
  try {
    // 1. Check current persistent store
    const raw = localStorage.getItem(KEYS.STUDENTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed; // Keep user's exact data, even if empty array!
      }
    }

    // 2. Rescue from previous versions if user had added data
    const legacyV2 = localStorage.getItem(LEGACY_KEYS.STD_V2);
    if (legacyV2 !== null) {
      const parsed = JSON.parse(legacyV2);
      if (Array.isArray(parsed)) {
        saveStudents(parsed);
        return parsed;
      }
    }

    const legacyV1 = localStorage.getItem(LEGACY_KEYS.STD_V1);
    if (legacyV1 !== null) {
      const parsed = JSON.parse(legacyV1);
      if (Array.isArray(parsed)) {
        saveStudents(parsed);
        return parsed;
      }
    }

    // 3. Brand new first-time setup
    saveStudents(INITIAL_STUDENTS);
    return INITIAL_STUDENTS;
  } catch (err) {
    console.error('Error loading students:', err);
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
  } catch (err) {
    console.error('Failed to save students:', err);
  }
}

export function loadSettings(): TeacherSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw !== null) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }

    const legacyV2 = localStorage.getItem(LEGACY_KEYS.SET_V2);
    if (legacyV2 !== null) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(legacyV2) };
    }

    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TeacherSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function resetAllData(): {
  appointments: Appointment[];
  students: Student[];
  settings: TeacherSettings;
} {
  saveAppointments(INITIAL_APPOINTMENTS);
  saveStudents(INITIAL_STUDENTS);
  saveSettings(DEFAULT_SETTINGS);
  return {
    appointments: INITIAL_APPOINTMENTS,
    students: INITIAL_STUDENTS,
    settings: DEFAULT_SETTINGS,
  };
}

// Cloud Storage API integrations
export async function saveToCloudServer(payload: {
  appointments: Appointment[];
  students: Student[];
  settings: TeacherSettings;
}): Promise<{ success: boolean; lastSavedAt?: string; error?: string }> {
  try {
    const res = await fetch('/api/cloud-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success && data.lastSavedAt) {
      localStorage.setItem(KEYS.LAST_CLOUD_SYNC, data.lastSavedAt);
      return { success: true, lastSavedAt: data.lastSavedAt };
    }
    return { success: false, error: data.error || 'تعذر الحفظ السحابي' };
  } catch (err) {
    console.error('saveToCloudServer error:', err);
    return { success: false, error: 'تعذر الاتصال بالخادم السحابي' };
  }
}

export async function loadFromCloudServer(): Promise<{
  success: boolean;
  hasData: boolean;
  data?: {
    appointments: Appointment[];
    students: Student[];
    settings: TeacherSettings;
    lastSavedAt: string;
  };
  error?: string;
}> {
  try {
    const res = await fetch('/api/cloud-load');
    const data = await res.json();
    if (data.success) {
      return data;
    }
    return { success: false, hasData: false, error: data.error };
  } catch (err) {
    console.error('loadFromCloudServer error:', err);
    return { success: false, hasData: false, error: 'تعذر الاتصال بالخادم' };
  }
}

export function getLastCloudSyncTime(): string | null {
  return localStorage.getItem(KEYS.LAST_CLOUD_SYNC);
}
