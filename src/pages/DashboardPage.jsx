import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fileUrl } from '../lib/fileUrl';
import Layout from '../components/layout/Layout';
import FileCard from '../components/dashboard/FileCard';
import FolderCard from '../components/dashboard/FolderCard';
import FolderRow from '../components/dashboard/FolderRow';
import Breadcrumbs from '../components/dashboard/Breadcrumbs';
import CreateFolderModal from '../components/dashboard/CreateFolderModal';
import MoveFolderModal from '../components/dashboard/MoveFolderModal';
import FilePreviewModal from '../components/dashboard/FilePreviewModal';
import FilePropertiesModal from '../components/dashboard/FilePropertiesModal';
import ContextMenu from '../components/dashboard/ContextMenu';
import { useFirestoreFiles } from '../hooks/useFirestoreFiles';
import { useFolders } from '../hooks/useFolders';
import { useFolderActions } from '../hooks/useFolderActions';
import { useTranscriptions } from '../hooks/useTranscriptions';
import { useAuth } from '../contexts/AuthContext';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: 'fa-clock', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-400', iconBg: 'bg-amber-100' },
  'in-progress': { label: 'In Progress', icon: 'fa-spinner', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', ring: 'ring-sky-400', iconBg: 'bg-sky-100' },
  transcribed: { label: 'Transcribed', icon: 'fa-check-circle', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-400', iconBg: 'bg-emerald-100' },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'size', label: 'Largest First' },
];

const USER_DASHBOARD_STATE_PREFIX = 'user-dashboard-state-v1';
const DASHBOARD_PAGE_SIZE = 18;

function getUserDashboardStateKey(userId) {
  return `${USER_DASHBOARD_STATE_PREFIX}:${userId}`;
}

function formatRelativeDate(dateString) {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '--';
  }
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(type) {
  if (!type) return 'fa-file';
  if (type.startsWith('image/')) return 'fa-image';
  if (type.startsWith('audio/')) return 'fa-music';
  if (type.startsWith('video/')) return 'fa-video';
  if (type === 'application/pdf') return 'fa-file-pdf';
  if (type.includes('word') || type === 'application/msword') return 'fa-file-word';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'fa-file-excel';
  if (type.includes('powerpoint') || type.includes('presentation')) return 'fa-file-powerpoint';
  if (type === 'text/plain' || type === 'text/csv') return 'fa-file-alt';
  return 'fa-file';
}

function getFileIconColor(type) {
  if (!type) return 'text-gray-400 bg-gray-50';
  if (type.startsWith('image/')) return 'text-violet-600 bg-violet-50';
  if (type.startsWith('audio/')) return 'text-sky-600 bg-sky-50';
  if (type.startsWith('video/')) return 'text-rose-500 bg-rose-50';
  if (type === 'application/pdf') return 'text-red-600 bg-red-50';
  if (type.includes('word') || type === 'application/msword') return 'text-blue-600 bg-blue-50';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'text-green-600 bg-green-50';
  if (type.includes('powerpoint') || type.includes('presentation')) return 'text-orange-600 bg-orange-50';
  return 'text-gray-400 bg-gray-50';
}

export default function DashboardPage() {
  const { user, isAdmin, getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState('files');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'grid';
    const saved = window.localStorage.getItem('user-dashboard-view-mode');
    return saved === 'list' ? 'list' : 'grid';
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusError, setStatusError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [propertiesFile, setPropertiesFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const dashboardStateHydratedRef = useRef(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMoveActive, setBulkMoveActive] = useState(false); // bulk move to folder

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

  // Folder state
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [moveTarget, setMoveTarget] = useState(null); // { type: 'file'|'folder', item }
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState(null);

  const { files: allFiles, loading, error } = useFirestoreFiles();
  const { folders: allFolders, loading: foldersLoading } = useFolders();
  const { createFolder, renameFolder, moveFolder, deleteFolder, moveFileToFolder } = useFolderActions();
  const { transcriptions, loading: transLoading, error: transError, fetchTranscriptions } = useTranscriptions();

  useEffect(() => {
    document.title = 'Dashboard - DigiScribe Transcription Corp.';
  }, []);

  useEffect(() => {
    if (activeTab === 'transcriptions') {
      fetchTranscriptions();
    }
  }, [activeTab, fetchTranscriptions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('user-dashboard-view-mode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    dashboardStateHydratedRef.current = false;
  }, [user?.uid]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.uid || dashboardStateHydratedRef.current) return;
    dashboardStateHydratedRef.current = true;

    try {
      const raw = window.localStorage.getItem(getUserDashboardStateKey(user.uid));
      if (!raw) return;
      const state = JSON.parse(raw);
      if (!state || typeof state !== 'object') return;

      if (state.viewMode === 'grid' || state.viewMode === 'list') setViewMode(state.viewMode);
      if (typeof state.statusFilter === 'string') setStatusFilter(state.statusFilter);
      if (typeof state.serviceFilter === 'string') setServiceFilter(state.serviceFilter);
      if (typeof state.sortBy === 'string') setSortBy(state.sortBy);
      if (typeof state.searchQuery === 'string') setSearchQuery(state.searchQuery);
      if (typeof state.currentFolderId === 'string' || state.currentFolderId === null) setCurrentFolderId(state.currentFolderId ?? null);
      if (Number.isInteger(state.currentPage) && state.currentPage > 0) setCurrentPage(state.currentPage);
    } catch {
      // Ignore malformed cache entries
    }
  }, [user?.uid]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.uid || !dashboardStateHydratedRef.current) return;
    const state = {
      viewMode,
      statusFilter,
      serviceFilter,
      sortBy,
      searchQuery,
      currentFolderId,
      currentPage,
      updatedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(getUserDashboardStateKey(user.uid), JSON.stringify(state));
    } catch {
      // Ignore storage quota/private mode errors
    }
  }, [user?.uid, viewMode, statusFilter, serviceFilter, sortBy, searchQuery, currentFolderId, currentPage]);

  // Compute counts (across ALL files, not just current folder)
  const counts = useMemo(() => {
    const result = { total: allFiles.length, pending: 0, 'in-progress': 0, transcribed: 0 };
    for (const file of allFiles) {
      if (result[file.status] !== undefined) result[file.status]++;
    }
    return result;
  }, [allFiles]);

  // Unique service categories
  const serviceCategories = useMemo(() => {
    const cats = new Set();
    for (const file of allFiles) {
      if (file.serviceCategory) cats.add(file.serviceCategory);
    }
    return Array.from(cats).sort();
  }, [allFiles]);

  // Files in current folder (or all files when searching/filtering)
  const currentFolderFiles = useMemo(() => {
    if (searchQuery.trim() || statusFilter || serviceFilter) return allFiles; // flatten when searching or any filter active
    return allFiles.filter((f) => (f.folderId || null) === currentFolderId);
  }, [allFiles, currentFolderId, searchQuery, statusFilter, serviceFilter]);

  // Subfolders of current folder
  const currentSubfolders = useMemo(() => {
    if (searchQuery.trim() || statusFilter || serviceFilter) return []; // hide folders when filtering
    return allFolders
      .filter((f) => (f.parentId || null) === currentFolderId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allFolders, currentFolderId, searchQuery, statusFilter, serviceFilter]);

  // Count items per folder (files + subfolders)
  const folderItemCounts = useMemo(() => {
    const counts = {};
    for (const f of allFiles) {
      const fid = f.folderId || null;
      if (fid) counts[fid] = (counts[fid] || 0) + 1;
    }
    for (const f of allFolders) {
      const pid = f.parentId || null;
      if (pid) counts[pid] = (counts[pid] || 0) + 1;
    }
    return counts;
  }, [allFiles, allFolders]);

  // Filter + sort (applies on current folder files)
  const filteredFiles = useMemo(() => {
    let result = [...currentFolderFiles];

    if (statusFilter) result = result.filter((f) => f.status === statusFilter);
    if (serviceFilter) result = result.filter((f) => f.serviceCategory === serviceFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((f) =>
        f.originalName && f.originalName.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'oldest': result.sort((a, b) => new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0)); break;
      case 'name-asc': result.sort((a, b) => (a.originalName || '').localeCompare(b.originalName || '')); break;
      case 'name-desc': result.sort((a, b) => (b.originalName || '').localeCompare(a.originalName || '')); break;
      case 'size': result.sort((a, b) => (b.size || 0) - (a.size || 0)); break;
      default: result.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)); break;
    }
    return result;
  }, [currentFolderFiles, statusFilter, serviceFilter, searchQuery, sortBy]);

  const totalFilePages = Math.max(1, Math.ceil(filteredFiles.length / DASHBOARD_PAGE_SIZE));
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * DASHBOARD_PAGE_SIZE;
    return filteredFiles.slice(startIndex, startIndex + DASHBOARD_PAGE_SIZE);
  }, [filteredFiles, currentPage]);

  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev < 1) return 1;
      if (prev > totalFilePages) return totalFilePages;
      return prev;
    });
  }, [totalFilePages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, serviceFilter, searchQuery, sortBy, currentFolderId]);

  const handleStatusChange = useCallback(async (fileId, newStatus) => {
    setStatusError(null);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/files/metadata/${fileId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status.');
    } catch (err) {
      setStatusError(err.message);
      setTimeout(() => setStatusError(null), 4000);
    }
  }, [getIdToken]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, serviceFilter, searchQuery, sortBy, currentFolderId]);

  // Selection helpers
  const filteredIds = useMemo(() => new Set(filteredFiles.map((f) => f.id)), [filteredFiles]);
  const pageFileIds = useMemo(() => new Set(paginatedFiles.map((f) => f.id)), [paginatedFiles]);
  const allSelected = paginatedFiles.length > 0 && paginatedFiles.every((f) => selectedIds.has(f.id));
  const someSelected = paginatedFiles.some((f) => selectedIds.has(f.id));
  const selectedCount = [...selectedIds].filter((id) => filteredIds.has(id)).length;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of pageFileIds) next.delete(id);
      } else {
        for (const id of pageFileIds) next.add(id);
      }
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Ctrl+A → select all files in current view
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && activeTab === 'files') {
        // Only intercept when not typing in an input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        e.preventDefault();
        if (paginatedFiles.length > 0) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const id of pageFileIds) next.add(id);
            return next;
          });
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeTab, paginatedFiles, pageFileIds]);

  // Bulk move to folder
  const handleBulkMove = useCallback(async (targetFolderId) => {
    const ids = [...selectedIds].filter((id) => filteredIds.has(id));
    if (ids.length === 0) return;
    setBulkLoading(true);
    setMessage(null);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/files/bulk-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileIds: ids, folderId: targetFolderId || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Move failed.');
      setMessage({ type: 'success', text: `Moved ${data.moved} file(s).` });
      setSelectedIds(new Set());
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkLoading(false);
      setBulkMoveActive(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [selectedIds, filteredIds, getIdToken]);

  // Folder download as ZIP
  const handleFolderDownload = useCallback(async (folder) => {
    setMessage(null);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/files/download-folder/${folder.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Download failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folder.name || 'folder'}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: `Downloading folder "${folder.name}" as ZIP.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  }, [getIdToken]);

  // Bulk download as zip
  const handleBulkDownload = useCallback(async () => {
    const ids = [...selectedIds].filter((id) => filteredIds.has(id));
    if (ids.length === 0) return;
    setBulkLoading(true);
    setMessage(null);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/files/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileIds: ids }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Download failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `digiscribe-files-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: `Downloaded ${ids.length} file(s).` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [selectedIds, filteredIds, getIdToken]);

  // Copy file URL to clipboard
  const copyFileUrl = useCallback((file) => {
    const url = fileUrl(file.url);
    navigator.clipboard.writeText(url).then(
      () => { setMessage({ type: 'success', text: 'URL copied to clipboard.' }); setTimeout(() => setMessage(null), 2000); },
      () => { setMessage({ type: 'error', text: 'Failed to copy URL.' }); }
    );
  }, []);

  // Folder actions
  const handleCreateFolder = useCallback(async (name, parentId) => {
    await createFolder(name, parentId);
    setMessage({ type: 'success', text: `Folder "${name}" created.` });
    setTimeout(() => setMessage(null), 3000);
  }, [createFolder]);

  const handleRenameFolder = useCallback(async (folderId, newName) => {
    try {
      await renameFolder(folderId, newName);
      setMessage({ type: 'success', text: 'Folder renamed.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setRenamingFolder(null);
  }, [renameFolder]);

  const handleDeleteFolder = useCallback(async (folderId) => {
    try {
      await deleteFolder(folderId);
      setMessage({ type: 'success', text: 'Folder deleted. Contents moved to parent.' });
      setTimeout(() => setMessage(null), 3000);
      // If we're inside the deleted folder, navigate to parent
      if (currentFolderId === folderId) {
        const folder = allFolders.find((f) => f.id === folderId);
        setCurrentFolderId(folder?.parentId || null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setDeleteFolderConfirm(null);
  }, [deleteFolder, currentFolderId, allFolders]);

  // Drag and drop handler
  const handleDrop = useCallback(async (e, targetFolderId) => {
    setDragOverFolder(null);
    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json'));
      if (payload.type === 'file') {
        await moveFileToFolder(payload.id, targetFolderId);
        setMessage({ type: 'success', text: 'File moved.' });
      } else if (payload.type === 'folder') {
        if (payload.id === targetFolderId) return;
        await moveFolder(payload.id, targetFolderId);
        setMessage({ type: 'success', text: 'Folder moved.' });
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }, [moveFileToFolder, moveFolder]);

  // Move modal handler
  const handleMoveConfirm = useCallback(async (targetFolderId) => {
    if (!moveTarget) return;
    try {
      if (moveTarget.type === 'file') {
        await moveFileToFolder(moveTarget.item.id, targetFolderId);
        setMessage({ type: 'success', text: 'File moved.' });
      } else {
        await moveFolder(moveTarget.item.id, targetFolderId);
        setMessage({ type: 'success', text: 'Folder moved.' });
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setMoveTarget(null);
  }, [moveTarget, moveFileToFolder, moveFolder]);

  // Get descendant folder IDs (for excluding from move targets)
  const getDescendantIds = useCallback((folderId) => {
    const ids = new Set([folderId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of allFolders) {
        if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
          ids.add(f.id);
          changed = true;
        }
      }
    }
    return [...ids];
  }, [allFolders]);

  // Right-click handler for files
  const handleFileContextMenu = useCallback((e, file) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file, type: 'file' });
  }, []);

  // Right-click handler for folders
  const handleFolderContextMenu = useCallback((e, folder) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, folder, type: 'folder' });
  }, []);

  const contextMenuItems = useMemo(() => {
    if (!contextMenu) return [];

    if (contextMenu.type === 'folder') {
      const folder = contextMenu.folder;
      return [
        { icon: 'fa-folder-open', label: 'Open', onClick: () => setCurrentFolderId(folder.id) },
        { icon: 'fa-pencil-alt', label: 'Rename', onClick: () => {
          setRenamingFolder(folder.id);
          setRenameValue(folder.name);
        }},
        { icon: 'fa-arrows-alt', label: 'Move to...', onClick: () => setMoveTarget({ type: 'folder', item: folder }) },
        { icon: 'fa-file-archive', label: 'Download as ZIP', onClick: () => handleFolderDownload(folder) },
        { divider: true },
        { icon: 'fa-trash-alt', label: 'Delete Folder', danger: true, onClick: () => setDeleteFolderConfirm(folder.id) },
      ];
    }

    const file = contextMenu.file;
    const isUrl = file.sourceType === 'url';
    const items = [
      { icon: 'fa-eye', label: 'Preview', onClick: () => setPreviewFile(file) },
      {
        icon: 'fa-download',
        label: 'Download',
        disabled: isUrl,
        onClick: isUrl ? () => {} : () => {
          const a = document.createElement('a');
          a.href = fileUrl(file.url);
          a.download = file.originalName;
          document.body.appendChild(a);
          a.click();
          a.remove();
        },
      },
      { icon: 'fa-copy', label: 'Copy URL', shortcut: 'Ctrl+C', onClick: () => copyFileUrl(file) },
      { divider: true },
      { icon: 'fa-folder-open', label: 'Move to Folder...', onClick: () => setMoveTarget({ type: 'file', item: file }) },
      { icon: 'fa-check-square', label: selectedIds.has(file.id) ? 'Deselect' : 'Select', onClick: () => toggleSelect(file.id) },
      { divider: true },
      { icon: 'fa-info-circle', label: 'Properties', onClick: () => setPropertiesFile(file) },
    ];

    // When multiple files are selected, add bulk actions
    const selCount = [...selectedIds].filter((id) => filteredIds.has(id)).length;
    if (selCount > 1) {
      items.push({ divider: true });
      items.push({ icon: 'fa-arrows-alt', label: `Move ${selCount} Selected to Folder...`, onClick: () => setBulkMoveActive(true) });
      items.push({ icon: 'fa-times-circle', label: 'Deselect All', onClick: () => setSelectedIds(new Set()) });
    }

    return items;
  }, [contextMenu, selectedIds, filteredIds, copyFileUrl, handleFolderDownload]);

  const clearFilters = () => {
    setStatusFilter('');
    setServiceFilter('');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter || serviceFilter || searchQuery;
  const isSearching = searchQuery.trim().length > 0;
  const totalItems = currentSubfolders.length + filteredFiles.length;

  const heroContent = (
    <div className="relative z-10 py-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold gradient-text">
              Dashboard
            </h1>
            <p className="text-sm text-gray-text mt-1">
              Welcome back, {user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-dark-text hover:bg-gray-50 transition-all duration-300 inline-flex items-center gap-2"
            >
              <i className="fas fa-folder-plus text-xs text-indigo-500"></i>
              New Folder
            </button>
            <Link
              to="/upload"
              className="btn-gradient text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 inline-flex items-center gap-2"
            >
              <i className="fas fa-plus text-xs"></i>
              New Upload
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

          {activeTab === 'files' ? (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <button
                  onClick={() => { setStatusFilter(''); }}
                  className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                    !statusFilter ? 'border-primary/30 shadow-sm ring-1 ring-primary/10' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-text uppercase tracking-wide">Total</p>
                      <p className="text-2xl font-bold text-dark-text mt-1">{counts.total}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <i className="fas fa-layer-group text-primary"></i>
                    </div>
                  </div>
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter((prev) => prev === key ? '' : key)}
                    className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                      statusFilter === key ? `${cfg.border} shadow-sm ring-1 ${cfg.ring}/20` : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-text uppercase tracking-wide">{cfg.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${cfg.text}`}>{counts[key]}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${cfg.iconBg} flex items-center justify-center`}>
                        <i className={`fas ${cfg.icon} ${cfg.text}`}></i>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Messages */}
              {message && (
                <div
                  className={`mb-4 p-3 rounded-xl border flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                  }`}
                >
                  <i className={`fas ${message.type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'}`}></i>
                  <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {message.text}
                  </p>
                </div>
              )}

              {statusError && (
                <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <p className="text-sm font-medium text-red-700">{statusError}</p>
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                  <i className="fas fa-exclamation-triangle text-red-500"></i>
                  <p className="text-sm font-medium text-red-700">Error loading files: {error}</p>
                </div>
              )}

              {/* Breadcrumbs */}
              <Breadcrumbs
                folders={allFolders}
                currentFolderId={currentFolderId}
                onNavigate={setCurrentFolderId}
              />

              {/* Filter Bar */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by file name..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    )}
                  </div>

                  {serviceCategories.length > 0 && (
                    <div className="relative">
                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-w-[180px]"
                      >
                        <option value="">All Services</option>
                        {serviceCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
                    </div>
                  )}

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-w-[150px]"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
                  </div>

                  <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 self-start">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                        viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-text hover:text-dark-text'
                      }`}
                    >
                      <i className="fas fa-th-large text-[10px]"></i>
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                        viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-text hover:text-dark-text'
                      }`}
                    >
                      <i className="fas fa-list text-[10px]"></i>
                      List
                    </button>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-text hover:text-dark-text hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <i className="fas fa-times text-xs"></i>
                      Clear
                    </button>
                  )}
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Showing:</span>
                    {statusFilter && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_CONFIG[statusFilter].bg} ${STATUS_CONFIG[statusFilter].text}`}>
                        {STATUS_CONFIG[statusFilter].label}
                        <button onClick={() => setStatusFilter('')} className="hover:opacity-70"><i className="fas fa-times text-[8px]"></i></button>
                      </span>
                    )}
                    {serviceFilter && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-600">
                        {serviceFilter}
                        <button onClick={() => setServiceFilter('')} className="hover:opacity-70"><i className="fas fa-times text-[8px]"></i></button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                        &quot;{searchQuery}&quot;
                        <button onClick={() => setSearchQuery('')} className="hover:opacity-70"><i className="fas fa-times text-[8px]"></i></button>
                      </span>
                    )}
                    {isSearching && (
                      <span className="text-xs text-gray-400 ml-1">
                        Searching across all folders &middot; {filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {!isSearching && (statusFilter || serviceFilter) && (
                      <span className="text-xs text-gray-400 ml-1">
                        Showing across all folders &middot; {filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {!isSearching && !statusFilter && !serviceFilter && (
                      <span className="text-xs text-gray-400 ml-1">
                        {filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bulk action bar */}
              {selectedCount > 0 && (
                <div className="bg-white rounded-xl border border-primary/20 p-3 mb-6 shadow-sm flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <i className="fas fa-check-double text-primary text-xs"></i>
                    </div>
                    <span className="text-sm font-medium text-dark-text">
                      {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={handleBulkDownload}
                      disabled={bulkLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {bulkLoading ? <i className="fas fa-spinner fa-spin text-[10px]"></i> : <i className="fas fa-download text-[10px]"></i>}
                      Download ZIP
                    </button>
                    <button
                      onClick={() => setBulkMoveActive(true)}
                      disabled={bulkLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      <i className="fas fa-folder-open text-[10px]"></i>
                      Move to Folder
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-dark-text hover:bg-gray-50 transition-colors"
                    >
                      <i className="fas fa-times text-[10px]"></i>
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Select All bar */}
              {filteredFiles.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={toggleSelectAll}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-text hover:text-dark-text hover:bg-white border border-gray-200 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      readOnly
                      className="w-3.5 h-3.5 rounded border-gray-300 text-primary pointer-events-none"
                    />
                    {allSelected ? 'Deselect All' : 'Select All'}
                    <span className="text-gray-300 font-mono text-[9px]">Ctrl+A</span>
                  </button>
                  <span className="text-xs text-gray-400">
                    {currentSubfolders.length > 0 && `${currentSubfolders.length} folder${currentSubfolders.length !== 1 ? 's' : ''}, `}
                    {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Delete folder confirmation */}
              {deleteFolderConfirm && (
                <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3 flex-wrap">
                  <i className="fas fa-exclamation-triangle text-red-500"></i>
                  <span className="text-sm font-medium text-red-700">
                    Delete this folder? Contents will be moved to the parent folder.
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleDeleteFolder(deleteFolderConfirm)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteFolderConfirm(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-dark-text hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Content */}
              {loading || foldersLoading ? (
                <div className="text-center py-24">
                  <i className="fas fa-spinner fa-spin text-3xl text-primary mb-4 block"></i>
                  <p className="text-sm text-gray-text">Loading your files...</p>
                </div>
              ) : totalItems === 0 && !hasActiveFilters ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className={`fas ${currentFolderId ? 'fa-folder-open' : 'fa-cloud-upload-alt'} text-primary text-xl`}></i>
                  </div>
                  <p className="text-sm font-medium text-dark-text">
                    {currentFolderId ? 'This folder is empty' : 'No files uploaded yet'}
                  </p>
                  <p className="text-xs text-gray-text mt-1 mb-5">
                    {currentFolderId
                      ? 'Drag files here or upload new ones.'
                      : 'Upload your first file to get started.'}
                  </p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => setShowCreateFolder(true)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <i className="fas fa-folder-plus text-xs"></i>
                      Create Folder
                    </button>
                    <Link
                      to="/upload"
                      className="inline-flex items-center gap-2 btn-gradient text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                    >
                      <i className="fas fa-plus text-xs"></i>
                      Upload Files
                    </Link>
                  </div>
                </div>
              ) : filteredFiles.length === 0 && currentSubfolders.length === 0 && hasActiveFilters ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-search text-primary text-xl"></i>
                  </div>
                  <p className="text-sm font-medium text-dark-text">No files match your filters</p>
                  <p className="text-xs text-gray-text mt-1 mb-5">Try adjusting your search or filters.</p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    <i className="fas fa-times text-xs"></i>
                    Clear all filters
                  </button>
                </div>
              ) : viewMode === 'list' ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-center px-3 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                            />
                          </th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">File</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">Type</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">Date</th>
                          <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider w-36">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {currentSubfolders.map((folder) => {
                          if (renamingFolder === folder.id) {
                            return (
                              <tr key={folder.id} className="bg-primary/[0.03]">
                                <td colSpan={6} className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-500">
                                      <i className="fas fa-folder text-xs"></i>
                                    </div>
                                    <form
                                      className="flex-1 flex items-center gap-2"
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        if (renameValue.trim()) handleRenameFolder(folder.id, renameValue.trim());
                                      }}
                                    >
                                      <input
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        autoFocus
                                        className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        onBlur={() => setRenamingFolder(null)}
                                        onKeyDown={(e) => { if (e.key === 'Escape') setRenamingFolder(null); }}
                                      />
                                      <button type="submit" className="text-primary hover:text-primary-dark">
                                        <i className="fas fa-check text-sm"></i>
                                      </button>
                                    </form>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <FolderRow
                              key={folder.id}
                              folder={folder}
                              onOpen={(id) => setCurrentFolderId(id)}
                              onContextMenu={handleFolderContextMenu}
                              isSelected={false}
                              onSelect={() => {}}
                              isDragOver={dragOverFolder === folder.id}
                              onDragOver={setDragOverFolder}
                              onDragLeave={() => setDragOverFolder(null)}
                              onDrop={handleDrop}
                              itemCount={folderItemCounts[folder.id] || 0}
                            />
                          );
                        })}

                        {paginatedFiles.map((file) => {
                          const cfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
                          const isSelected = selectedIds.has(file.id);
                          const isUrl = file.sourceType === 'url';
                          return (
                            <tr
                              key={file.id}
                              className={`transition-colors ${isSelected ? 'bg-primary/[0.03]' : 'hover:bg-gray-50/50'}`}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'file', id: file.id }));
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onContextMenu={(e) => handleFileContextMenu(e, file)}
                            >
                              <td className="text-center px-3 py-3.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(file.id)}
                                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFile(file)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileIconColor(file.type)} hover:scale-105 transition-transform cursor-pointer`}
                                    title="Preview file"
                                  >
                                    <i className={`fas ${getFileIcon(file.type)} text-xs`}></i>
                                  </button>
                                  <div className="min-w-0">
                                    <span
                                      className="text-sm font-medium text-dark-text truncate block max-w-[280px] cursor-pointer hover:text-primary transition-colors"
                                      title={file.originalName}
                                      onClick={() => setPreviewFile(file)}
                                    >
                                      {file.originalName}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-gray-400">{formatSize(file.size)}</span>
                                      {file.serviceCategory && (
                                        <span className="text-[10px] text-indigo-500">• {file.serviceCategory}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-xs text-gray-text">
                                  {file.type ? file.type.split('/')[1]?.toUpperCase() || file.type : '--'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                  <i className={`fas ${cfg.icon} text-[9px]`}></i>
                                  {cfg.label}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-sm text-gray-text">{formatRelativeDate(file.uploadedAt)}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFile(file)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                    title="Preview file"
                                  >
                                    <i className="fas fa-eye text-[10px]"></i>
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isUrl) return;
                                      const a = document.createElement('a');
                                      a.href = fileUrl(file.url);
                                      a.download = file.originalName;
                                      document.body.appendChild(a);
                                      a.click();
                                      a.remove();
                                    }}
                                    disabled={isUrl}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={isUrl ? 'URL uploads cannot be downloaded from here' : 'Download file'}
                                  >
                                    <i className="fas fa-download text-[10px]"></i>
                                    Download
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                  onDragOver={(e) => {
                    // Allow drop on the grid background (move to current folder)
                    if (e.target === e.currentTarget) {
                      e.preventDefault();
                    }
                  }}
                  onDrop={(e) => {
                    if (e.target === e.currentTarget) {
                      e.preventDefault();
                      handleDrop(e, currentFolderId);
                    }
                  }}
                >
                  {/* Folders first */}
                  {currentSubfolders.map((folder) => {
                    // Inline rename
                    if (renamingFolder === folder.id) {
                      return (
                        <div key={folder.id} className="bg-white rounded-xl border border-primary/30 p-5 ring-2 ring-primary/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-500">
                              <i className="fas fa-folder text-lg"></i>
                            </div>
                            <form
                              className="flex-1 flex items-center gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (renameValue.trim()) handleRenameFolder(folder.id, renameValue.trim());
                              }}
                            >
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                autoFocus
                                className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onBlur={() => setRenamingFolder(null)}
                                onKeyDown={(e) => { if (e.key === 'Escape') setRenamingFolder(null); }}
                              />
                              <button type="submit" className="text-primary hover:text-primary-dark">
                                <i className="fas fa-check text-sm"></i>
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onOpen={(id) => setCurrentFolderId(id)}
                        onContextMenu={handleFolderContextMenu}
                        isDragOver={dragOverFolder === folder.id}
                        onDragOver={setDragOverFolder}
                        onDragLeave={() => setDragOverFolder(null)}
                        onDrop={handleDrop}
                        itemCount={folderItemCounts[folder.id] || 0}
                      />
                    );
                  })}

                  {/* Then files */}
                  {paginatedFiles.map((file) => {
                    const isSelected = selectedIds.has(file.id);
                    return (
                      <div
                        key={file.id}
                        className={`relative transition-all ${isSelected ? 'ring-2 ring-primary/30 rounded-xl' : ''}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'file', id: file.id }));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onContextMenu={(e) => handleFileContextMenu(e, file)}
                      >
                        <div className="absolute top-3 left-3 z-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(file.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer shadow-sm"
                          />
                        </div>
                        <FileCard
                          file={file}
                          isAdmin={isAdmin}
                          onStatusChange={handleStatusChange}
                          onPreview={setPreviewFile}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredFiles.length > 0 && totalFilePages > 1 && (
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">
                    Page {currentPage} of {totalFilePages} &middot; Showing {paginatedFiles.length} of {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
                  </p>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-chevron-left text-[10px]"></i>
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalFilePages, p + 1))}
                      disabled={currentPage >= totalFilePages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <i className="fas fa-chevron-right text-[10px]"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Transcriptions Tab */
            <>
              {transError && (
                <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <p className="text-sm font-medium text-red-700">{transError}</p>
                  <button onClick={() => fetchTranscriptions()} className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5">
                    <i className="fas fa-sync-alt text-xs"></i>
                    Retry
                  </button>
                </div>
              )}

              {transLoading ? (
                <div className="text-center py-24">
                  <i className="fas fa-spinner fa-spin text-3xl text-primary mb-4 block"></i>
                  <p className="text-sm text-gray-text">Loading transcriptions...</p>
                </div>
              ) : transcriptions.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-file-lines text-primary text-xl"></i>
                  </div>
                  <p className="text-sm font-medium text-dark-text">No transcriptions yet</p>
                  <p className="text-xs text-gray-text mt-1">
                    When your uploaded files are transcribed, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transcriptions.map((t) => (
                    <Link
                      key={t.id}
                      to={`/transcriptions/${t.id}`}
                      className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          t.deliveryType === 'file' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <i className={`fas ${t.deliveryType === 'file' ? 'fa-file-audio' : 'fa-file-alt'} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-dark-text truncate">
                            {t.title || t.fileName || 'Untitled Transcription'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            {t.fileName && (
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <i className="fas fa-paperclip text-[9px]"></i>
                                {t.fileName}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <i className="fas fa-clock text-[9px]"></i>
                              {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              t.deliveryType === 'file' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              <i className={`fas ${t.deliveryType === 'file' ? 'fa-download' : 'fa-align-left'} text-[8px]`}></i>
                              {t.deliveryType === 'file' ? 'File' : 'Text'}
                            </span>
                          </div>
                          {t.deliveryType === 'text' && t.content && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                              {t.content}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-gray-300">
                          <i className="fas fa-chevron-right text-xs"></i>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Properties Modal */}
      {propertiesFile && (
        <FilePropertiesModal file={propertiesFile} onClose={() => setPropertiesFile(null)} />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreateFolder={handleCreateFolder}
        parentFolderId={currentFolderId}
      />

      {/* Move Modal */}
      {moveTarget && (
        <MoveFolderModal
          isOpen={true}
          onClose={() => setMoveTarget(null)}
          onSelect={handleMoveConfirm}
          folders={allFolders}
          excludeIds={moveTarget.type === 'folder' ? getDescendantIds(moveTarget.item.id) : []}
          title={moveTarget.type === 'file' ? `Move "${moveTarget.item.originalName}"` : `Move "${moveTarget.item.name}"`}
        />
      )}

      {/* Bulk Move Modal */}
      {bulkMoveActive && (
        <MoveFolderModal
          isOpen={true}
          onClose={() => setBulkMoveActive(false)}
          onSelect={handleBulkMove}
          folders={allFolders}
          excludeIds={[]}
          title={`Move ${selectedCount} selected file${selectedCount !== 1 ? 's' : ''} to folder`}
        />
      )}
    </Layout>
  );
}
