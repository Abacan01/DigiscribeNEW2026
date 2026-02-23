import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fileUrl } from '../lib/fileUrl';
import Layout from '../components/layout/Layout';
import FolderRow from '../components/dashboard/FolderRow';
import FolderCard from '../components/dashboard/FolderCard';
import FileCard from '../components/dashboard/FileCard';
import Breadcrumbs from '../components/dashboard/Breadcrumbs';
import CreateFolderModal from '../components/dashboard/CreateFolderModal';
import MoveFolderModal from '../components/dashboard/MoveFolderModal';
import FilePreviewModal from '../components/dashboard/FilePreviewModal';
import FilePropertiesModal from '../components/dashboard/FilePropertiesModal';
import ContextMenu from '../components/dashboard/ContextMenu';
import CreateUserForm from '../components/admin/CreateUserForm';
import UserTable from '../components/admin/UserTable';
import { useFirestoreFiles } from '../hooks/useFirestoreFiles';
import { useFolders } from '../hooks/useFolders';
import { useFolderActions } from '../hooks/useFolderActions';
import { useTranscriptions } from '../hooks/useTranscriptions';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAuth } from '../contexts/AuthContext';

const TABS = [
  { id: 'files', label: 'Files', icon: 'fa-folder-open' },
  { id: 'users', label: 'Users', icon: 'fa-users-gear' },
];

const STATUS_OPTIONS = ['pending', 'in-progress', 'transcribed'];

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: 'fa-clock',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    ring: 'ring-amber-400',
    iconBg: 'bg-amber-100',
    dot: 'bg-amber-400',
  },
  'in-progress': {
    label: 'In Progress',
    icon: 'fa-spinner',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    border: 'border-sky-200',
    ring: 'ring-sky-400',
    iconBg: 'bg-sky-100',
    dot: 'bg-sky-400',
  },
  transcribed: {
    label: 'Transcribed',
    icon: 'fa-check-circle',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    ring: 'ring-emerald-400',
    iconBg: 'bg-emerald-100',
    dot: 'bg-emerald-400',
  },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'size', label: 'Largest First' },
];

