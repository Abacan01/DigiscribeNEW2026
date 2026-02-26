import { Router } from 'express';
import { adminDb } from '../firebaseAdmin.js';
import { verifyAuth } from '../middleware/authMiddleware.js';
import { deleteFromFtp, moveOnFtp } from '../services/ftp.js';
import { computeFileFtpPath } from '../services/ftpPathResolver.js';
import path from 'path';

const router = Router();

// POST /api/files/metadata - Save file metadata
router.post('/metadata', verifyAuth, async (req, res) => {
  const { originalName, savedAs, size, type, description, serviceCategory, sourceType, sourceUrl, folderId } = req.body;

  if (!originalName || !savedAs) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  try {
    const docRef = await adminDb.collection('files').add({
      originalName,
      savedAs,
      size: size || 0,
      type: type || 'application/octet-stream',
      uploadedBy: req.user.uid,
      uploadedByEmail: req.user.email || '',
      uploadedAt: new Date(),
      status: 'pending',
      description: description || '',
      serviceCategory: serviceCategory || '',
      sourceType: sourceType || 'file',
      sourceUrl: sourceUrl || null,
      folderId: folderId || null,
      url: `/api/files/${encodeURIComponent(savedAs)}`,
    });

    res.json({ success: true, fileId: docRef.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/metadata - List files (role-scoped)
router.get('/metadata', verifyAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = adminDb.collection('files');

    const role = req.user.role;

    if (role === 'admin') {
      // Admin sees all files
    } else {
      // Regular users see only their own files
      query = query.where('uploadedBy', '==', req.user.uid);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const files = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate?.()?.toISOString() || doc.data().uploadedAt,
    })).sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/files/metadata/:fileId/status - Update file status (admin only)
router.put('/metadata/:fileId/status', verifyAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'in-progress', 'transcribed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const docRef = adminDb.collection('files').doc(req.params.fileId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    // Only admins can change status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required to change status.' });
    }

    await docRef.update({ status, updatedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/files/metadata/:fileId/description - Update file description/note
router.put('/metadata/:fileId/description', verifyAuth, async (req, res) => {
  const { description } = req.body;
  const nextDescription = typeof description === 'string' ? description.trim() : '';

  if (nextDescription.length > 2000) {
    return res.status(400).json({ success: false, error: 'Description must be 2000 characters or less.' });
  }

  try {
    const docRef = adminDb.collection('files').doc(req.params.fileId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    const fileData = doc.data();

    // Users can update only their own files; admins can update any file.
    if (req.user.role !== 'admin' && fileData.uploadedBy !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    await docRef.update({ description: nextDescription, updatedAt: new Date() });
    res.json({ success: true, description: nextDescription });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/files/metadata/:fileId/folder - Move file to folder
router.put('/metadata/:fileId/folder', verifyAuth, async (req, res) => {
  const { folderId } = req.body;

  try {
    const docRef = adminDb.collection('files').doc(req.params.fileId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    const fileData = doc.data();

    // Regular users can only move their own files
    if (req.user.role !== 'admin' && fileData.uploadedBy !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    // If folderId specified, verify the folder exists
    if (folderId) {
      const folderDoc = await adminDb.collection('folders').doc(folderId).get();
      if (!folderDoc.exists) {
        return res.status(404).json({ success: false, error: 'Folder not found.' });
      }
    }

    // --- FTP sync: move file to the new folder path ---
    const oldStoragePath = fileData.storagePath || fileData.savedAs;
    const oldFolderId = fileData.folderId || null;
    const newFolderId = folderId || null;

    // Only move on FTP if folder actually changed
    if (oldFolderId !== newFolderId && oldStoragePath) {
      try {
        // Save original path on first move so we can restore it if moved back to root
        const originalStoragePathToSave = fileData.originalStoragePath || oldStoragePath;
        const newStoragePath = await computeFileFtpPath({ ...fileData, originalStoragePath: originalStoragePathToSave }, newFolderId, adminDb);

        if (oldStoragePath !== newStoragePath) {
          await moveOnFtp(oldStoragePath, newStoragePath);
        }

        const encodedPath = newStoragePath.split('/').map(encodeURIComponent).join('/');
        await docRef.update({
          folderId: newFolderId,
          storagePath: newStoragePath,
          url: `/api/files/${encodedPath}`,
          originalStoragePath: originalStoragePathToSave,
          updatedAt: new Date(),
        });
      } catch (ftpErr) {
        console.warn('[ftp] move-to-folder warning:', ftpErr.message);
        // Still update Firestore folderId even if FTP move fails
        await docRef.update({ folderId: newFolderId, updatedAt: new Date() });
      }
    } else {
      await docRef.update({ folderId: newFolderId, updatedAt: new Date() });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/files/metadata/:fileId/rename - Rename file display name
router.put('/metadata/:fileId/rename', verifyAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }
  try {
    const docRef = adminDb.collection('files').doc(req.params.fileId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    const fileData = doc.data();

    // Non-admins can only rename their own files
    if (req.user.role !== 'admin' && fileData.uploadedBy !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'You can only rename your own files.' });
    }

    const oldStoragePath = fileData.storagePath || fileData.savedAs;
    const newDisplayName = name.trim();

    // --- FTP sync: rename the file on FTP ---
    if (oldStoragePath) {
      try {
        const dir = path.posix.dirname(oldStoragePath);
        const oldBaseName = path.posix.basename(oldStoragePath);
        // Preserve the unique timestamp prefix from savedAs, change the display portion
        const ext = path.posix.extname(oldBaseName);
        // savedAs is like "1234567890-original_name.mp3"
        const savedAs = fileData.savedAs || oldBaseName;
        const dashIndex = savedAs.indexOf('-');
        const prefix = dashIndex > 0 ? savedAs.slice(0, dashIndex + 1) : `${Date.now()}-`;
        const safeName = newDisplayName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const newFileName = `${prefix}${safeName}`;
        // Only add extension if safeName doesn't already end with it
        const finalNewFileName = safeName.toLowerCase().endsWith(ext.toLowerCase()) ? newFileName : newFileName;
        const newStoragePath = `${dir}/${finalNewFileName}`;

        if (oldStoragePath !== newStoragePath) {
          await moveOnFtp(oldStoragePath, newStoragePath);
          const encodedPath = newStoragePath.split('/').map(encodeURIComponent).join('/');
          await docRef.update({
            originalName: newDisplayName,
            savedAs: finalNewFileName,
            storagePath: newStoragePath,
            url: `/api/files/${encodedPath}`,
            updatedAt: new Date(),
          });
        } else {
          await docRef.update({ originalName: newDisplayName, updatedAt: new Date() });
        }
      } catch (ftpErr) {
        console.warn('[ftp] rename warning:', ftpErr.message);
        // Still update display name even if FTP rename fails
        await docRef.update({ originalName: newDisplayName, updatedAt: new Date() });
      }
    } else {
      await docRef.update({ originalName: newDisplayName, updatedAt: new Date() });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/files/metadata/:fileId - Delete file metadata and uploaded file
router.delete('/metadata/:fileId', verifyAuth, async (req, res) => {
  try {
    const docRef = adminDb.collection('files').doc(req.params.fileId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    const fileData = doc.data();

    // Non-admins can only delete their own files
    if (req.user.role !== 'admin' && fileData.uploadedBy !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'You can only delete your own files.' });
    }

    // Delete the file from FTP
    const remotePath = fileData.storagePath || fileData.savedAs;
    if (remotePath) {
      await deleteFromFtp(remotePath);
    }

    // Delete the Firestore document
    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
