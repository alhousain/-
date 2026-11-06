import React, { useState, useId } from 'react';
import { Student, Appointment } from '../types';
import { Users, Plus, Search, Phone, MessageSquare, Edit3, Trash2, Calendar, Clock, X, Check } from 'lucide-react';
import { formatTimeArabic, getDayName } from '../utils/timeUtils';
import { ConfirmModal } from './ConfirmModal';

interface StudentManagerProps {
  students: Student[];
  appointments: Appointment[];
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onScheduleForStudent: (student: Student) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  appointments,
  onSaveStudent,
  onDeleteStudent,
  onScheduleForStudent,
}) => {
  const [search, setSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const titleId = useId();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [fee, setFee] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.grade.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setPhone('');
    setParentPhone('');
    setGrade('');
    setSubject('');
    setFee(0);
    setNotes('');
    setColor('#3B82F6');
    setIsModalOpen(true);
  };

  const openEditModal = (std: Student) => {
    setEditingStudent(std);
    setName(std.name);
    setPhone(std.phone);
    setParentPhone(std.parentPhone || '');
    setGrade(std.grade);
    setSubject(std.subject);
    setFee(std.fee || 0);
    setNotes(std.notes || '');
    setColor(std.color);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const studentToSave: Student = {
      id: editingStudent ? editingStudent.id : `std-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      parentPhone: parentPhone.trim(),
      grade: grade.trim(),
      subject: subject.trim(),
      fee: Number(fee) || 0,
      notes: notes.trim(),
      color,
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
    };

    onSaveStudent(studentToSave);
    setIsModalOpen(false);
  };

  const openWhatsApp = (num: string, studentName: string) => {
    if (!num) return;
    const clean = num.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`السلام عليكم، تحياتي لك أستاذ/ولي أمر الطالب ${studentName}`);
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Search and Add Top Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم الطالب، الهاتف، الصف، أو المادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة طالب جديد</span>
        </button>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لا يوجد طلاب مسجلون</p>
          <p className="text-xs text-slate-400 mt-1">أضف طلابك لتسهيل تنظيم مواعيدهم وتفادي التعارض</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((std) => {
            const studentAppointments = appointments.filter(
              (a) => a.studentId === std.id && a.status !== 'cancelled'
            );

            return (
              <div
                key={std.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-4"
                style={{ borderTop: `4px solid ${std.color}` }}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        style={{ backgroundColor: std.color }}
                        className="w-9 h-9 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs"
                      >
                        {std.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {std.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {std.grade || 'طالب'} {std.subject ? `· ${std.subject}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(std)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="تعديل بيانات الطالب"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentToDelete(std)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                    {std.phone && (
                      <div className="flex items-center justify-between">
                        <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {std.phone}
                        </span>
                        <button
                          type="button"
                          onClick={() => openWhatsApp(std.phone, std.name)}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <MessageSquare className="w-3 h-3" />
                          واتساب
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scheduled Appointments Preview */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      المواعيد الأسبوعية المسجلة ({studentAppointments.length}):
                    </span>
                    {studentAppointments.length === 0 ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                        لا يوجد موعد مجدول حالياً لهذا الطالب
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {studentAppointments.map((app) => (
                          <span
                            key={app.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 rounded-md font-mono tabular-nums text-slate-700 dark:text-slate-300"
                          >
                            <span>{getDayName(app.dayOfWeek)}:</span>
                            <span>{formatTimeArabic(app.startTime)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom CTA: Add appointment directly for this student */}
                <button
                  type="button"
                  onClick={() => onScheduleForStudent(std)}
                  className="w-full py-2 px-3 text-xs font-semibold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/40 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>جدولة موعد لهذا الطالب</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden transition-all text-right"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 id={titleId} className="text-base font-bold text-slate-900 dark:text-white">
                {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  اسم الطالب الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد مصطفى"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    رقم الهاتف / الواتساب
                  </label>
                  <input
                    type="tel"
                    placeholder="010XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    هاتف ولي الأمر (اختياري)
                  </label>
                  <input
                    type="tel"
                    placeholder="011XXXXXXXX"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الصف الدراسي
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الصف الثالث الثانوي"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    المادة المقررة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: رياضيات بحتة"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    قيمة الحصة (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    لون تمييز الطالب في الجدول
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ملاحظات
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول مستوى الطالب أو مواعيده..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {editingStudent ? 'حفظ التعديلات' : 'إضافة الطالب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(studentToDelete)}
        title="حذف الطالب وسجلاته"
        message={
          studentToDelete
            ? `هل أنت متأكد من حذف الطالب "${studentToDelete.name}"؟ سيتم أيضاً إزالة الحصص المرتبطة به من الجدول تلقائياً.`
            : ''
        }
        confirmText="نعم، حذف الطالب"
        cancelText="تراجع"
        isDestructive={true}
        onConfirm={() => {
          if (studentToDelete) {
            onDeleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }
        }}
        onCancel={() => setStudentToDelete(null)}
      />
    </div>
  );
};
