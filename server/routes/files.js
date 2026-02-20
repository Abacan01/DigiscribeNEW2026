import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adminDb } from '../firebaseAdmin.js';
import { verifyAuth, verifyAdmin } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

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

    await docRef.update({ folderId: folderId || null, updatedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/files/metadata/:fileId - Delete file metadata and uploaded file (admin only)
router.delete('/metadata/:fileId', verifyAdmin, async (req, res) => {
  try {
    const docRef = adminDb.collection('files').doc(req.params.fileId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    const fileData = doc.data();

    // Delete the physical file from uploads
    const filePath = fileData.storagePath
      ? path.join(uploadsDir, fileData.storagePath)
      : (fileData.savedAs ? path.join(uploadsDir, fileData.savedAs) : null);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the Firestore document
    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
