import DateRangePicker from './DateRangePicker';

/**
 * Filter toolbar shown when admin is INSIDE a folder.
 * Provides: date range picker, file-type filter, service/category filter, search.
 *
 * Props:
 *  - dateFrom / dateTo (Date|null)  – current date range
 *  - onDateChange(from, to)         – callback when range changes
 *  - typeFilter (string)            – current file-type filter value
 *  - onTypeChange(val)              – callback
 *  - serviceFilter (string)         – current service/category filter value
 *  - onServiceChange(val)           – callback
 *  - searchQuery (string)
 *  - onSearchChange(val)
 *  - fileTypes (string[])           – unique file types in current folder
 *  - serviceCategories (string[])   – unique service categories in current folder
 *  - sortBy (string)
 *  - onSortChange(val)
 *  - onClear()                      – clear all folder-level filters
 *  - hasActiveFilters (bool)
 */

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'size', label: 'Largest First' },
];

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
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
        {/* Search – LEFT side, takes remaining space */}
        <div className="relative flex-1 min-w-[200px]">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by file name..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>

        {/* Date range picker – RIGHT side filters start here */}
        <DateRangePicker from={dateFrom} to={dateTo} onChange={onDateChange} />

        {/* Type filter – always shown */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-w-[160px]"
          >
            <option value="">All Types</option>
            {fileTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
        </div>

        {/* Service / Category filter – always shown */}
        <div className="relative">
          <select
            value={serviceFilter}
            onChange={(e) => onServiceChange(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-w-[180px]"
          >
            <option value="">All Services</option>
            {serviceCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
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
          {typeFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-50 text-violet-600">
              <i className="fas fa-file text-[9px]"></i>
              {typeFilter}
              <button onClick={() => onTypeChange('')} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </span>
          )}
          {serviceFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-600">
              <i className="fas fa-concierge-bell text-[9px]"></i>
              {serviceFilter}
              <button onClick={() => onServiceChange('')} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
              &quot;{searchQuery}&quot;
              <button onClick={() => onSearchChange('')} className="hover:opacity-70 ml-0.5"><i className="fas fa-times text-[8px]"></i></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
