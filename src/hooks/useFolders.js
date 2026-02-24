import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const FOLDERS_CACHE_PREFIX = 'digiscribe-folders-cache-v1';

function getFoldersCacheKey(userId, role) {
  return `${FOLDERS_CACHE_PREFIX}:${role || 'user'}:${userId}`;
}

function readFoldersCache(userId, role) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = window.localStorage.getItem(getFoldersCacheKey(userId, role));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.folders)) return null;
    return parsed.folders;
  } catch {
    return null;
  }
}

function writeFoldersCache(userId, role, folders) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const payload = {
      updatedAt: Date.now(),
      folders: Array.isArray(folders) ? folders : [],
    };
    window.localStorage.setItem(getFoldersCacheKey(userId, role), JSON.stringify(payload));
  } catch {
    // Ignore storage quota/private mode errors
  }
}

export function useFolders() {
  const { user, role } = useAuth();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setFolders([]);
      setLoading(false);
      return;
    }

    const cachedFolders = readFoldersCache(user.uid, role);
    if (cachedFolders) {
      setFolders(cachedFolders);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let q;
      if (role === 'admin') {
        q = query(collection(db, 'folders'), orderBy('name', 'asc'));
      } else {
        q = query(collection(db, 'folders'), where('createdBy', '==', user.uid));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => {
            const data = doc.data();
            let createdAt = data.createdAt;
            if (createdAt && typeof createdAt.toDate === 'function') {
              createdAt = createdAt.toDate().toISOString();
            } else if (createdAt instanceof Date) {
              createdAt = createdAt.toISOString();
            }

            let updatedAt = data.updatedAt;
            if (updatedAt && typeof updatedAt.toDate === 'function') {
              updatedAt = updatedAt.toDate().toISOString();
            } else if (updatedAt instanceof Date) {
              updatedAt = updatedAt.toISOString();
            }

            return {
              id: doc.id,
              ...data,
              createdAt,
              updatedAt,
            };
          });

          // Sort client-side for user queries that don't include orderBy
          if (role !== 'admin') {
            docs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          }

          setFolders(docs);
          writeFoldersCache(user.uid, role, docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error loading folders:', err.message);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Firestore folders query setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [user, role]);

  return { folders, loading, error };
}
