import React, { useState, useEffect, useId } from 'react';
import { X, Clock, Check, Plus, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { Appointment, DayId, Student, TeacherSettings } from '../types';
import { DAYS_LIST, formatDurationArabic, formatTimeArabic, minutesToTime, timeToMinutes, addMinutes } from '../utils/timeUtils';
import { checkAppointmentConflict, suggestAlternativeSlots } from '../utils/conflictChecker';
import { ConflictAlertBanner } from './ConflictAlertBanner';
import { ConfirmModal } from './ConfirmModal';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
  initialAppointment?: Partial<Appointment> | null;
  existingAppointments: Appointment[];
  students: Student[];
  onQuickAddStudent: (student: Student) => void;
  settings: TeacherSettings;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialAppointment,
  existingAppointments,
  students,
  onQuickAddStudent,
  settings,
}) => {
  const isEditing = Boolean(initialAppointment?.id);
  const titleId = useId();

  // Form states
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<DayId>(6); // Saturday default
  const [startTime, setStartTime] = useState<string>('16:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(settings.defaultDurationMinutes || 60);
  const [endTime, setEndTime] = useState<string>('17:00');
  const [fee, setFee] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [color, setColor] = useState<string>('#3B82F6');
  const [isRecurring, setIsRecurring] = useState<boolean>(true);

  // Quick add student inline state
  const [showQuickAddStudent, setShowQuickAddStudent] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentPhone, setNewStudentPhone] = useState<string>('');
  const [newStudentGrade, setNewStudentGrade] = useState<string>('');

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Sync initial appointment props
  useEffect(() => {
    if (initialAppointment) {
      setStudentId(initialAppointment.studentId || (students[0]?.id ?? ''));
      setStudentName(initialAppointment.studentName || (students[0]?.name ?? ''));
      setSubject(initialAppointment.subject || settings.subject || '');
      setGrade(initialAppointment.grade || '');
      setDayOfWeek(initialAppointment.dayOfWeek !== undefined ? initialAppointment.dayOfWeek : 6);

      const sTime = initialAppointment.startTime || '16:00';
      const dur = initialAppointment.durationMinutes || settings.defaultDurationMinutes || 60;
      setStartTime(sTime);
      setDurationMinutes(dur);
      setEndTime(initialAppointment.endTime || addMinutes(sTime, dur));

      setFee(initialAppointment.fee || 0);
      setNotes(initialAppointment.notes || '');
      setColor(initialAppointment.color || '#3B82F6');
      setIsRecurring(initialAppointment.isRecurring ?? true);
    } else {
      const firstStd = students[0];
      setStudentId(firstStd ? firstStd.id : '');
      setStudentName(firstStd ? firstStd.name : '');
      setSubject(firstStd?.subject || settings.subject || '');
      setGrade(firstStd?.grade || '');
      setDayOfWeek(6);
      setStartTime('16:00');
      setDurationMinutes(settings.defaultDurationMinutes || 60);
      setEndTime(addMinutes('16:00', settings.defaultDurationMinutes || 60));
      setFee(firstStd?.fee || 0);
      setNotes('');
      setColor(firstStd?.color || '#3B82F6');
      setIsRecurring(true);
    }
  }, [initialAppointment, students, settings, isOpen]);

  // Handle student selection change
  const handleStudentChange = (id: string) => {
    setStudentId(id);
    const selected = students.find((s) => s.id === id);
    if (selected) {
      setStudentName(selected.name);
      if (selected.subject) setSubject(selected.subject);
      if (selected.grade) setGrade(selected.grade);
      if (selected.fee) setFee(selected.fee);
      if (selected.color) setColor(selected.color);
    }
  };

  // Keep end time in sync when start time or duration changes
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    setEndTime(addMinutes(newStartTime, durationMinutes));
  };

  const handleDurationChange = (newDuration: number) => {
    setDurationMinutes(newDuration);
    setEndTime(addMinutes(startTime, newDuration));
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    const sMin = timeToMinutes(startTime);
    const eMin = timeToMinutes(newEndTime);
    if (eMin > sMin) {
      setDurationMinutes(eMin - sMin);
    }
  };

  // Real-time conflict checking
  const conflictResult = checkAppointmentConflict(
    {
      id: initialAppointment?.id,
      dayOfWeek,
      startTime,
      endTime,
      studentId,
      studentName,
    },
    existingAppointments,
    settings.bufferMinutes,
    initialAppointment?.id
  );

  // Suggestions for alternative free slots if conflict happens
  const alternativeSlots = conflictResult.hasConflict
    ? suggestAlternativeSlots(
        dayOfWeek,
        durationMinutes,
        startTime,
        existingAppointments,
        settings,
        3
      )
    : [];

  const handleSelectAlternative = (day: number, start: string, end: string) => {
    setDayOfWeek(day as DayId);
    setStartTime(start);
    setEndTime(end);
    setDurationMinutes(timeToMinutes(end) - timeToMinutes(start));
  };

  // Quick student creation
  const handleCreateQuickStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const created: Student = {
      id: `std-${Date.now()}`,
      name: newStudentName.trim(),
      phone: newStudentPhone.trim(),
      grade: newStudentGrade.trim() || 'عام',
      subject: subject || settings.subject,
      color: randomColor,
      createdAt: new Date().toISOString(),
    };

    onQuickAddStudent(created);
    setStudentId(created.id);
    setStudentName(created.name);
    setGrade(created.grade);
    setColor(created.color);
    setShowQuickAddStudent(false);
    setNewStudentName('');
    setNewStudentPhone('');
    setNewStudentGrade('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      return;
    }

    if (conflictResult.hasConflict && settings.strictConflictBlocking) {
      return;
    }

    const appToSave: Appointment = {
      id: initialAppointment?.id || `app-${Date.now()}`,
      title: subject ? `${subject} - ${studentName}` : `حصة ${studentName}`,
      studentId: studentId || 'unassigned',
      studentName: studentName.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      dayOfWeek,
      startTime,
      endTime,
      durationMinutes,
      status: initialAppointment?.status || 'confirmed',
      color,
      isRecurring,
      fee: Number(fee) || 0,
      notes: notes.trim(),
      createdAt: initialAppointment?.createdAt || new Date().toISOString(),
    };

    onSave(appToSave);
    onClose();
  };

  if (!isOpen) return null;

  const durationPresets = [30, 45, 60, 90, 120];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden transition-all text-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'تعديل موعد الحصة' : 'إضافة موعد حصة جديد'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                فحص فوري للتعارض الزمني مع باقي مواعيدك
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Conflict Banner Display */}
          <ConflictAlertBanner
            conflictResult={conflictResult}
            onSelectAlternative={handleSelectAlternative}
            alternativeSlots={alternativeSlots}
          />

          {!conflictResult.hasConflict && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>الموعد شاغر ومتاح ولا يوجد أي تعارض مع جدولك.</span>
            </div>
          )}

          {/* Student Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                اسم الطالب <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddStudent(!showQuickAddStudent)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>طالب جديد سريعاً</span>
              </button>
            </div>

            {/* Quick add student form */}
            {showQuickAddStudent && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mb-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  إضافة طالب جديد للقائمة:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="اسم الطالب"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="tel"
                    placeholder="رقم الهاتف / واتساب"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="الصف الدراسي"
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddStudent(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateQuickStudent}
                    disabled={!newStudentName.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    إضافة واختيار
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- اختر من قائمة الطلاب --</option>
                {students.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name} {std.grade ? `(${std.grade})` : ''}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="أو اكتب اسم الطالب يدوياً"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Subject & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                المادة / الموضوع
              </label>
              <input
                type="text"
                placeholder="مثال: رياضيات، تفاضل، فيزياء"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                الصف الدراسي
              </label>
              <input
                type="text"
                placeholder="مثال: الصف الثالث الثانوي"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Day & Timing Configuration */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            {/* Day of Week */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                يوم الحصة أسبوعياً
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {DAYS_LIST.map((day) => {
                  const isSelected = dayOfWeek === day.id;
                  const isWorkingDay = settings.workingDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setDayOfWeek(day.id)}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/50'
                          : isWorkingDay
                          ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-transparent'
                      }`}
                    >
                      <div>{day.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  مدة الحصة
                </label>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {formatDurationArabic(durationMinutes)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {durationPresets.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => handleDurationChange(dur)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      durationMinutes === dur
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {dur} دقيقة
                  </button>
                ))}
              </div>
            </div>

            {/* Start and End Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  وقت البدء
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  يعادل: {formatTimeArabic(startTime)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  وقت الانتهاء
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  يعادل: {formatTimeArabic(endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Fee & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                قيمة الحصة / الرسوم (ج.م)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                لون التمييز في الجدول
              </label>
              <div className="flex items-center gap-2 pt-1.5">
                {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#64748B'].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 pt-1">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>تتكرر هذه الحصة أسبوعياً في نفس الموعد</span>
          </label>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ملاحظات إضافية (الواجب، الدروس المطلوبة)
            </label>
            <textarea
              rows={2}
              placeholder="اكتب أي ملاحظات خاصة بالحصة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
              >
                حذف الموعد
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={conflictResult.hasConflict && settings.strictConflictBlocking}
                className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white transition-all shadow-xs ${
                  conflictResult.hasConflict && settings.strictConflictBlocking
                    ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {conflictResult.hasConflict && settings.strictConflictBlocking
                  ? 'يوجد تعارض (لا يمكن الحفظ)'
                  : isEditing
                  ? 'تحديث الموعد'
                  : 'حفظ الحصة في الجدول'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="حذف موعد الحصة"
        message={`هل أنت متأكد من رغبتك في حذف حصة "${studentName}" (${formatTimeArabic(startTime)}) من جدولك نهائياً؟`}
        confirmText="نعم، حذف الحصة"
        cancelText="تراجع"
        isDestructive={true}
        onConfirm={() => {
          if (initialAppointment?.id && onDelete) {
            onDelete(initialAppointment.id);
          }
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