function formatSize(bytes) {
  if (!bytes) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatRelativeDate(dateString) {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return '--';
  }
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

const PLATFORM_MAP = [
  { pattern: /youtu\.?be/i, label: 'YouTube', icon: 'fa-youtube', color: 'text-red-600 bg-red-50' },
  { pattern: /facebook\.com|fb\.com/i, label: 'Facebook', icon: 'fa-facebook-f', color: 'text-blue-600 bg-blue-50' },
  { pattern: /instagram\.com/i, label: 'Instagram', icon: 'fa-instagram', color: 'text-pink-600 bg-pink-50' },
  { pattern: /tiktok\.com/i, label: 'TikTok', icon: 'fa-tiktok', color: 'text-gray-900 bg-gray-100' },
  { pattern: /twitter\.com|x\.com/i, label: 'Twitter/X', icon: 'fa-x-twitter', color: 'text-gray-800 bg-gray-100' },
  { pattern: /vimeo\.com/i, label: 'Vimeo', icon: 'fa-vimeo-v', color: 'text-sky-600 bg-sky-50' },
  { pattern: /soundcloud\.com/i, label: 'SoundCloud', icon: 'fa-soundcloud', color: 'text-orange-600 bg-orange-50' },
  { pattern: /twitch\.tv/i, label: 'Twitch', icon: 'fa-twitch', color: 'text-violet-600 bg-violet-50' },
];

function getUrlPlatform(sourceUrl) {
  if (!sourceUrl) return { label: 'URL', icon: 'fa-link', color: 'text-gray-600 bg-gray-100' };
  return PLATFORM_MAP.find((p) => p.pattern.test(sourceUrl)) || { label: 'URL', icon: 'fa-link', color: 'text-gray-600 bg-gray-100' };
}

/* ─────────────────────────── Files Tab ─────────────────────────── */

function FilesTab({ allFiles, allFolders, filesLoading, filesError, foldersLoading, folderActions }) {
  const { getIdToken } = useAuth();
  const { createFolder, renameFolder, moveFolder, deleteFolder, moveFileToFolder } = folderActions;

  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'list';
    const saved = window.localStorage.getItem('admin-dashboard-view-mode');
    return saved === 'grid' ? 'grid' : 'list';
  });
  const [message, setMessage] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [propertiesFile, setPropertiesFile] = useState(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMoveActive, setBulkMoveActive] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState(null); // status to apply in bulk

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

  // Folder state
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [moveTarget, setMoveTarget] = useState(null);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState(null);

  // File rename state
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renameFileValue, setRenameFileValue] = useState('');
  const [renameFileExt, setRenameFileExt] = useState('');

  // Compute counts (across ALL files)
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
    if (searchQuery.trim() || statusFilter || serviceFilter) return allFiles;
    return allFiles.filter((f) => (f.folderId || null) === currentFolderId);
  }, [allFiles, currentFolderId, searchQuery, statusFilter, serviceFilter]);

  // Subfolders
  const currentSubfolders = useMemo(() => {
    if (searchQuery.trim() || statusFilter || serviceFilter) return [];
    return allFolders
      .filter((f) => (f.parentId || null) === currentFolderId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allFolders, currentFolderId, searchQuery, statusFilter, serviceFilter]);

  // Item counts per folder
  const folderItemCounts = useMemo(() => {
    const c = {};
    for (const f of allFiles) {
      const fid = f.folderId || null;
      if (fid) c[fid] = (c[fid] || 0) + 1;
    }
    for (const f of allFolders) {
      const pid = f.parentId || null;
      if (pid) c[pid] = (c[pid] || 0) + 1;
    }
    return c;
  }, [allFiles, allFolders]);

  // Filter + sort
  const filteredFiles = useMemo(() => {
    let result = [...currentFolderFiles];

    if (statusFilter) result = result.filter((f) => f.status === statusFilter);
    if (serviceFilter) result = result.filter((f) => f.serviceCategory === serviceFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) => f.originalName && f.originalName.toLowerCase().includes(q)
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

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, serviceFilter, searchQuery, sortBy, currentFolderId]);

  // Selection helpers
  const filteredIds = useMemo(() => new Set(filteredFiles.map((f) => f.id)), [filteredFiles]);
  const allSelected = filteredFiles.length > 0 && filteredFiles.every((f) => selectedIds.has(f.id));
  const someSelected = filteredFiles.some((f) => selectedIds.has(f.id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = useCallback(async (fileId, newStatus) => {
    setStatusLoading(fileId);
    setMessage(null);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/files/metadata/${fileId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status.');
      setMessage({ type: 'success', text: 'Status updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setStatusLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [getIdToken]);

  const handleDeleteFile = useCallback(async (fileId) => {
    setDeleteLoading(fileId);
    setMessage(null);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/files/metadata/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete file.');
      setMessage({ type: 'success', text: 'File deleted.' });
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(fileId); return next; });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleteLoading(null);
      setDeleteConfirm(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [getIdToken]);

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

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds].filter((id) => filteredIds.has(id));
    if (ids.length === 0) return;
    setBulkLoading(true);
    setMessage(null);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/files/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileIds: ids }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Bulk delete failed.');
      setMessage({ type: 'success', text: `Deleted ${data.deleted} file(s).` });
      setSelectedIds(new Set());
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkLoading(false);
      setBulkDeleteConfirm(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [selectedIds, filteredIds, getIdToken]);

  const copyFileUrl = useCallback((file) => {
    const url = fileUrl(file.url);
    navigator.clipboard.writeText(url).then(
      () => { setMessage({ type: 'success', text: 'URL copied to clipboard.' }); setTimeout(() => setMessage(null), 2000); },
      () => { setMessage({ type: 'error', text: 'Failed to copy URL.' }); }
    );
  }, []);

  // Folder action handlers
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

  const handleRenameFile = useCallback(async (fileId, newName) => {
    if (!newName.trim()) return;
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/files/metadata/${fileId}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Rename failed.');
      setMessage({ type: 'success', text: 'File renamed.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setRenamingFileId(null);
  }, [getIdToken]);

  const handleDeleteFolder = useCallback(async (folderId) => {
    try {
      await deleteFolder(folderId);
      setMessage({ type: 'success', text: 'Folder deleted. Contents moved to parent.' });
      setTimeout(() => setMessage(null), 3000);
      if (currentFolderId === folderId) {
        const folder = allFolders.find((f) => f.id === folderId);
        setCurrentFolderId(folder?.parentId || null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setDeleteFolderConfirm(null);
  }, [deleteFolder, currentFolderId, allFolders]);

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

  // Bulk status change
  const handleBulkStatus = useCallback(async (newStatus) => {
    const ids = [...selectedIds].filter((id) => filteredIds.has(id));
    if (ids.length === 0) return;
    setBulkLoading(true);
    setMessage(null);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/files/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileIds: ids, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Status change failed.');
      setMessage({ type: 'success', text: `Updated ${data.updated} file(s) to "${newStatus}".` });
      setSelectedIds(new Set());
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkLoading(false);
      setBulkStatusTarget(null);
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

  // Ctrl+A → select all files in current view
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        e.preventDefault();
        if (filteredFiles.length > 0) {
          setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [filteredFiles]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('admin-dashboard-view-mode', viewMode);
    }
  }, [viewMode]);

  // Context menu handlers
  const handleFileContextMenu = useCallback((e, file) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file, type: 'file' });
  }, []);

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
      { icon: 'fa-pencil-alt', label: 'Rename', onClick: () => {
        const name = file.originalName || '';
        const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
        const base = ext ? name.slice(0, -ext.length) : name;
        setRenamingFileId(file.id);
        setRenameFileExt(ext);
        setRenameFileValue(base);
      } },
      { icon: 'fa-download', label: 'Download', disabled: isUrl, onClick: isUrl ? () => {} : () => {
        const a = document.createElement('a');
        a.href = fileUrl(file.url) + '?download=1';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }},
      { icon: 'fa-copy', label: 'Copy URL', shortcut: 'Ctrl+C', onClick: () => copyFileUrl(file) },
      { divider: true },
      { icon: 'fa-folder-open', label: 'Move to Folder...', onClick: () => setMoveTarget({ type: 'file', item: file }) },
      { icon: 'fa-check-square', label: selectedIds.has(file.id) ? 'Deselect' : 'Select', onClick: () => toggleSelect(file.id) },
      { divider: true },
      { icon: 'fa-info-circle', label: 'Properties', onClick: () => setPropertiesFile(file) },
      { icon: 'fa-trash-alt', label: 'Delete', danger: true, onClick: () => { setDeleteConfirm(file.id); }},
    ];

    // When multiple files are selected, add bulk actions
    const selCount = [...selectedIds].filter((id) => filteredIds.has(id)).length;
    if (selCount > 1) {
      items.push({ divider: true });
      items.push({ icon: 'fa-arrows-alt', label: `Move ${selCount} Selected to Folder...`, onClick: () => setBulkMoveActive(true) });
      items.push({ icon: 'fa-times-circle', label: 'Deselect All', onClick: () => setSelectedIds(new Set()) });
      items.push({ icon: 'fa-trash-alt', label: `Delete ${selCount} Selected`, danger: true, onClick: () => setBulkDeleteConfirm(true) });
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
  const selectedCount = [...selectedIds].filter((id) => filteredIds.has(id)).length;
  const totalItems = currentSubfolders.length + filteredFiles.length;
  const isLoading = filesLoading || foldersLoading;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('')}
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
            onClick={() => setStatusFilter((prev) => (prev === key ? '' : key))}
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
        <div className={`p-3 rounded-xl border flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'}`}></i>
          <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</p>
        </div>
      )}
      {filesError && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
          <i className="fas fa-exclamation-triangle text-red-500"></i>
          <p className="text-sm font-medium text-red-700">Error loading files: {filesError}</p>
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs
        folders={allFolders}
        currentFolderId={currentFolderId}
        onNavigate={setCurrentFolderId}
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
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

          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors whitespace-nowrap border border-indigo-200"
          >
            <i className="fas fa-folder-plus text-xs"></i>
            New Folder
          </button>

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
            <span className="text-xs text-gray-400 ml-1">
              {(isSearching || statusFilter || serviceFilter) ? 'Across all folders \u00b7 ' : ''}
              {filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="bg-white rounded-xl border border-primary/20 p-3 shadow-sm flex items-center gap-3 flex-wrap">
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
            {bulkStatusTarget ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">Set status:</span>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleBulkStatus(s)}
                    disabled={bulkLoading}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} border ${STATUS_CONFIG[s].border}`}
                  >
                    {s === 'pending' ? 'Pending' : s === 'in-progress' ? 'In Progress' : 'Transcribed'}
                  </button>
                ))}
                <button onClick={() => setBulkStatusTarget(null)} className="text-gray-400 hover:text-gray-600 px-1">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBulkStatusTarget(true)}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-exchange-alt text-[10px]"></i>
                Change Status
              </button>
            )}
            {bulkDeleteConfirm ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-red-600 font-medium">Delete {selectedCount} files?</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? <i className="fas fa-spinner fa-spin text-[10px]"></i> : <i className="fas fa-check text-[10px]"></i>}
                  Confirm
                </button>
                <button
                  onClick={() => setBulkDeleteConfirm(false)}
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-dark-text hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <i className="fas fa-trash-alt text-[10px]"></i>
                Delete All
              </button>
            )}
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

      {/* Delete folder confirmation */}
      {deleteFolderConfirm && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3 flex-wrap">
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
      {isLoading ? (
        <div className="py-8">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <i className="fas fa-spinner fa-spin text-[11px]"></i>
            Loading files and folders...
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                <div className="h-2 w-20 rounded bg-sky-100 mb-4"></div>
                <div className="h-4 w-3/4 rounded bg-gray-200 mb-2"></div>
                <div className="h-3 w-1/2 rounded bg-gray-100 mb-4"></div>
                <div className="h-3 w-full rounded bg-gray-100 mb-2"></div>
                <div className="h-3 w-2/3 rounded bg-gray-100"></div>
              </div>
            ))}
          </div>
        </div>
      ) : totalItems === 0 && !hasActiveFilters ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className={`fas ${currentFolderId ? 'fa-folder-open' : 'fa-folder-open'} text-primary text-xl`}></i>
          </div>
          <p className="text-sm font-medium text-dark-text">
            {currentFolderId ? 'This folder is empty' : 'No files uploaded yet'}
          </p>
          <p className="text-xs text-gray-text mt-1 mb-5">
            {currentFolderId ? 'Drag files here or upload new ones.' : 'No files uploaded yet.'}
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
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
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
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">Uploaded By</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">Date</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* Folder rows first */}
                {currentSubfolders.map((folder) => {
                  if (renamingFolder === folder.id) {
                    return (
                      <tr key={folder.id} className="bg-primary/[0.03]">
                        <td colSpan={7} className="px-4 py-3">
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

                {/* File rows */}
                {filteredFiles.map((file) => {
                  const cfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
                  const isSelected = selectedIds.has(file.id);
                  const urlPlatform = file.sourceType === 'url' ? getUrlPlatform(file.url) : null;
                  return (
                    <tr
                      key={file.id}
                      className={`transition-colors ${isSelected ? 'bg-primary/[0.03]' : 'hover:bg-gray-50/50'}`}
                      draggable={renamingFileId !== file.id}
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
                            {renamingFileId === file.id ? (
                              <form
                                className="flex items-center gap-1"
                                onSubmit={(e) => { e.preventDefault(); handleRenameFile(file.id, renameFileValue.trim() + renameFileExt); }}
                              >
                                <input
                                  type="text"
                                  value={renameFileValue}
                                  onChange={(e) => setRenameFileValue(e.target.value)}
                                  autoFocus
                                  className="flex-1 px-2 py-1 bg-gray-50 border border-primary/40 rounded text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-0 max-w-[160px]"
                                  onKeyDown={(e) => { if (e.key === 'Escape') setRenamingFileId(null); }}
                                />
                                {renameFileExt && <span className="text-sm text-gray-400 flex-shrink-0">{renameFileExt}</span>}
                                <button type="submit" className="text-primary hover:text-primary-dark flex-shrink-0">
                                  <i className="fas fa-check text-xs"></i>
                                </button>
                                <button type="button" onClick={() => setRenamingFileId(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </form>
                            ) : (
                              <span
                                className="text-sm font-medium text-dark-text truncate block max-w-[200px] cursor-pointer hover:text-primary transition-colors"
                                title={file.originalName}
                                onClick={() => setPreviewFile(file)}
                              >
                                {file.originalName}
                              </span>
                            )}
                            {file.description && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5" title={file.description}>
                                {file.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {file.size > 0 && (
                                <span className="text-[10px] text-gray-400">{formatSize(file.size)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {urlPlatform ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${urlPlatform.color}`}>
                            {urlPlatform.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-text">
                            {file.type ? file.type.split('/')[1]?.toUpperCase() || file.type : '--'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {statusLoading === file.id ? (
                          <i className="fas fa-spinner fa-spin text-primary text-sm"></i>
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={file.status || 'pending'}
                              onChange={(e) => handleStatusChange(file.id, e.target.value)}
                              className={`appearance-none px-2.5 py-1 pr-7 rounded-md border text-[11px] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                              ))}
                            </select>
                            <i className={`fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none ${cfg.text}`}></i>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-text">{file.uploadedByEmail || '--'}</span>
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
                          {deleteConfirm === file.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(file.id)}
                                disabled={deleteLoading === file.id}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                {deleteLoading === file.id ? (
                                  <i className="fas fa-spinner fa-spin text-[10px]"></i>
                                ) : (
                                  <i className="fas fa-check text-[10px]"></i>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                className="inline-flex items-center px-2 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-dark-text hover:bg-gray-100 transition-colors"
                              >
                                <i className="fas fa-times text-[10px]"></i>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(file.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete file"
                            >
                              <i className="fas fa-trash-alt text-[10px]"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden p-4 space-y-3">
            {/* Mobile folder cards */}
            {currentSubfolders.map((folder) => (
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
                showOwner
              />
            ))}

            {/* Mobile file cards */}
            {filteredFiles.map((file) => {
              const cfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
              const isSelected = selectedIds.has(file.id);
              const urlPlatform = file.sourceType === 'url' ? getUrlPlatform(file.url) : null;
              return (
                <div
                  key={file.id}
                  className={`p-4 rounded-xl border transition-colors ${isSelected ? 'border-primary/30 bg-primary/[0.02]' : 'border-gray-100'}`}
                  draggable={renamingFileId !== file.id}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'file', id: file.id }));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onContextMenu={(e) => handleFileContextMenu(e, file)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(file.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer mt-1"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileIconColor(file.type)} cursor-pointer hover:scale-105 transition-transform`}
                    >
                      <i className={`fas ${getFileIcon(file.type)} text-sm`}></i>
                    </button>
                    <div className="flex-1 min-w-0">
                      {renamingFileId === file.id ? (
                        <form
                          className="flex items-center gap-1 mb-1"
                          onSubmit={(e) => { e.preventDefault(); handleRenameFile(file.id, renameFileValue.trim() + renameFileExt); }}
                        >
                          <input
                            type="text"
                            value={renameFileValue}
                            onChange={(e) => setRenameFileValue(e.target.value)}
                            autoFocus
                            className="flex-1 px-2 py-1 bg-gray-50 border border-primary/40 rounded text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-0"
                            onKeyDown={(e) => { if (e.key === 'Escape') setRenamingFileId(null); }}
                          />
                          {renameFileExt && <span className="text-sm text-gray-400 flex-shrink-0">{renameFileExt}</span>}
                          <button type="submit" className="text-primary hover:text-primary-dark flex-shrink-0">
                            <i className="fas fa-check text-xs"></i>
                          </button>
                          <button type="button" onClick={() => setRenamingFileId(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </form>
                      ) : (
                        <p className="text-sm font-medium text-dark-text truncate">{file.originalName}</p>
                      )}
                      {file.description && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{file.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 mt-1.5">
                        <span><i className="fas fa-user mr-1 text-[9px]"></i>{file.uploadedByEmail || '--'}</span>
                        <span>{formatSize(file.size)}</span>
                        <span>{formatRelativeDate(file.uploadedAt)}</span>
                        {urlPlatform && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${urlPlatform.color}`}>
                            {urlPlatform.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-13 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <i className="fas fa-eye text-[10px]"></i>
                      View
                    </button>
                    {deleteConfirm === file.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={deleteLoading === file.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading === file.id ? (
                            <i className="fas fa-spinner fa-spin text-[10px]"></i>
                          ) : (
                            <><i className="fas fa-check text-[10px]"></i>Confirm</>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(null)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-dark-text hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(file.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <i className="fas fa-trash-alt text-[10px]"></i>
                        Delete
                      </button>
                    )}
                    {statusLoading === file.id ? (
                      <i className="fas fa-spinner fa-spin text-primary text-sm ml-auto"></i>
                    ) : (
                      <div className="relative inline-block ml-auto">
                        <select
                          value={file.status || 'pending'}
                          onChange={(e) => handleStatusChange(file.id, e.target.value)}
                          className={`appearance-none px-2.5 py-1.5 pr-7 rounded-md border text-[11px] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                          ))}
                        </select>
                        <i className={`fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none ${cfg.text}`}></i>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile select all bar */}
          <div className="lg:hidden px-4 pb-3">
            <button
              onClick={toggleSelectAll}
              className="w-full py-2.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-text hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <input type="checkbox" checked={allSelected} readOnly className="w-3.5 h-3.5 rounded border-gray-300 text-primary pointer-events-none" />
              {allSelected ? 'Deselect All' : 'Select All'}
              <span className="text-gray-300 font-mono text-[9px]">Ctrl+A</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          onDragOver={(e) => {
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
          {currentSubfolders.map((folder) => {
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
                showOwner
              />
            );
          })}

          {filteredFiles.map((file) => {
            const isSelected = selectedIds.has(file.id);
            return (
              <div
                key={file.id}
                className={`relative transition-all ${isSelected ? 'ring-2 ring-primary/30 rounded-xl' : ''}`}
                draggable={renamingFileId !== file.id}
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
                  isAdmin
                  onStatusChange={handleStatusChange}
                  onPreview={setPreviewFile}
                />
              </div>
            );
          })}

          {filteredFiles.length > 0 && (
            <div className="md:col-span-2 xl:col-span-3">
              <button
                onClick={toggleSelectAll}
                className="w-full py-2.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-text hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
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
            </div>
          )}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Preview Modal */}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {/* Properties Modal */}
      {propertiesFile && <FilePropertiesModal file={propertiesFile} onClose={() => setPropertiesFile(null)} />}

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
    </div>
  );
}

/* ───────────────────── Transcriptions Tab ──────────────────────── */

function TranscriptionsTab() {
  const { transcriptions, loading, error, fetchTranscriptions } = useTranscriptions();
  const [searchQuery, setSearchQuery] = useState('');

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

  if (loading) {
    return (
      <div className="text-center py-24">
        <i className="fas fa-spinner fa-spin text-3xl text-primary mb-4 block"></i>
        <p className="text-sm text-gray-text">Loading transcriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
          <i className="fas fa-exclamation-circle text-red-500"></i>
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => fetchTranscriptions({})}
            className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center gap-1.5 mx-auto"
          >
            <i className="fas fa-sync-alt text-xs"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcriptions by title, file name, or author..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xs"></i>
              </button>
            )}
          </div>
          <button
            onClick={() => fetchTranscriptions({})}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-text hover:text-primary hover:bg-primary/5 rounded-lg transition-colors whitespace-nowrap"
          >
            <i className="fas fa-sync-alt text-xs"></i>
            Refresh
          </button>
        </div>
        {searchQuery && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {filteredTranscriptions.length} of {transcriptions.length} transcriptions
            </span>
          </div>
        )}
      </div>

      {transcriptions.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-file-alt text-primary text-xl"></i>
          </div>
          <p className="text-sm font-medium text-dark-text">No transcriptions yet</p>
          <p className="text-xs text-gray-text mt-1 mb-5">Transcriptions for uploaded files will appear here.</p>
        </div>
      ) : filteredTranscriptions.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-search text-primary text-xl"></i>
          </div>
          <p className="text-sm font-medium text-dark-text">No transcriptions match your search</p>
          <p className="text-xs text-gray-text mt-1 mb-4">Try adjusting your search query.</p>
          <button onClick={() => setSearchQuery('')} className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
            Clear search
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">File Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">Transcription Title</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">Created</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider">Created By</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-gray-text uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTranscriptions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-file-audio text-xs"></i>
                        </div>
                        <span className="text-sm font-medium text-dark-text truncate max-w-[200px]" title={t.fileName || t.fileId}>
                          {t.fileName || t.fileId || '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-dark-text truncate block max-w-[220px]" title={t.title}>{t.title || 'Untitled'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-text">{formatDate(t.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-text">{t.createdByEmail || '--'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        to={`/admin/transcriptions/${t.fileId || t.id}`}
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

          <div className="lg:hidden p-4 space-y-3">
            {filteredTranscriptions.map((t) => (
              <Link
                key={t.id}
                to={`/admin/transcriptions/${t.fileId || t.id}`}
                className="block p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-file-audio text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-text truncate">{t.title || 'Untitled'}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{t.fileName || t.fileId || '--'}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 mt-1.5">
                      <span><i className="fas fa-user mr-1 text-[9px]"></i>{t.createdByEmail || '--'}</span>
                      <span><i className="fas fa-calendar mr-1 text-[9px]"></i>{formatRelativeDate(t.createdAt)}</span>
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
  );
}

/* ───────────────────── Main Page Component ─────────────────────── */

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('files');
  const [userMessage, setUserMessage] = useState(null);

  const { files: allFiles, loading: filesLoading, error: filesError } = useFirestoreFiles();
  const { folders: allFolders, loading: foldersLoading } = useFolders();
  const folderActions = useFolderActions();
  const { users, loading: usersLoading, error: usersError, createUser, deleteUser, toggleAdmin } = useAdminUsers();

  useEffect(() => {
    document.title = 'Admin Dashboard - DigiScribe';
  }, []);

  useEffect(() => {
    if (userMessage) {
      const timer = setTimeout(() => setUserMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [userMessage]);

  const handleCreateUser = async (data) => {
    setUserMessage(null);
    try {
      await createUser(data);
      setUserMessage({ type: 'success', text: `User "${data.email}" created successfully.` });
    } catch (err) {
      setUserMessage({ type: 'error', text: err.message });
      throw err;
    }
  };

  const handleDeleteUser = async (uid) => {
    setUserMessage(null);
    try {
      await deleteUser(uid);
      setUserMessage({ type: 'success', text: 'User deleted successfully.' });
    } catch (err) {
      setUserMessage({ type: 'error', text: err.message });
      throw err;
    }
  };

  const handleToggleAdmin = async (uid, isAdmin) => {
    setUserMessage(null);
    try {
      await toggleAdmin(uid, isAdmin);
      setUserMessage({
        type: 'success',
        text: isAdmin ? 'Admin privileges granted.' : 'Admin privileges revoked.',
      });
    } catch (err) {
      setUserMessage({ type: 'error', text: err.message });
      throw err;
    }
  };

  const heroContent = (
    <div className="relative z-10 py-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold gradient-text">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-text">{user?.email || 'Admin'}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                <i className="fas fa-shield-alt text-[8px]"></i>
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="inline-flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'btn-gradient text-white shadow-md shadow-primary/30'
                      : 'text-gray-text hover:text-dark-text hover:bg-gray-50'
                  }`}
                >
                  <i className={`fas ${tab.icon} text-xs`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            <Link
              to="/upload"
              className="btn-gradient text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all inline-flex items-center gap-2"
            >
              <i className="fas fa-plus text-xs"></i>
              Upload
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
          <div key={activeTab}>
            {activeTab === 'files' && (
              <FilesTab
                allFiles={allFiles}
                allFolders={allFolders}
                filesLoading={filesLoading}
                filesError={filesError}
                foldersLoading={foldersLoading}
                folderActions={folderActions}
              />
            )}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {usersError && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                    <i className="fas fa-exclamation-circle text-red-500"></i>
                    <p className="text-sm text-red-700">{usersError}</p>
                  </div>
                )}
                {userMessage && (
                  <div className={`p-4 rounded-xl border transition-all duration-300 ${
                    userMessage.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <i className={`fas ${userMessage.type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'}`}></i>
                        <p className={`text-sm font-medium ${userMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{userMessage.text}</p>
                      </div>
                      <button onClick={() => setUserMessage(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )}
                <CreateUserForm onCreateUser={handleCreateUser} loading={usersLoading} />
                <UserTable users={users} onDeleteUser={handleDeleteUser} onToggleAdmin={handleToggleAdmin} loading={usersLoading} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
