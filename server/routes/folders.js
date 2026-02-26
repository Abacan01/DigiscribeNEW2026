import { Router } from 'express';
import { adminDb } from '../firebaseAdmin.js';
import { verifyAuth } from '../middleware/authMiddleware.js';
import { mkdirOnFtp, renameDirOnFtp, removeDirOnFtp, moveOnFtp } from '../services/ftp.js';
import {
  resolveFolderFtpPath,
  sanitizeName,
  updateDescendantFilePaths,
  computeFileFtpPath,
} from '../services/ftpPathResolver.js';

const router = Router();

// POST /api/folders - Create a folder
router.post('/', verifyAuth, async (req, res) => {
  const { name, parentId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Folder name is required.' });
  }

  try {
    // If parentId specified, verify the parent folder exists and user has access
    if (parentId) {
      const parentDoc = await adminDb.collection('folders').doc(parentId).get();
      if (!parentDoc.exists) {
        return res.status(404).json({ success: false, error: 'Parent folder not found.' });
      }
      // Regular users can only create inside their own folders
      if (req.user.role !== 'admin' && parentDoc.data().createdBy !== req.user.uid) {
        return res.status(403).json({ success: false, error: 'Access denied to parent folder.' });
      }
    }

    const docRef = await adminDb.collection('folders').add({
      name: name.trim(),
      parentId: parentId || null,
      createdBy: req.user.uid,
      createdByEmail: req.user.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // --- FTP sync: create directory on FTP ---
    try {
      const ftpPath = await resolveFolderFtpPath(docRef.id, adminDb);
      if (ftpPath) await mkdirOnFtp(ftpPath);
    } catch (ftpErr) {
      console.warn('[ftp] mkdir warning:', ftpErr.message);
    }

    res.json({ success: true, folderId: docRef.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/folders - List folders (role-scoped)
router.get('/', verifyAuth, async (req, res) => {
  try {
    let query = adminDb.collection('folders');

    if (req.user.role !== 'admin') {
      query = query.where('createdBy', '==', req.user.uid);
    }

    const snapshot = await query.get();
    const folders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });

    res.json({ success: true, folders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/folders/:id - Rename folder
router.put('/:id', verifyAuth, async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Folder name is required.' });
  }

  try {
    const docRef = adminDb.collection('folders').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Folder not found.' });
    }

    // Regular users can only rename their own folders
    if (req.user.role !== 'admin' && doc.data().createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    // --- FTP sync: rename directory on FTP ---
    const oldFtpPath = await resolveFolderFtpPath(req.params.id, adminDb);

    await docRef.update({ name: name.trim(), updatedAt: new Date() });

    // Resolve new path (after name update)
    const newFtpPath = await resolveFolderFtpPath(req.params.id, adminDb);

    if (oldFtpPath && newFtpPath && oldFtpPath !== newFtpPath) {
      try {
        await renameDirOnFtp(oldFtpPath, newFtpPath);
        // Update storagePath / url for all files inside this folder tree
        await updateDescendantFilePaths(req.params.id, adminDb);
      } catch (ftpErr) {
        console.warn('[ftp] rename-folder warning:', ftpErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/folders/:id/move - Move folder to new parent
router.put('/:id/move', verifyAuth, async (req, res) => {
  const { parentId } = req.body;
  const folderId = req.params.id;

  try {
    const docRef = adminDb.collection('folders').doc(folderId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Folder not found.' });
    }

    if (req.user.role !== 'admin' && doc.data().createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    // Cannot move a folder into itself
    if (parentId === folderId) {
      return res.status(400).json({ success: false, error: 'Cannot move a folder into itself.' });
    }

    // Prevent circular references: walk up parentId chain from target parent
    if (parentId) {
      let current = parentId;
      while (current) {
        if (current === folderId) {
          return res.status(400).json({ success: false, error: 'Cannot move a folder into its own descendant.' });
        }
        const parentDoc = await adminDb.collection('folders').doc(current).get();
        if (!parentDoc.exists) break;
        current = parentDoc.data().parentId || null;
      }
    }

    // --- FTP sync: move directory on FTP ---
    const oldFtpPath = await resolveFolderFtpPath(folderId, adminDb);

    await docRef.update({ parentId: parentId || null, updatedAt: new Date() });

    // Resolve new path (after parentId update)
    const newFtpPath = await resolveFolderFtpPath(folderId, adminDb);

    if (oldFtpPath && newFtpPath && oldFtpPath !== newFtpPath) {
      try {
        await renameDirOnFtp(oldFtpPath, newFtpPath);
        // Update storagePath / url for all files inside this folder tree
        await updateDescendantFilePaths(folderId, adminDb);
      } catch (ftpErr) {
        console.warn('[ftp] move-folder warning:', ftpErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/folders/:id - Delete folder (move contents to parent)
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const docRef = adminDb.collection('folders').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Folder not found.' });
    }

    const folderData = doc.data();

    if (req.user.role !== 'admin' && folderData.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const newParent = folderData.parentId || null;

    // --- FTP sync: resolve the folder's FTP path before deletion ---
    let folderFtpPath = '';
    try {
      folderFtpPath = await resolveFolderFtpPath(req.params.id, adminDb);
    } catch (e) { /* ignore */ }

    // Move all files in this folder to the parent folder
    const filesSnapshot = await adminDb.collection('files')
      .where('folderId', '==', req.params.id)
      .get();

    // --- FTP sync: move each file on FTP to the parent folder path ---
    for (const fileDoc of filesSnapshot.docs) {
      const fileData = fileDoc.data();
      const oldStoragePath = fileData.storagePath || fileData.savedAs;
      if (oldStoragePath) {
        try {
          const newStoragePath = await computeFileFtpPath(fileData, newParent, adminDb);
          if (oldStoragePath !== newStoragePath) {
            await moveOnFtp(oldStoragePath, newStoragePath);
            const encodedPath = newStoragePath.split('/').map(encodeURIComponent).join('/');
            await fileDoc.ref.update({
              folderId: newParent,
              storagePath: newStoragePath,
              url: `/api/files/${encodedPath}`,
              updatedAt: new Date(),
            });
          } else {
            await fileDoc.ref.update({ folderId: newParent, updatedAt: new Date() });
          }
        } catch (ftpErr) {
          console.warn('[ftp] delete-folder file-move warning:', ftpErr.message);
          await fileDoc.ref.update({ folderId: newParent, updatedAt: new Date() });
        }
      } else {
        await fileDoc.ref.update({ folderId: newParent, updatedAt: new Date() });
      }
    }

    // Move all subfolders to the parent folder (Firestore only — FTP dirs will be inside the folder being deleted)
    const subfoldersSnapshot = await adminDb.collection('folders')
      .where('parentId', '==', req.params.id)
      .get();

    // Update subfolder parentIds first
    const batch = adminDb.batch();
    subfoldersSnapshot.docs.forEach((subDoc) => {
      batch.update(subDoc.ref, { parentId: newParent, updatedAt: new Date() });
    });

    // Delete the folder document
    batch.delete(docRef);
    await batch.commit();

    // --- FTP sync: update subfolder descendant file paths, then try to remove the old directory ---
    for (const subDoc of subfoldersSnapshot.docs) {
      try {
        // After parentId update, recalculate FTP paths for all files in each subfolder tree
        await updateDescendantFilePaths(subDoc.id, adminDb);
      } catch (ftpErr) {
        console.warn('[ftp] delete-folder subfolder-path-update warning:', ftpErr.message);
      }
    }

    if (folderFtpPath) {
      try {
        await removeDirOnFtp(folderFtpPath);
      } catch (ftpErr) {
        console.warn('[ftp] delete-folder rmdir warning:', ftpErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
