import React, { useState, useId } from 'react';
import { X, Settings, ShieldCheck, Download, Upload, RotateCcw, Check, Clock, Calendar, AlertCircle } from 'lucide-react';
import { DayId, TeacherSettings, Appointment, Student } from '../types';
import { DAYS_LIST, formatTimeArabic } from '../utils/timeUtils';
import { ConfirmModal } from './ConfirmModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TeacherSettings;
  onSaveSettings: (settings: TeacherSettings) => void;
  onResetData: () => void;
  appointments: Appointment[];
  students: Student[];
  onImportData: (data: { appointments: Appointment[]; students: Student[]; settings: TeacherSettings }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
  appointments,
  students,
  onImportData,
}) => {
  const [formData, setFormData] = useState<TeacherSettings>(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const titleId = useId();

  if (!isOpen) return null;

  const handleToggleDay = (dayId: DayId) => {
    const current = formData.workingDays || [];
    if (current.includes(dayId)) {
      if (current.length > 1) {
        setFormData({ ...formData, workingDays: current.filter((d: DayId) => d !== dayId) });
      }
    } else {
      setFormData({ ...formData, workingDays: [...current, dayId] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const handleExportJSON = () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: formData,
      students,
      appointments,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher_schedule_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.appointments && parsed.students) {
          onImportData({
            appointments: parsed.appointments,
            students: parsed.students,
            settings: parsed.settings || formData,
          });
          setImportNotice({ type: 'success', text: 'تم استيراد النسخة الاحتياطية بنجاح!' });
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setImportNotice({ type: 'error', text: 'الملف المرفوع غير متوافق مع نظام الجدول.' });
        }
      } catch (err) {
        setImportNotice({ type: 'error', text: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden transition-all text-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-bold text-slate-900 dark:text-white">
                إعدادات جدول المعلم ونظام منع التعارض
              </h2>
              <p className="text-xs text-slate-500">
                خصص ساعات العمل وفواصل الراحة وقواعد منع التعارض
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Teacher Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                اسم المعلم / الأستاذ
              </label>
              <input
                type="text"
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                المادة الأساسية
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Working Days */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              أيام العمل في الأسبوع:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_LIST.map((day) => {
                const isSelected = formData.workingDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleToggleDay(day.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {day.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Hours Range */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              نطاق ساعات العمل اليومية:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  بداية يوم التدريس
                </label>
                <select
                  value={formData.dayStartHour}
                  onChange={(e) =>
                    setFormData({ ...formData, dayStartHour: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono tabular-nums"
                >
                  {[8, 9, 10, 11, 12, 13, 14, 15].map((h) => (
                    <option key={h} value={h}>
                      {formatTimeArabic(`${h.toString().padStart(2, '0')}:00`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  نهاية يوم التدريس
                </label>
                <select
                  value={formData.dayEndHour}
                  onChange={(e) =>
                    setFormData({ ...formData, dayEndHour: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono tabular-nums"
                >
                  {[18, 19, 20, 21, 22, 23, 24].map((h) => (
                    <option key={h} value={h}>
                      {formatTimeArabic(`${(h % 24).toString().padStart(2, '0')}:00`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Buffer & Conflict Enforcement */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  الفاصل الزمني الموصى به بين الحصص (راحة وتنقل):
                </label>
                <span className="text-xs font-bold text-indigo-600 font-mono tabular-nums">
                  {formData.bufferMinutes} دقيقة
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[0, 5, 10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFormData({ ...formData, bufferMinutes: mins })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      formData.bufferMinutes === mins
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {mins === 0 ? 'بدون فاصل' : `${mins} دقيقة`}
                  </button>
                ))}
              </div>
            </div>

            {/* Strict Conflict Blocking */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.strictConflictBlocking}
                  onChange={(e) =>
                    setFormData({ ...formData, strictConflictBlocking: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    قفل الحفظ الصارم عند وجود تعارض (موصى به لمنع التضارب نهائياً)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                    عند التفعيل، لن يسمح البرنامج بحفظ أي موعد يتداخل مع حصة قائمة أو ينتهك قواعد التوقيت.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Backup, Export & Reset */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              النسخ الاحتياطي والبيانات:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير نسخة احتياطية (JSON)</span>
              </button>

              <label className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد نسخة</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-1.5 transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تعيين البيانات</span>
              </button>
            </div>

            {importNotice && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  importNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
                }`}
              >
                {importNotice.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{importNotice.text}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              حفظ الإعدادات
            </button>
          </div>
        </form>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="إعادة تعيين بيانات الجدول"
        message="هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات إلى الحالة الافتراضية؟ سيتم مسح الحصص والطلاب الحاليين واسترجاع البيانات التجريبية."
        confirmText="نعم، إعادة التعيين"
        cancelText="تراجع"
        isDestructive={true}
        onConfirm={() => {
          onResetData();
          setShowResetConfirm(false);
          onClose();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
