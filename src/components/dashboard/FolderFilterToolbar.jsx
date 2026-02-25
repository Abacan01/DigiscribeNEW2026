import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import DateRangePicker from './DateRangePicker';

/* ── Service hierarchy — subs MUST match UploadPage children exactly ─ */
const SERVICE_TREE = [
  {
    key: 'transcription',
    label: 'Transcription Support',
    icon: 'fa-microphone-alt',
    subs: ['Medical', 'Legal', 'General', 'Academic', 'Corporate/Business'],
  },
  {
    key: 'data-entry',
    label: 'Data Entry',
    icon: 'fa-keyboard',
    subs: ['Waybill/Invoice/Charge', 'Batch Proof Report'],
  },
  {
    key: 'emr',
    label: 'EMR',
    icon: 'fa-notes-medical',
    subs: ['Data Entry & Digitalization', 'Data Migration', 'EMR Management'],
  },
  {
    key: 'document-conversion',
    label: 'Document Conversion',
    icon: 'fa-file-export',
    subs: ['OCR & Data Extraction', 'File Format Conversion', 'Book and Ebook Conversion', 'Indexing & Redaction'],
  },
  {
    key: 'cad',
    label: 'CAD',
    icon: 'fa-drafting-compass',
    subs: ['Architectural Drafting', 'Structural Drafting', 'MEP & HVAC', '3D Visualization'],
  },
  {
    key: 'product-listing',
    label: 'E-commerce Product Listing',
    icon: 'fa-shopping-cart',
    subs: ['Data Cleaning & Validation', 'Data Extraction'],
  },
  {
    key: 'others',
    label: 'Others',
    icon: 'fa-ellipsis-h',
    subs: [],
  },
];

