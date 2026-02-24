import { Router } from 'express';
import crypto from 'crypto';
import { adminDb } from '../firebaseAdmin.js';

const router = Router();

// Timing-safe string comparison to prevent timing attacks on API key
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Verify pipeline access (admin token or pipeline API key)
function verifyPipelineAccess(req, res, next) {
  const pipelineKey = req.headers['x-pipeline-key'];
  const expectedKey = process.env.PIPELINE_API_KEY;

  if (pipelineKey && expectedKey && timingSafeEqual(pipelineKey, expectedKey)) {
    return next();
  }

  // Fall back to admin token check
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  // Import dynamically to avoid circular dep
  import('../middleware/authMiddleware.js').then(({ verifyAdmin }) => {
    verifyAdmin(req, res, next);
  });
}

// POST /api/pipeline/status - Bulk status update
router.post('/status', verifyPipelineAccess, async (req, res) => {
  const { fileIds, status } = req.body;
  const validStatuses = ['pending', 'in-progress', 'transcribed'];

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, error: 'fileIds array is required.' });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const batch = adminDb.batch();
    for (const fileId of fileIds) {
      const ref = adminDb.collection('files').doc(fileId);
      batch.update(ref, { status, updatedAt: new Date() });
    }
    await batch.commit();
    res.json({ success: true, updated: fileIds.length });
  } catch (err) {
    console.error('[pipeline/status] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update status.' });
  }
});

// POST /api/pipeline/webhook - Webhook for external transcription service
router.post('/webhook', verifyPipelineAccess, async (req, res) => {
  const { fileId, status, metadata } = req.body;

  if (!fileId || !status) {
    return res.status(400).json({ success: false, error: 'fileId and status are required.' });
  }

  const validStatuses = ['pending', 'in-progress', 'transcribed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status.` });
  }

  try {
    const updateData = { status, updatedAt: new Date() };
    if (metadata) updateData.pipelineMetadata = metadata;

    await adminDb.collection('files').doc(fileId).update(updateData);
    res.json({ success: true });
  } catch (err) {
    console.error('[pipeline/webhook] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to process webhook.' });
  }
});

export default router;
