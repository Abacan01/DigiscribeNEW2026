import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { adminDb } from './firebaseAdmin.js';
import { verifyAuth, verifyAdmin } from './middleware/authMiddleware.js';
import usersRouter from './routes/users.js';
import filesRouter from './routes/files.js';
import pipelineRouter from './routes/pipeline.js';
import transcriptionsRouter from './routes/transcriptions.js';
import foldersRouter from './routes/folders.js';
import { isVideoPlatformUrl, downloadWithYtdlp } from './services/ytdlp.js';
import { uploadToFtp, uploadBufferToFtp, appendBufferToFtp, moveOnFtp, downloadFromFtp, streamFromFtp, ftpFileSize, deleteFromFtp } from './services/ftp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_VERCEL = !!process.env.VERCEL;
const app = express();
const PORT = process.env.PORT || 3001;

// Email transporter (optional — only active when SMTP_USER/PASS are configured)
let emailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  console.log('[email] SMTP transporter configured.');
} else {
  console.log('[email] SMTP not configured — quote notifications will be skipped.');
}

console.log('[startup] adminDb initialized:', !!adminDb);

// Temporary directory for chunk uploads and in-flight processing
// Vercel serverless functions can only write to /tmp
const chunksDir = IS_VERCEL ? '/tmp/chunks' : path.join(__dirname, 'chunks');
if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir, { recursive: true });

// CORS — allow dev + production origins
// FRONTEND_URL supports comma-separated values, e.g.:
//   https://digiscribedev2026.onrender.com,https://devteam.digiscribeasiapacific.com
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
    : []),
].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // CSP handled by frontend meta tags / Vercel headers
  crossOriginEmbedderPolicy: false, // Allow embedding media from FTP proxy
}));

// ── Rate limiting ──────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                  // strict limit on public quote form
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many quote submissions. Please try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,                 // uploads send many chunk requests
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Upload rate limit exceeded. Please try again later.' },
});

app.use('/api/quote', quoteLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '1mb' }));

// Accept any image/*, audio/*, video/* MIME type.
// Admins can also upload document types (PDF, Word, etc.)
function isAllowedMime(mime, role) {
  if (!mime) return false;
  if (mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/')) return true;
  if (role === 'admin') {
    const docTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ];
    return docTypes.includes(mime);
  }
  return false;
}

function getFileCategory(mimeType) {
  if (mimeType?.startsWith('video/')) return 'Video';
  if (mimeType?.startsWith('audio/')) return 'Audio';
  if (mimeType?.startsWith('image/')) return 'Image';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType?.startsWith('application/')) return 'Document';
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

function getTempChunkRemotePath(uploadId, chunkIndex) {
  const safeUploadId = String(uploadId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `_chunks/${safeUploadId}/chunk-${chunkIndex}`;
}

function getAssemblingRemotePath(uploadId) {
  const safeUploadId = String(uploadId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `_assembling/${safeUploadId}.bin`;
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
  // Documents (admin uploads)
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain', '.csv': 'text/csv',
};

// Multer for chunk uploads — enforce 10 MB per-chunk limit to prevent memory exhaustion
const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CHUNK_SIZE },
});

// ── SSRF protection for URL uploads ────────────────────────────────────────
// Block internal/private IP ranges and cloud metadata endpoints
function isPrivateOrReservedHost(hostname) {
  // Block cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return true;
  // Block localhost variants
  if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname)) return true;
  // Block private RFC-1918 ranges
  const ipParts = hostname.split('.').map(Number);
  if (ipParts.length === 4 && ipParts.every(p => !isNaN(p))) {
    if (ipParts[0] === 10) return true;
    if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return true;
    if (ipParts[0] === 192 && ipParts[1] === 168) return true;
    if (ipParts[0] === 0) return true;
  }
  return false;
}

function validateExternalUrl(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error('Invalid URL.');
  }
  // Only allow http/https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed.');
  }
  if (isPrivateOrReservedHost(parsed.hostname)) {
    throw new Error('URLs pointing to internal or private networks are not allowed.');
  }
  return parsed;
}

