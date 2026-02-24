import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const FILES_CACHE_PREFIX = 'digiscribe-files-cache-v1';

function getFilesCacheKey(userId, role) {
  return `${FILES_CACHE_PREFIX}:${role || 'user'}:${userId}`;
}

function readFilesCache(userId, role) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = window.localStorage.getItem(getFilesCacheKey(userId, role));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.files)) return null;
    return parsed.files;
  } catch {
    return null;
  }
}

function writeFilesCache(userId, role, files) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const payload = {
      updatedAt: Date.now(),
      files: Array.isArray(files) ? files : [],
    };
    window.localStorage.setItem(getFilesCacheKey(userId, role), JSON.stringify(payload));
  } catch {
    // Ignore storage quota/private mode errors
  }
}

export function useFirestoreFiles() {
  const { user, role } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setFiles([]);
      setLoading(false);
      return;
    }

    const cachedFiles = readFilesCache(user.uid, role);
    if (cachedFiles) {
      setFiles(cachedFiles);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let q;
      if (role === 'admin') {
        // Admin sees all files
        q = query(collection(db, 'files'), orderBy('uploadedAt', 'desc'));
      } else {
        // Regular user sees only their own files
        q = query(collection(db, 'files'), where('uploadedBy', '==', user.uid));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => {
            const data = doc.data();
            let uploadedAt = data.uploadedAt;
            if (uploadedAt && typeof uploadedAt.toDate === 'function') {
              uploadedAt = uploadedAt.toDate().toISOString();
            } else if (uploadedAt instanceof Date) {
              uploadedAt = uploadedAt.toISOString();
            }

            return {
              id: doc.id,
              ...data,
              uploadedAt,
            };
          });

          // Sort client-side for user queries that don't include orderBy
          if (role === 'user') {
            docs.sort((a, b) => {
              const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
              const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
              return dateB - dateA;
            });
          }

          setFiles(docs);
          writeFilesCache(user.uid, role, docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error loading files:', err.message);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Firestore query setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [user, role]);

  return { files, loading, error };
}
