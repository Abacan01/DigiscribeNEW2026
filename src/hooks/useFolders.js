import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

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

    setLoading(true);
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