// ── Timing-safe string comparison ──────────────────────────────────────────
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against itself to burn the same time, then return false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// ── HTML escaping for email templates ──────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mount API routes
app.use('/api/admin', usersRouter);
app.use('/api/files', filesRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/transcriptions', transcriptionsRouter);
app.use('/api/folders', foldersRouter);

// POST /api/upload/chunk - receive a single chunk (auth required)
app.post('/api/upload/chunk', verifyAuth, chunkUpload.single('chunk'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No chunk received.' });

  const { uploadId, chunkIndex } = req.body || {};
  if (!uploadId || chunkIndex === undefined) {
    return res.status(400).json({ success: false, error: 'Missing uploadId or chunkIndex.' });
  }

  try {
    if (IS_VERCEL) {
      const remoteChunkPath = getTempChunkRemotePath(uploadId, chunkIndex);

      // Idempotency guard: if this chunk already exists remotely, treat as success.
      try {
        await ftpFileSize(remoteChunkPath);
        return res.json({ success: true, dedup: true });
      } catch {
        // chunk not found remotely; continue
      }

      const assemblingPath = getAssemblingRemotePath(uploadId);

      // Store chunk artifact for validation/retry
      await uploadBufferToFtp(req.file.buffer, remoteChunkPath);

      // Build remote assembled file incrementally to make /complete fast.
      if (Number(chunkIndex) === 0) {
        await uploadBufferToFtp(req.file.buffer, assemblingPath);
      } else {
        await appendBufferToFtp(req.file.buffer, assemblingPath);
      }

      return res.json({ success: true });
    }

    const chunkPath = path.join(chunksDir, `${uploadId}-chunk-${chunkIndex}`);
    await fs.promises.writeFile(chunkPath, req.file.buffer);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to write chunk.' });
  }
});

// POST /api/upload/complete - assemble chunks into final file (auth required)
app.post('/api/upload/complete', verifyAuth, async (req, res) => {
  try {
    const { uploadId, fileName, totalChunks, mimeType, description, serviceCategory, folderId } = req.body;

    console.log('[upload/complete] Received fileName:', fileName);

    if (!uploadId || !fileName || !totalChunks) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    if (!isAllowedMime(mimeType, req.user.role)) {
      return res.status(400).json({ success: false, error: `File type "${mimeType}" is not allowed.` });
    }

    // Build structured storage path
    const storageSub = buildStoragePath(serviceCategory, mimeType);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalName = `${Date.now()}-${safeName}`;
    const storagePath = `${storageSub}/${finalName}`;
    let finalSize = 0;

    if (IS_VERCEL) {
      // Ensure all chunks were received remotely before finalizing.
      for (let i = 0; i < totalChunks; i++) {
        const remoteChunkPath = getTempChunkRemotePath(uploadId, i);
        try {
          await ftpFileSize(remoteChunkPath);
        } catch {
          return res.status(400).json({ success: false, error: `Missing chunk ${i}.` });
        }
      }

      const assemblingPath = getAssemblingRemotePath(uploadId);
      finalSize = await ftpFileSize(assemblingPath);

      // Move assembled temp file into final structured storage path (no re-upload copy).
      await moveOnFtp(assemblingPath, storagePath);

      // Clean up remote chunk artifacts
      for (let i = 0; i < totalChunks; i++) {
        const remoteChunkPath = getTempChunkRemotePath(uploadId, i);
        await deleteFromFtp(remoteChunkPath);
      }
    } else {
      const storageDir = path.join(chunksDir, 'assemble-tmp');
      if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

      const finalPath = path.join(storageDir, finalName);
      const writeStream = fs.createWriteStream(finalPath);

      const appendChunkToStream = (chunkPath) => new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);

        const onReadError = (err) => {
          cleanup();
          reject(err);
        };

        const onWriteError = (err) => {
          cleanup();
          reject(err);
        };

        const onReadEnd = () => {
          cleanup();
          resolve();
        };

        const cleanup = () => {
          readStream.off('error', onReadError);
          readStream.off('end', onReadEnd);
          writeStream.off('error', onWriteError);
        };

        readStream.on('error', onReadError);
        readStream.on('end', onReadEnd);
        writeStream.on('error', onWriteError);
        readStream.pipe(writeStream, { end: false });
      });

      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunksDir, `${uploadId}-chunk-${i}`);
        if (!fs.existsSync(chunkPath)) {
          writeStream.destroy();
          if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
          return res.status(400).json({ success: false, error: `Missing chunk ${i}.` });
        }

        await appendChunkToStream(chunkPath);
      }

      writeStream.end();
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      const stats = await fs.promises.stat(finalPath);
      finalSize = stats.size;

      // Clean up local chunk files
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunksDir, `${uploadId}-chunk-${i}`);
        if (fs.existsSync(chunkPath)) {
          await fs.promises.unlink(chunkPath).catch(() => {});
        }
      }

      await uploadToFtp(finalPath, storagePath);
      await fs.promises.unlink(finalPath).catch(() => {});
    }

    // Save metadata to Firestore
    let fileId = null;
    if (adminDb) {
      console.log('[upload/complete] Writing metadata to Firestore for:', finalName);
      const docRef = await adminDb.collection('files').add({
        originalName: fileName,
        savedAs: finalName,
        storagePath,
        size: finalSize,
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
      file: { originalName: fileName, savedAs: finalName, size: finalSize, type: mimeType },
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

  // SSRF protection: validate the URL before fetching
  try {
    validateExternalUrl(url);
  } catch (valErr) {
    return res.status(400).json({ success: false, error: valErr.message });
  }

  try {
    let finalName, finalPath, contentType, originalName;

    // For video platforms, use yt-dlp to extract the actual media
    if (isVideoPlatformUrl(url)) {
      try {
        const result = await downloadWithYtdlp(url, chunksDir);
        finalPath = result.filePath;
        finalName = result.fileName;
        contentType = result.mimeType;
        originalName = result.originalName;
      } catch (ytErr) {
        // yt-dlp unavailable or download failed — save as embed-only entry so the
        // frontend can display an inline player instead of a downloadable file.
        console.warn('[upload/url] yt-dlp failed, falling back to embed:', ytErr.message);
        const displayName = customName?.trim() || url;
        let fileId = null;
        if (adminDb) {
          const docRef = await adminDb.collection('files').add({
            originalName: displayName,
            savedAs: null,
            storagePath: null,
            size: 0,
            type: null,
            fileCategory: 'Video',
            uploadedBy: req.user.uid,
            uploadedByEmail: req.user.email || '',
            uploadedAt: new Date(),
            status: 'pending',
            description: description || '',
            serviceCategory: serviceCategory || '',
            sourceType: 'url',
            sourceUrl: url,
            folderId: folderId || null,
            url: null,
          });
          fileId = docRef.id;
        }
        return res.json({
          success: true,
          embedded: true,
          message: `Saved as embedded link — direct download unavailable.`,
          file: { originalName: displayName, savedAs: null, size: 0, type: null },
          fileId,
        });
      }
    } else {
      // Direct URL — just fetch normally
      const fetched = await fetchUrlDirect(url, chunksDir);
      finalPath = fetched.finalPath;
      finalName = fetched.finalName;
      contentType = fetched.contentType;
      originalName = fetched.originalName;
    }

    const storageSub = buildStoragePath(serviceCategory, contentType);
    const storagePath = `${storageSub}/${finalName}`;
    const stats = fs.statSync(finalPath);
    const displayName = customName?.trim() || originalName;

    // Upload to FTP, then remove local temp
    await uploadToFtp(finalPath, storagePath);
    fs.unlinkSync(finalPath);

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
  // Re-validate to ensure SSRF protection even if called from another path
  validateExternalUrl(url);

  const response = await fetch(url, { redirect: 'manual' });
  // Block redirects to prevent SSRF bypass via open redirects
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      try { validateExternalUrl(location); } catch {
        throw new Error('URL redirects to a disallowed destination.');
      }
    }
    throw new Error('URL responded with redirect. Please use the direct file URL.');
  }
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

    const tempFiles = [];
    for (const file of files) {
      if (!file.storagePath && !file.savedAs) continue;
      const remotePath = file.storagePath || file.savedAs;
      const tmpFile = path.join(chunksDir, `dl-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      try {
        await downloadFromFtp(remotePath, tmpFile);
        archive.file(tmpFile, { name: file.originalName || path.basename(remotePath) });
        tempFiles.push(tmpFile);
      } catch (dlErr) {
        console.warn('[bulk-download] Could not download:', remotePath, dlErr.message);
      }
    }

    await archive.finalize();
    // Clean up temp files after archiving
    for (const tmp of tempFiles) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
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
      const remotePath = fileData.storagePath || fileData.savedAs;
      if (remotePath) {
        await deleteFromFtp(remotePath);
      }

      await docRef.delete();
      deleted++;
    }

    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/bulk-move - Move multiple files to a folder (auth required)
app.post('/api/files/bulk-move', verifyAuth, async (req, res) => {
  const { fileIds, folderId } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, error: 'fileIds array is required.' });
  }
  try {
    // If folderId specified, verify folder exists
    if (folderId) {
      const folderDoc = await adminDb.collection('folders').doc(folderId).get();
      if (!folderDoc.exists) {
        return res.status(404).json({ success: false, error: 'Folder not found.' });
      }
    }
    let moved = 0;
    for (const id of fileIds) {
      const docRef = adminDb.collection('files').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) continue;
      const fileData = doc.data();
      // Non-admins can only move their own files
      if (req.user.role !== 'admin' && fileData.uploadedBy !== req.user.uid) continue;
      await docRef.update({ folderId: folderId || null, updatedAt: new Date() });
      moved++;
    }
    res.json({ success: true, moved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/bulk-status - Bulk change status (admin only)
app.post('/api/files/bulk-status', verifyAdmin, async (req, res) => {
  const { fileIds, status } = req.body;
  const validStatuses = ['pending', 'in-progress', 'transcribed'];
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ success: false, error: 'fileIds array is required.' });
  }
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status.` });
  }
  try {
    let updated = 0;
    for (const id of fileIds) {
      const docRef = adminDb.collection('files').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) continue;
      await docRef.update({ status, updatedAt: new Date() });
      updated++;
    }
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/download-folder/:folderId - Download entire folder as ZIP (auth required)
app.post('/api/files/download-folder/:folderId', verifyAuth, async (req, res) => {
  const { folderId } = req.params;
  try {
    // Get all files in this folder (and optionally subfolders)
    let query = adminDb.collection('files').where('folderId', '==', folderId);
    if (req.user.role !== 'admin') {
      query = query.where('uploadedBy', '==', req.user.uid);
    }
    const snapshot = await query.get();
    const files = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (files.length === 0) {
      return res.status(404).json({ success: false, error: 'No files in this folder.' });
    }

    // Get folder name for zip filename
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    const folderName = folderDoc.exists ? (folderDoc.data().name || 'folder') : 'folder';
    const safeFolderName = folderName.replace(/[^a-z0-9_\-]/gi, '_');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFolderName}-${Date.now()}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.on('error', (err) => { if (!res.headersSent) res.status(500).json({ success: false, error: err.message }); });
    archive.pipe(res);

    const tempFiles = [];
    for (const file of files) {
      if (!file.storagePath && !file.savedAs) continue;
      const remotePath = file.storagePath || file.savedAs;
      const tmpFile = path.join(chunksDir, `folderdl-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      try {
        await downloadFromFtp(remotePath, tmpFile);
        archive.file(tmpFile, { name: file.originalName || path.basename(remotePath) });
        tempFiles.push(tmpFile);
      } catch (dlErr) {
        console.warn('[folder-download] Could not download:', remotePath, dlErr.message);
      }
    }

    await archive.finalize();
    for (const tmp of tempFiles) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// POST /api/quote - Public contact/quote form submission
app.post('/api/quote', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ success: false, error: 'Email and message are required.' });
    }

    // Input length validation to prevent abuse
    if (String(email).length > 254 || String(message).length > 10000 ||
        String(firstName || '').length > 100 || String(lastName || '').length > 100 ||
        String(phone || '').length > 30) {
      return res.status(400).json({ success: false, error: 'Input exceeds maximum allowed length.' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }

    // Store in Firestore
    await adminDb.collection('quotes').add({
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      phone: phone || '',
      subject: subject || 'service-details',
      message,
      submittedAt: new Date().toISOString(),
    });

    res.json({ success: true });

    // Send email notification if SMTP is configured (fire-and-forget)
    if (emailTransporter) {
      (async () => {
        // Read notification email from Firestore settings, fallback to env var
        let notificationEmail = process.env.QUOTE_EMAIL || '';
        try {
          const settingsDoc = await adminDb.collection('settings').doc('notifications').get();
          if (settingsDoc.exists && settingsDoc.data().quoteEmail) {
            notificationEmail = settingsDoc.data().quoteEmail;
          }
        } catch {}

        if (!notificationEmail) return;

        const subjectLabels = {
          'service-details': 'Service Details',
          'service-status': 'Service Status',
          'general-inquiry': 'General Inquiry',
          'transcription': 'Transcription',
        };
        const subjectLabel = subjectLabels[subject] || 'General';
        const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';

        // Escape ALL user-supplied values before interpolating into HTML
        const safeFullName = escapeHtml(fullName);
        const safeEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone || 'N/A');
        const safeSubjectLabel = escapeHtml(subjectLabel);
        const safeMessage = escapeHtml(message);

        emailTransporter.sendMail({
          from: `"DigiScribe Website" <${process.env.SMTP_USER}>`,
          to: notificationEmail,
          replyTo: email,
          subject: `New Quote Request: ${subjectLabel} — ${fullName}`,
          text: `New quote/contact form submission:\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSubject: ${subjectLabel}\n\nMessage:\n${message}`,
          html: `<h2 style="color:#0284c7">New Quote Request</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;font-size:14px">
<tr style="background:#f8fafc"><td style="padding:10px 14px;font-weight:600;color:#374151;width:120px">Name</td><td style="padding:10px 14px;color:#111">${safeFullName}</td></tr>
<tr><td style="padding:10px 14px;font-weight:600;color:#374151">Email</td><td style="padding:10px 14px"><a href="mailto:${safeEmail}" style="color:#0284c7">${safeEmail}</a></td></tr>
<tr style="background:#f8fafc"><td style="padding:10px 14px;font-weight:600;color:#374151">Phone</td><td style="padding:10px 14px;color:#111">${safePhone}</td></tr>
<tr><td style="padding:10px 14px;font-weight:600;color:#374151">Subject</td><td style="padding:10px 14px;color:#111">${safeSubjectLabel}</td></tr>
</table>
<h3 style="color:#374151;font-family:sans-serif;margin-top:20px">Message</h3>
<p style="font-family:sans-serif;font-size:14px;color:#374151;white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e5e7eb">${safeMessage}</p>`,
        })
          .then(() => console.log('[quote] Email sent to', notificationEmail))
          .catch(emailErr => console.error('[quote] Email send failed:', emailErr.message));
      })();
    }
  } catch (err) {
    console.error('[quote] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to submit. Please try again.' });
  }
});

// GET /api/admin/settings - Get admin notification settings
app.get('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const doc = await adminDb.collection('settings').doc('notifications').get();
    const data = doc.exists ? doc.data() : {};
    res.json({ success: true, settings: { quoteEmail: data.quoteEmail || process.env.QUOTE_EMAIL || '' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/settings - Update admin notification settings
app.put('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const { quoteEmail } = req.body;
    await adminDb.collection('settings').doc('notifications').set({ quoteEmail: quoteEmail || '' }, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/* - Serve uploaded files via FTP proxy with range request support
// Requires authentication to prevent unauthorized file access
app.get('/api/files/*path', verifyAuth, async (req, res) => {
  // req.params.path is an array of decoded segments in this Express version
  const segments = Array.isArray(req.params.path) ? req.params.path : [req.params.path];
  let requestPath;
  try {
    // decodeURIComponent handles old Firestore records that stored %2F-encoded paths
    requestPath = decodeURIComponent(segments.join('/'));
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid file path encoding.' });
  }

  // Skip metadata routes
  if (requestPath.startsWith('metadata')) return res.status(404).json({ success: false, error: 'Not found.' });

  // Prevent path traversal
  const normalized = path.posix.normalize(requestPath).replace(/^(\.\.(\/|$))+/, '');

  const safeName = path.basename(normalized);
  const ext = path.extname(safeName).toLowerCase();
  const mime = EXT_TO_MIME[ext] || 'application/octet-stream';

  let fileSize;
  try {
    fileSize = await ftpFileSize(normalized);
  } catch {
    return res.status(404).json({ success: false, error: 'File not found on FTP.' });
  }

  const isDownload = req.query.download === '1';
  res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${safeName}"`);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mime);

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
    const parsedStart = parseInt(startStr, 10);
    const start = Number.isFinite(parsedStart) ? parsedStart : 0;
    const parsedEnd = endStr ? parseInt(endStr, 10) : NaN;
    const fallbackEnd = Math.min(start + (4 * 1024 * 1024) - 1, fileSize - 1);
    const end = Number.isFinite(parsedEnd)
      ? Math.min(Math.max(parsedEnd, start), fileSize - 1)
      : fallbackEnd;

    if (start >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }

    const chunkSize = end - start + 1;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    res.status(206);

    try {
      await streamFromFtp(normalized, res, { startAt: start, maxBytes: chunkSize });
    } catch (err) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, error: 'Failed to stream file.' });
      }
    }
  } else {
    res.setHeader('Content-Length', fileSize);
    res.status(200);

    try {
      await streamFromFtp(normalized, res, { startAt: 0 });
    } catch {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, error: 'Failed to stream file.' });
      }
    }
  }
});

// --- Serve React build (production, non-Vercel only — Vercel serves static files natively) ---
if (!IS_VERCEL) {
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Catch-all: serve index.html for React Router client-side routes
    app.get('*splat', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// --- Start server (used by cPanel Passenger & local dev, skipped on Vercel) ---
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`FTP host: ${process.env.FTP_HOST || '(not configured)'}`);
    console.log(`FTP base path: ${process.env.FTP_BASE_PATH || 'uploads'}`);
  });
}

// Export for Vercel serverless functions & Passenger (cPanel Node.js)
export default app;
