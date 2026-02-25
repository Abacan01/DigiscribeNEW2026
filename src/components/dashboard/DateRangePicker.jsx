import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

/* ── helpers ─────────────────────────────────────────────────────── */

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isBetween(d, from, to) {
  return d >= startOfDay(from) && d <= endOfDay(to);
}
function fmtShort(d) {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ── preset ranges ───────────────────────────────────────────────── */

function getPresets() {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekStart = new Date(today);
  const dayOfWeek = weekStart.getDay() || 7; // Mon=1
  weekStart.setDate(weekStart.getDate() - dayOfWeek - 6); // last Mon
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);

  return [
    { label: 'Today', from: today, to: today },
    { label: 'Yesterday', from: yesterday, to: yesterday },
    { label: 'Last week', from: weekStart, to: weekEnd },
    { label: 'Last month', from: lastMonthStart, to: lastMonthEnd },
  ];
}

/* ── CalendarMonth ───────────────────────────────────────────────── */

function CalendarMonth({ year, month, rangeFrom, rangeTo, hoverDate, onDayClick, onDayHover }) {
  const days = daysInMonth(year, month);
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon-based
  const cells = [];

  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const today = startOfDay(new Date());

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="h-8" />;

          const date = new Date(year, month, day);
          const isToday = isSameDay(date, today);

          let isStart = false;
          let isEnd = false;
          let inRange = false;

          if (rangeFrom && rangeTo) {
            const [lo, hi] = rangeFrom <= rangeTo ? [rangeFrom, rangeTo] : [rangeTo, rangeFrom];
            isStart = isSameDay(date, lo);
            isEnd = isSameDay(date, hi);
            inRange = isBetween(date, lo, hi);
          } else if (rangeFrom && hoverDate) {
            const [lo, hi] = rangeFrom <= hoverDate ? [rangeFrom, hoverDate] : [hoverDate, rangeFrom];
            isStart = isSameDay(date, lo);
            isEnd = isSameDay(date, hi);
            inRange = isBetween(date, lo, hi);
          } else if (rangeFrom) {
            isStart = isSameDay(date, rangeFrom);
            isEnd = isStart;
            inRange = isStart;
          }

          const isEdge = isStart || isEnd;
          const isFuture = date > today;

          return (
            <button
              key={day}
              type="button"
              disabled={isFuture}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              className={`
                relative h-8 text-xs font-medium transition-colors rounded-md
                ${isFuture ? 'text-gray-200 cursor-not-allowed' : 'cursor-pointer'}
                ${isEdge ? 'bg-primary text-white z-10' : ''}
                ${inRange && !isEdge ? 'bg-primary/10 text-primary' : ''}
                ${!inRange && !isEdge && !isFuture ? 'text-gray-700 hover:bg-gray-100' : ''}
                ${isToday && !isEdge ? 'ring-1 ring-primary/40' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── DateRangePicker ─────────────────────────────────────────────── */

/* ── parse MM/DD/YYYY string to Date ─────────────────────────────── */
function parseDateInput(str) {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return null;
  // Validate that the date components match (e.g. no 02/30)
  if (d.getMonth() + 1 !== Number(mm) || d.getDate() !== Number(dd)) return null;
  return d;
}

export default function DateRangePicker({ from, to, onChange }) {
  const [open, setOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => (from || new Date()).getFullYear());
  const [calMonth, setCalMonth] = useState(() => (from || new Date()).getMonth());
  const [pickFrom, setPickFrom] = useState(from || null);
  const [pickTo, setPickTo] = useState(to || null);
  const [hoverDate, setHoverDate] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customError, setCustomError] = useState('');
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const presets = useMemo(() => getPresets(), []);

  // Position the dropdown relative to the trigger button
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      left: rect.left,
    });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll / resize to prevent stale positioning
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [open]);

  // Sync external props
  useEffect(() => {
    setPickFrom(from || null);
    setPickTo(to || null);
    if (from) {
      setCalYear(from.getFullYear());
      setCalMonth(from.getMonth());
      const mm = String(from.getMonth() + 1).padStart(2, '0');
      const dd = String(from.getDate()).padStart(2, '0');
      setCustomFrom(`${mm}/${dd}/${from.getFullYear()}`);
    } else {
      setCustomFrom('');
    }
    if (to) {
      const mm = String(to.getMonth() + 1).padStart(2, '0');
      const dd = String(to.getDate()).padStart(2, '0');
      setCustomTo(`${mm}/${dd}/${to.getFullYear()}`);
    } else {
      setCustomTo('');
    }
    setCustomError('');
  }, [from, to]);

  const handleDayClick = useCallback((date) => {
    if (!pickFrom || (pickFrom && pickTo)) {
      // Start new selection
      setPickFrom(date);
      setPickTo(null);
    } else {
      // Complete selection
      const [lo, hi] = date < pickFrom ? [date, pickFrom] : [pickFrom, date];
      setPickFrom(lo);
      setPickTo(hi);
      onChange(startOfDay(lo), endOfDay(hi));
      setOpen(false);
    }
  }, [pickFrom, pickTo, onChange]);

  const applyPreset = useCallback((preset) => {
    setPickFrom(preset.from);
    setPickTo(preset.to);
    setCalYear(preset.from.getFullYear());
    setCalMonth(preset.from.getMonth());
    onChange(startOfDay(preset.from), endOfDay(preset.to));
    setOpen(false);
  }, [onChange]);

  const handleReset = useCallback(() => {
    setPickFrom(null);
    setPickTo(null);
    setCustomFrom('');
    setCustomTo('');
    setCustomError('');
    onChange(null, null);
    setOpen(false);
  }, [onChange]);

  const handleCustomApply = useCallback(() => {
    const f = parseDateInput(customFrom);
    const t = parseDateInput(customTo);
    if (!f || !t) {
      setCustomError('Use MM/DD/YYYY format');
      return;
    }
    if (f > t) {
      setCustomError('Start date must be before end date');
      return;
    }
    const today = startOfDay(new Date());
    if (f > today || t > today) {
      setCustomError('Dates cannot be in the future');
      return;
    }
    setCustomError('');
    setPickFrom(f);
    setPickTo(t);
    setCalYear(f.getFullYear());
    setCalMonth(f.getMonth());
    onChange(startOfDay(f), endOfDay(t));
    setOpen(false);
  }, [customFrom, customTo, onChange]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const buttonLabel = from && to
    ? `${fmtShort(from)} – ${fmtShort(to)}`
    : 'Select date range';

  const dropdown = open ? createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-0 flex min-w-[520px]"
    >
          {/* Left: Presets */}
          <div className="w-[160px] border-r border-gray-100 py-4 pl-4 pr-2 flex flex-col gap-0.5 overflow-y-auto max-h-[400px]">
            {presets.map((p) => {
              const isActive = pickFrom && pickTo && isSameDay(pickFrom, p.from) && isSameDay(pickTo, p.to);
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            {/* Custom date input */}
            <div className="pt-2 mt-1 border-t border-gray-100">
              <p className="px-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Custom</p>
              <div className="px-2 space-y-1.5">
                <input
                  type="text"
                  value={customFrom}
                  onChange={(e) => { setCustomFrom(e.target.value); setCustomError(''); }}
                  placeholder="MM/DD/YYYY"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[11px] text-dark-text placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40"
                />
                <input
                  type="text"
                  value={customTo}
                  onChange={(e) => { setCustomTo(e.target.value); setCustomError(''); }}
                  placeholder="MM/DD/YYYY"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[11px] text-dark-text placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40"
                />
                {customError && (
                  <p className="text-[10px] text-red-500 px-0.5">{customError}</p>
                )}
                <button
                  type="button"
                  onClick={handleCustomApply}
                  className="w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="mt-auto pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleReset}
                className="text-left px-3 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/5 transition-colors w-full"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right: Calendar */}
          <div className="flex-1 p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-chevron-left text-[10px]"></i>
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>

            <CalendarMonth
              year={calYear}
              month={calMonth}
              rangeFrom={pickFrom}
              rangeTo={pickTo}
              hoverDate={hoverDate}
              onDayClick={handleDayClick}
              onDayHover={setHoverDate}
            />
          </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
          ${from && to
            ? 'bg-primary/5 border-primary/30 text-primary'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
          }
        `}
      >
        <i className="fas fa-calendar-alt text-xs"></i>
        {buttonLabel}
        <i className={`fas fa-chevron-down text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {dropdown}
    </div>
  );
}
