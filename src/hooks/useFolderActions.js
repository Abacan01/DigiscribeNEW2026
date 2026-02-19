import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useFolderActions() {
  const { getIdToken } = useAuth();

  const createFolder = useCallback(async (name, parentId = null) => {
    const token = await getIdToken();
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, parentId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create folder.');
    return data.folderId;
  }, [getIdToken]);

  const renameFolder = useCallback(async (folderId, name) => {
    const token = await getIdToken();
    const res = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to rename folder.');
  }, [getIdToken]);

  const moveFolder = useCallback(async (folderId, newParentId) => {
    const token = await getIdToken();
    const res = await fetch(`/api/folders/${folderId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ parentId: newParentId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to move folder.');
  }, [getIdToken]);

  const deleteFolder = useCallback(async (folderId) => {
    const token = await getIdToken();
    const res = await fetch(`/api/folders/${folderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete folder.');
  }, [getIdToken]);

  const moveFileToFolder = useCallback(async (fileId, folderId) => {
    const token = await getIdToken();
    const res = await fetch(`/api/files/metadata/${fileId}/folder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ folderId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to move file.');
  }, [getIdToken]);

  return { createFolder, renameFolder, moveFolder, deleteFolder, moveFileToFolder };
}
