import React from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { ConflictCheckResult } from '../types';
import { formatTimeArabic } from '../utils/timeUtils';

interface ConflictAlertBannerProps {
  conflictResult: ConflictCheckResult;
  onSelectAlternative?: (day: number, start: string, end: string) => void;
  alternativeSlots?: Array<{
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
  }>;
}

export const ConflictAlertBanner: React.FC<ConflictAlertBannerProps> = ({
  conflictResult,
  onSelectAlternative,
  alternativeSlots = [],
}) => {
  const { hasConflict, conflicts, hasBufferWarning, bufferWarnings } = conflictResult;

  if (!hasConflict && !hasBufferWarning) {
    return null;
  }

  return (
    <div className="space-y-3 my-3">
      {/* Critical Overlap Conflict */}
      {hasConflict && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-900 dark:text-rose-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="font-bold text-sm text-rose-800 dark:text-rose-300">
                تنبيه: يوجد تعارض زمني مع مواعيد أخرى ({conflicts.length})
              </div>
              <ul className="text-xs space-y-1 text-rose-700 dark:text-rose-300/90 list-disc list-inside">
                {conflicts.map((conf, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {conf.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Suggested Alternatives */}
          {alternativeSlots.length > 0 && onSelectAlternative && (
            <div className="mt-3 pt-2.5 border-t border-rose-200/80 dark:border-rose-900/60">
              <div className="text-xs font-semibold text-rose-900 dark:text-rose-200 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                مواعيد شاغرة بديلة مقترحة (بدون أي تعارض):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {alternativeSlots.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectAlternative(slot.dayOfWeek, slot.startTime, slot.endTime)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-800 dark:text-slate-100 rounded-md hover:bg-rose-100/60 dark:hover:bg-rose-900/30 transition-colors shadow-xs"
                  >
                    <span>{slot.dayName}</span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {formatTimeArabic(slot.startTime)} - {formatTimeArabic(slot.endTime)}
                    </span>
                    <ArrowLeft className="w-3 h-3 text-rose-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buffer Time Warning (Non-blocking but helpful) */}
      {!hasConflict && hasBufferWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1 text-xs">
              <div className="font-semibold text-amber-800 dark:text-amber-300">
                ملاحظة الفاصل الزمني والراحة بين الحصص:
              </div>
              {bufferWarnings.map((bw, idx) => (
                <div key={idx} className="text-amber-700 dark:text-amber-300/90">
                  {bw.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
