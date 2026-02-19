import { Router } from 'express';
import { adminDb } from '../firebaseAdmin.js';
import { verifyAuth } from '../middleware/authMiddleware.js';

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

    await docRef.update({ name: name.trim(), updatedAt: new Date() });
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

    await docRef.update({ parentId: parentId || null, updatedAt: new Date() });
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

    // Move all files in this folder to the parent folder
    const filesSnapshot = await adminDb.collection('files')
      .where('folderId', '==', req.params.id)
      .get();

    const batch = adminDb.batch();
    filesSnapshot.docs.forEach((fileDoc) => {
      batch.update(fileDoc.ref, { folderId: newParent, updatedAt: new Date() });
    });

    // Move all subfolders to the parent folder
    const subfoldersSnapshot = await adminDb.collection('folders')
      .where('parentId', '==', req.params.id)
      .get();

    subfoldersSnapshot.docs.forEach((subDoc) => {
      batch.update(subDoc.ref, { parentId: newParent, updatedAt: new Date() });
    });

    // Delete the folder
    batch.delete(docRef);
    await batch.commit();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