/* ── ServicePicker ───────────────────────────────────────────────── */
function ServicePicker({ value, onChange }) {
  // Always show every category and sub from SERVICE_TREE (no filtering by available files)
  const visibleTree = SERVICE_TREE.map((cat) => ({
    ...cat,
    visibleSubs: cat.subs, // show all subs always
  }));

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(() => visibleTree[0]?.key || '');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Keep activeKey valid when tree changes
  useEffect(() => {
    if (value) {
      const found = visibleTree.find((c) =>
        c.visibleSubs.length === 0
          ? value === c.label
          : value.startsWith(`${c.label} - `)
      );
      if (found) setActiveKey(found.key);
    } else if (visibleTree.length > 0 && !visibleTree.find((c) => c.key === activeKey)) {
      setActiveKey(visibleTree[0].key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);;

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 480;
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 8) left = window.innerWidth - panelWidth - 8;
    setPos({ top: rect.bottom + 6, left });
  }, []);

  useEffect(() => {
    if (open) updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const activeCategory = visibleTree.find((c) => c.key === activeKey) || visibleTree[0];
  const isActive = !!value;

  // Button label: show just the sub part (after " - "), or the full value for Others
  const buttonLabel = value
    ? (value.includes(' - ') ? value.split(' - ').slice(1).join(' - ') : value)
    : 'All Services';

  if (visibleTree.length === 0) return null; // shouldn't happen since we always show all

  const panel = open ? createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 480 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 flex overflow-hidden"
    >
      {/* Left – parent categories */}
      <div className="w-[175px] border-r border-gray-100 bg-gray-50/60 py-3 flex flex-col gap-0.5">
        <p className="px-4 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Service Group
        </p>
        <button
          type="button"
          onClick={() => { onChange(''); setOpen(false); }}
          className={`mx-2 text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            !value ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
          }`}
        >
          <i className="fas fa-layer-group mr-1.5 text-[10px]"></i>
          All Services
        </button>
        <div className="h-px bg-gray-200 mx-3 my-1" />
        {visibleTree.map((cat) => {
          const isCurrent = cat.key === activeKey;
          const hasSelected = cat.visibleSubs.length === 0
            ? value === cat.label
            : cat.visibleSubs.some((sub) => value === `${cat.label} - ${sub}`);
          return (
            <button
              key={cat.key}
              type="button"
              onMouseEnter={() => { if (cat.subs.length > 0) setActiveKey(cat.key); }}
              onClick={() => {
                if (cat.subs.length === 0) {
                  // "Others" — select/deselect directly, no sub panel
                  onChange(value === cat.label ? '' : cat.label);
                  setOpen(false);
                } else {
                  setActiveKey(cat.key);
                }
              }}
              className={`mx-2 text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                isCurrent
                  ? 'bg-white shadow-sm border border-gray-200/80 text-dark-text'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <i className={`fas ${cat.icon} text-[10px] ${hasSelected ? 'text-primary' : 'text-gray-400'}`}></i>
              <span className="leading-tight">{cat.label}</span>
              {hasSelected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>}
            </button>
          );
        })}
      </div>

      {/* Right – sub-services (hidden when Others is active since it has no subs) */}
      <div className="flex-1 p-4">
        {activeCategory && activeCategory.visibleSubs.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <i className={`fas ${activeCategory.icon} text-primary text-xs`}></i>
              <p className="text-xs font-semibold text-gray-700">{activeCategory.label}</p>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {activeCategory.visibleSubs.map((sub) => {
                const fullVal = `${activeCategory.label} - ${sub}`;
                const isSelected = value === fullVal;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => { onChange(isSelected ? '' : fullVal); setOpen(false); }}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && <i className="fas fa-check mr-1.5 text-[9px]"></i>}
                    {sub}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {activeCategory && activeCategory.visibleSubs.length === 0 && (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">
            <p>Click <span className="font-medium text-gray-600">&ldquo;{activeCategory.label}&rdquo;</span> on the left to select it</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all whitespace-nowrap ${
          isActive
            ? 'bg-primary/5 border-primary/30 text-primary'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        <i className="fas fa-concierge-bell text-xs"></i>
        <span className="max-w-[160px] truncate">{buttonLabel}</span>
        <i className={`fas fa-chevron-down text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>
      {panel}
    </div>
  );
}

/* ── Static file type options ────────────────────────────────────── */
const ALL_FILE_TYPES = ['Image', 'Audio', 'Video', 'Document'];

/* ── Sort options ────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'size', label: 'Largest First' },
];

/* ── FolderFilterToolbar ─────────────────────────────────────────── */
export default function FolderFilterToolbar({
  dateFrom,
  dateTo,
  onDateChange,
  typeFilter,
  onTypeChange,
  serviceFilter,
  onServiceChange,
  searchQuery,
  onSearchChange,
  fileTypes = [],
  serviceCategories = [],
  sortBy,
  onSortChange,
  onClear,
  hasActiveFilters,
  userFilter = '',
  onUserChange,
  userEmails = [],
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Compute user suggestions from searchQuery
  const userSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !userEmails.length || !onUserChange) return [];
    const q = searchQuery.toLowerCase().trim();
    return userEmails.filter((email) => email.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery, userEmails, onUserChange]);

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e) => {
      if (
        searchRef.current && !searchRef.current.contains(e.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  const handleSearchChange = (val) => {
    onSearchChange(val);
    setShowSuggestions(true);
  };

  const handleSelectUser = (email) => {
    if (onUserChange) onUserChange(email);
    onSearchChange('');
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-3 flex-wrap">

        {/* Search – LEFT, takes remaining space */}
        <div className="relative flex-1 min-w-[200px]" ref={searchRef}>
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={onUserChange ? 'Search by file name or user email...' : 'Search by file name...'}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
          {searchQuery && (
            <button onClick={() => { onSearchChange(''); setShowSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xs"></i>
            </button>
          )}

          {/* User suggestion dropdown */}
          {showSuggestions && userSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden"
            >
              <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Users</p>
              {userSuggestions.map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => handleSelectUser(email)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-[10px] text-indigo-400"></i>
                  </div>
                  <span className="text-sm text-dark-text truncate">{email}</span>
                  <span className="ml-auto text-[10px] text-gray-400">Filter by user</span>
                </button>
              ))}
            </div>
          )}

          {/* Active user filter badge below search */}
          {userFilter && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <i className="fas fa-user text-[9px]"></i>
              {userFilter}
              <button onClick={() => onUserChange('')} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </div>
          )}
        </div>

        {/* Date range picker */}
        <DateRangePicker from={dateFrom} to={dateTo} onChange={onDateChange} />

        {/* Service picker – portal popup panel */}
        <ServicePicker value={serviceFilter} onChange={onServiceChange} />

        {/* Type filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-w-[140px]"
          >
            <option value="">All Types</option>
            {ALL_FILE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-w-[150px]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-text hover:text-dark-text hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <i className="fas fa-times text-xs"></i>
            Clear
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">Filters:</span>
          {dateFrom && dateTo && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
              <i className="fas fa-calendar-alt text-[9px]"></i>
              {dateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {dateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <button onClick={() => onDateChange(null, null)} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </span>
          )}
          {serviceFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-600">
              <i className="fas fa-concierge-bell text-[9px]"></i>
              {serviceFilter}
              <button onClick={() => onServiceChange('')} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </span>
          )}
          {typeFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-50 text-violet-600">
              <i className="fas fa-file text-[9px]"></i>
              {typeFilter}
              <button onClick={() => onTypeChange('')} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
              &quot;{searchQuery}&quot;
              <button onClick={() => onSearchChange('')} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </span>
          )}
          {userFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
              <i className="fas fa-user text-[9px]"></i>
              {userFilter}
              <button onClick={() => onUserChange('')} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
