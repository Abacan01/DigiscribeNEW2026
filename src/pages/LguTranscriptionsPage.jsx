import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useTranscriptions } from '../hooks/useTranscriptions';

function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return '--';
  }
}

function formatRelativeDate(dateString) {
  if (!dateString) return '--';
  try {
    const d = new Date(dateString);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return '--';
  }
}

function getFileIcon(fileType) {
  if (!fileType) return 'fa-file-alt';
  if (fileType.startsWith('audio/')) return 'fa-file-audio';
  if (fileType.startsWith('video/')) return 'fa-file-video';
  if (fileType.startsWith('image/')) return 'fa-file-image';
  return 'fa-file-alt';
}

function getFileIconColor(fileType) {
  if (!fileType) return 'text-violet-600 bg-violet-50';
  if (fileType.startsWith('audio/')) return 'text-sky-600 bg-sky-50';
  if (fileType.startsWith('video/')) return 'text-rose-500 bg-rose-50';
  if (fileType.startsWith('image/')) return 'text-emerald-600 bg-emerald-50';
  return 'text-violet-600 bg-violet-50';
}

export default function LguTranscriptionsPage() {
  const { transcriptions, loading, error, fetchTranscriptions } = useTranscriptions();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'Transcriptions - DigiScribe';
  }, []);

  useEffect(() => {
    fetchTranscriptions({});
  }, [fetchTranscriptions]);

  const filteredTranscriptions = useMemo(() => {
    if (!searchQuery.trim()) return transcriptions;
    const q = searchQuery.toLowerCase().trim();
    return transcriptions.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.fileName && t.fileName.toLowerCase().includes(q)) ||
        (t.createdByEmail && t.createdByEmail.toLowerCase().includes(q))
    );
  }, [transcriptions, searchQuery]);

  const handleRefresh = () => {
    fetchTranscriptions({});
  };

  const hasActiveFilters = searchQuery.trim().length > 0;

  const heroContent = (
    <div className="relative z-10 py-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold gradient-text">Transcriptions</h1>
            <p className="text-sm text-gray-text mt-1">
              {loading
                ? 'Loading transcriptions...'
                : `${transcriptions.length} transcription${transcriptions.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-text hover:text-primary transition-colors"
            >
              <i className="fas fa-arrow-left text-xs"></i>
              Back to Dashboard
            </Link>
            <Link
              to="/admin/dashboard"
              className="btn-gradient text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all inline-flex items-center gap-2"
            >
              <i className="fas fa-plus text-xs"></i>
              Create New
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout heroContent={heroContent}>
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {/* Error State */}
            {error && (
              <div className="bg-white rounded-xl border border-gray-100 p-8">
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={handleRefresh}
                    className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center gap-1.5 mx-auto"
                  >
                    <i className="fas fa-sync-alt text-xs"></i>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, file name, or author email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  )}
                </div>

                {/* Refresh */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-text hover:text-primary hover:bg-primary/5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  <i className={`fas fa-sync-alt text-xs ${loading ? 'fa-spin' : ''}`}></i>
                  Refresh
                </button>

                {/* Clear */}
                {hasActiveFilters && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-text hover:text-dark-text hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <i className="fas fa-times text-xs"></i>
                    Clear
                  </button>
                )}
              </div>

              {/* Active filter info */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Showing:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                    &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} className="hover:opacity-70">
                      <i className="fas fa-times text-[8px]"></i>
                    </button>
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    {filteredTranscriptions.length} of {transcriptions.length} transcription{transcriptions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-24">
                <i className="fas fa-spinner fa-spin text-3xl text-primary mb-4 block"></i>
                <p className="text-sm text-gray-text">Loading transcriptions...</p>
              </div>
            ) : transcriptions.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-file-alt text-primary text-xl"></i>
                </div>
                <p className="text-sm font-medium text-dark-text">No transcriptions yet</p>
                <p className="text-xs text-gray-text mt-1 mb-5">
                  Transcriptions for uploaded files will appear here.
                </p>
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-2 btn-gradient text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                >
                  <i className="fas fa-plus text-xs"></i>
                  Create Transcription
                </Link>
              </div>
            ) : filteredTranscriptions.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-primary text-xl"></i>
                </div>
                <p className="text-sm font-medium text-dark-text">No transcriptions match your search</p>
                <p className="text-xs text-gray-text mt-1 mb-4">Try adjusting your search query.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">
                          Transcription Title
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">
                          Created
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider w-24">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredTranscriptions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileIconColor(t.fileType)}`}
                              >
                                <i className={`fas ${getFileIcon(t.fileType)} text-xs`}></i>
                              </div>
                              <span
                                className="text-sm font-medium text-dark-text truncate max-w-[200px]"
                                title={t.fileName || t.fileId}
                              >
                                {t.fileName || t.fileId || '--'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm text-dark-text truncate block max-w-[220px]" title={t.title}>
                              {t.title || 'Untitled'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm text-gray-text" title={formatDate(t.createdAt)}>
                              {formatDate(t.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm text-gray-text">{t.createdByEmail || '--'}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Link
                              to={`/admin/transcriptions/${t.fileId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-primary hover:bg-primary/5 transition-colors"
                            >
                              <i className="fas fa-external-link-alt text-[10px]"></i>
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-3">
                  {filteredTranscriptions.map((t) => (
                    <Link
                      key={t.id}
                      to={`/admin/transcriptions/${t.fileId}`}
                      className="block p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileIconColor(t.fileType)}`}
                        >
                          <i className={`fas ${getFileIcon(t.fileType)} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-text truncate">
                            {t.title || 'Untitled'}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {t.fileName || t.fileId || '--'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 mt-1.5">
                            <span>
                              <i className="fas fa-user mr-1 text-[9px]"></i>
                              {t.createdByEmail || '--'}
                            </span>
                            <span>
                              <i className="fas fa-calendar mr-1 text-[9px]"></i>
                              {formatRelativeDate(t.createdAt)}
                            </span>
                          </div>
                        </div>
                        <i className="fas fa-chevron-right text-gray-300 text-xs mt-1"></i>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
