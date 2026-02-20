import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { adminDb } from './firebaseAdmin.js';
import { verifyAuth, verifyAdmin } from './middleware/authMiddleware.js';
import usersRouter from './routes/users.js';
import filesRouter from './routes/files.js';
import pipelineRouter from './routes/pipeline.js';
import transcriptionsRouter from './routes/transcriptions.js';
import foldersRouter from './routes/folders.js';
import { isVideoPlatformUrl, downloadWithYtdlp } from './services/ytdlp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

console.log('[startup] adminDb initialized:', !!adminDb);

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const chunksDir = path.join(__dirname, 'chunks');
for (const dir of [uploadsDir, chunksDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// CORS — allow dev + production origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,  // set this to your domain, e.g. https://yourdomain.com
].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Accept any image/*, audio/*, video/* MIME type
function isAllowedMime(mime) {
  return mime && (mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/'));
}

function getFileCategory(mimeType) {
  if (mimeType?.startsWith('video/')) return 'Video';
  if (mimeType?.startsWith('audio/')) return 'Audio';
  if (mimeType?.startsWith('image/')) return 'Image';
  return 'Other';
}

// Build structured storage path: {serviceCategory}/{year}/{month}/{fileCategory}
// Always uses forward slashes (URL-safe) regardless of OS.
function buildStoragePath(serviceCategory, mimeType) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const category = getFileCategory(mimeType);
  const catDir = (serviceCategory || 'Uncategorized').replace(/[^a-zA-Z0-9_-]/g, '_');
  return [catDir, year, month, category].join('/');
}

// Encode each path segment individually so slashes remain literal slashes in URLs.
function encodeStorageUrl(storagePath) {
  return storagePath.split('/').map(encodeURIComponent).join('/');
}

const EXT_TO_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  '.bmp': 'image/bmp', '.svg': 'image/svg+xml', '.avif': 'image/avif',
  '.heic': 'image/heic', '.heif': 'image/heif',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.aac': 'audio/aac',
  '.flac': 'audio/flac', '.m4a': 'audio/mp4', '.opus': 'audio/opus',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska',
  '.wmv': 'video/x-ms-wmv', '.m4v': 'video/mp4',
};

// Multer for chunk uploads
const chunkUpload = multer({ storage: multer.memoryStorage() });

// Mount API routes
app.use('/api/admin', usersRouter);
app.use('/api/files', filesRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/transcriptions', transcriptionsRouter);
app.use('/api/folders', foldersRouter);

// POST /api/upload/chunk - receive a single chunk (auth required)
app.post('/api/upload/chunk', verifyAuth, chunkUpload.single('chunk'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No chunk received.' });

  const { uploadId, chunkIndex } = req.body || {};
  if (!uploadId || chunkIndex === undefined) {
    return res.status(400).json({ success: false, error: 'Missing uploadId or chunkIndex.' });
  }

  const chunkPath = path.join(chunksDir, `${uploadId}-chunk-${chunkIndex}`);
  fs.writeFileSync(chunkPath, req.file.buffer);

  res.json({ success: true });
});

// POST /api/upload/complete - assemble chunks into final file (auth required)
app.post('/api/upload/complete', verifyAuth, async (req, res) => {
  try {
    const { uploadId, fileName, totalChunks, mimeType, description, serviceCategory, folderId } = req.body;

    console.log('[upload/complete] Received fileName:', fileName);

    if (!uploadId || !fileName || !totalChunks) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    if (!isAllowedMime(mimeType)) {
      return res.status(400).json({ success: false, error: `File type "${mimeType}" is not allowed.` });
    }

    // Build structured storage path
    const storageSub = buildStoragePath(serviceCategory, mimeType);    const storageDir = path.join(uploadsDir, storageSub);
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalName = `${Date.now()}-${safeName}`;
    const storagePath = `${storageSub}/${finalName}`;
    const finalPath = path.join(uploadsDir, storagePath);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunksDir, `${uploadId}-chunk-${i}`);
      if (!fs.existsSync(chunkPath)) {
        writeStream.destroy();
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
        return res.status(400).json({ success: false, error: `Missing chunk ${i}.` });
      }
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();
    await new Promise((resolve) => writeStream.on('finish', resolve));

    const stats = fs.statSync(finalPath);

    // Clean up chunk files
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunksDir, `${uploadId}-chunk-${i}`);
      if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath);
    }

    // Save metadata to Firestore
    let fileId = null;
    if (adminDb) {
      console.log('[upload/complete] Writing metadata to Firestore for:', finalName);
      const docRef = await adminDb.collection('files').add({
        originalName: fileName,
        savedAs: finalName,
        storagePath,
        size: stats.size,
        type: mimeType,
        fileCategory: getFileCategory(mimeType),
        uploadedBy: req.user.uid,
        uploadedByEmail: req.user.email || '',
        uploadedAt: new Date(),
        status: 'pending',
        description: description || '',
        serviceCategory: serviceCategory || '',
        sourceType: 'file',
        sourceUrl: null,
        folderId: folderId || null,
        url: `/api/files/${encodeStorageUrl(storagePath)}`,
      });
      fileId = docRef.id;
      console.log('[upload/complete] Firestore doc created:', fileId);
    } else {
      console.error('[upload/complete] adminDb is null — metadata not saved for:', finalName);
    }

    res.json({
      success: true,
      message: `"${fileName}" uploaded successfully.`,
      file: { originalName: fileName, savedAs: finalName, size: stats.size, type: mimeType },
      fileId,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Assembly failed.' });
  }
});

// POST /api/upload/url - Upload from URL (auth required)
app.post('/api/upload/url', verifyAuth, async (req, res) => {
  const { url, customName, description, serviceCategory, folderId } = req.body;

  console.log('[upload/url] Received customName:', customName);

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required.' });
  }

  try {
    let finalName, finalPath, contentType, originalName;

    // For video platforms, use yt-dlp to extract the actual media
    if (isVideoPlatformUrl(url)) {
      const result = await downloadWithYtdlp(url, uploadsDir);
      finalPath = result.filePath;
      finalName = result.fileName;
      contentType = result.mimeType;
      originalName = result.originalName;
    } else {
      // Direct URL — just fetch normally
      const fetched = await fetchUrlDirect(url, uploadsDir);
      finalPath = fetched.finalPath;
      finalName = fetched.finalName;
      contentType = fetched.contentType;
      originalName = fetched.originalName;
    }

    // Move file to structured storage path
    const storageSub = buildStoragePath(serviceCategory, contentType);
    const storageDir = path.join(uploadsDir, storageSub);
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

    const storagePath = `${storageSub}/${finalName}`;
    const newPath = path.join(uploadsDir, storagePath);
    if (finalPath !== newPath) {
      fs.renameSync(finalPath, newPath);
      finalPath = newPath;
    }

    const stats = fs.statSync(finalPath);
    const displayName = customName?.trim() || originalName;

    // Save metadata to Firestore
    let fileId = null;
    if (adminDb) {
      console.log('[upload/url] Writing metadata to Firestore for:', finalName);
      const docRef = await adminDb.collection('files').add({
        originalName: displayName,
        savedAs: finalName,
        storagePath,
        size: stats.size,
        type: contentType,
        fileCategory: getFileCategory(contentType),
        uploadedBy: req.user.uid,
        uploadedByEmail: req.user.email || '',
        uploadedAt: new Date(),
        status: 'pending',
        description: description || '',
        serviceCategory: serviceCategory || '',
        sourceType: 'url',
        sourceUrl: url,
        folderId: folderId || null,
        url: `/api/files/${encodeStorageUrl(storagePath)}`,
      });
      fileId = docRef.id;
      console.log('[upload/url] Firestore doc created:', fileId);
    } else {
      console.error('[upload/url] adminDb is null — metadata not saved for:', finalName);
    }

    res.json({
      success: true,
      file: { originalName, savedAs: finalName, size: stats.size, type: contentType },
      fileId,
    });
  } catch (err) {
    console.error('[upload/url] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: direct HTTP fetch for non-platform URLs
async function fetchUrlDirect(url, destDir) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  // Reject HTML responses — the URL returned a web page, not a media file
  if (contentType.includes('text/html')) {
    throw new Error('The URL returned an HTML page instead of a media file. Use a direct link to the file, or try a supported video platform URL.');
  }
  const urlPath = new URL(url).pathname;
  const originalName = path.basename(urlPath) || 'downloaded-file';
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const finalName = `${Date.now()}-${safeName}`;
  const finalPath = path.join(destDir, finalName);

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(finalPath, buffer);

  return { finalPath, finalName, contentType, originalName };
}

// POST /api/files/bulk-download - Download multiple files as a zip (auth required)
app.post('/api/files/bulk-download', verifyAuth, async (req, res) => {
  const { fileIds } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, error: 'fileIds array is required.' });
  }

  try {
    // Fetch file docs
    const docs = await Promise.all(fileIds.map((id) => adminDb.collection('files').doc(id).get()));
    const files = docs.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }));

    if (files.length === 0) {
      return res.status(404).json({ success: false, error: 'No files found.' });
    }

    // Non-admins can only download their own files
    if (req.user.role !== 'admin') {
      const unauthorized = files.find((f) => f.uploadedBy !== req.user.uid);
      if (unauthorized) {
        return res.status(403).json({ success: false, error: 'Access denied to one or more files.' });
      }
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="digiscribe-files-${Date.now()}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.on('error', (err) => res.status(500).json({ success: false, error: err.message }));
    archive.pipe(res);

    for (const file of files) {
      const filePath = file.storagePath
        ? path.join(uploadsDir, file.storagePath)
        : (file.savedAs ? path.join(uploadsDir, file.savedAs) : null);

      if (filePath && fs.existsSync(filePath)) {
        archive.file(filePath, { name: file.originalName || path.basename(filePath) });
      }
    }

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// POST /api/files/bulk-delete - Delete multiple files (admin only)
app.post('/api/files/bulk-delete', verifyAdmin, async (req, res) => {
  const { fileIds } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, error: 'fileIds array is required.' });
  }

  try {
    let deleted = 0;
    for (const id of fileIds) {
      const docRef = adminDb.collection('files').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) continue;

      const fileData = doc.data();
      const filePath = fileData.storagePath
        ? path.join(uploadsDir, fileData.storagePath)
        : (fileData.savedAs ? path.join(uploadsDir, fileData.savedAs) : null);

      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await docRef.delete();
      deleted++;
    }

    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/* - Serve uploaded files with range request support for video/audio seeking
app.get('/api/files/*path', (req, res) => {
  // req.params.path is an array of decoded segments in this Express version
  const segments = Array.isArray(req.params.path) ? req.params.path : [req.params.path];
  // decodeURIComponent handles old Firestore records that stored %2F-encoded paths
  const requestPath = decodeURIComponent(segments.join('/'));

  // Skip metadata routes
  if (requestPath.startsWith('metadata')) return res.status(404).json({ success: false, error: 'Not found.' });

  // Prevent path traversal
  const normalized = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(uploadsDir, normalized);

  // Verify the resolved path is still within uploadsDir
  if (!fullPath.startsWith(uploadsDir)) {
    return res.status(403).json({ success: false, error: 'Access denied.' });
  }

  // Resolve actual file path (with legacy flat-file fallback)
  let resolvedPath = fullPath;
  if (!fs.existsSync(fullPath)) {
    const safeName = path.basename(normalized);
    const flatPath = path.join(uploadsDir, safeName);
    if (fs.existsSync(flatPath)) {
      resolvedPath = flatPath;
    } else {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }
  }

  const safeName = path.basename(resolvedPath);
  const ext = path.extname(safeName).toLowerCase();
  const mime = EXT_TO_MIME[ext] || 'application/octet-stream';
  const stat = fs.statSync(resolvedPath);
  const fileSize = stat.size;

  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  res.setHeader('Accept-Ranges', 'bytes');

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    // Parse "bytes=start-end"
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }

    const chunkSize = end - start + 1;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', mime);
    res.status(206);
    fs.createReadStream(resolvedPath, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', mime);
    res.status(200);
    fs.createReadStream(resolvedPath).pipe(res);
  }
});

// --- Serve React build (production) ---
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Catch-all: serve index.html for React Router client-side routes
  app.get('*splat', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- Start server (used by cPanel Passenger & local dev) ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Files will be saved to: ${uploadsDir}`);
});

// Export for Passenger (cPanel Node.js)
export default app;
