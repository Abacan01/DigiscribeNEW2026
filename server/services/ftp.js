import { Client } from 'basic-ftp';
import path from 'path';
import { Readable, PassThrough } from 'stream';

export const FTP_BASE = process.env.FTP_BASE_PATH || 'uploads';

/**
 * Creates and connects an FTP client using Explicit FTPS.
 */
async function createClient() {
  const client = new Client();
  await client.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: true, // explicit TLS (FTPES / "Explicit FTP over TLS")
    secureOptions: {
      // Shared hosting FTP servers often use the provider's wildcard cert
      // (e.g. *.us.cloudlogin.co) rather than the customer's domain.
      rejectUnauthorized: false,
    },
  });
  return client;
}

/**
 * Uploads a local file to the FTP server.
 * Creates any required remote directories automatically.
 *
 * @param {string} localPath  - Absolute path to the local file
 * @param {string} remotePath - Path relative to FTP_BASE (e.g. "Video/2025/01/1234-file.mp4")
 */
export async function uploadToFtp(localPath, remotePath) {
  const client = await createClient();
  try {
    const fullRemote = `${FTP_BASE}/${remotePath}`;
    const remoteDir = path.posix.dirname(fullRemote);
    await client.ensureDir(remoteDir);
    // ensureDir changes cwd — reset to root before uploading to use absolute path
    await client.cd('/');
    await client.uploadFrom(localPath, fullRemote);
  } finally {
    client.close();
  }
}

/**
 * Uploads a readable stream to the FTP server.
 *
 * @param {Readable} readable  - Source readable stream
 * @param {string} remotePath  - Path relative to FTP_BASE
 */
export async function uploadStreamToFtp(readable, remotePath) {
  const client = await createClient();
  try {
    const fullRemote = `${FTP_BASE}/${remotePath}`;
    const remoteDir = path.posix.dirname(fullRemote);
    await client.ensureDir(remoteDir);
    await client.cd('/');
    await client.uploadFrom(readable, fullRemote);
  } finally {
    client.close();
  }
}

/**
 * Uploads an in-memory Buffer to the FTP server.
 *
 * @param {Buffer} buffer     - File content as Buffer
 * @param {string} remotePath - Path relative to FTP_BASE
 */
export async function uploadBufferToFtp(buffer, remotePath) {
  const client = await createClient();
  try {
    const fullRemote = `${FTP_BASE}/${remotePath}`;
    const remoteDir = path.posix.dirname(fullRemote);
    await client.ensureDir(remoteDir);
    await client.cd('/');
    await client.uploadFrom(Readable.from(buffer), fullRemote);
  } finally {
    client.close();
  }
}

/**
 * Downloads a file from the FTP server to a local path.
 *
 * @param {string} remotePath - Path relative to FTP_BASE
 * @param {string} localPath  - Absolute local destination path
 */
export async function downloadFromFtp(remotePath, localPath) {
  const client = await createClient();
  try {
    await client.downloadTo(localPath, `${FTP_BASE}/${remotePath}`);
  } finally {
    client.close();
  }
}

/**
 * Streams a file from the FTP server directly into a writable stream.
 * Useful for piping FTP file content directly to an HTTP response.
 *
 * @param {string}   remotePath     - Path relative to FTP_BASE
 * @param {Writable} writableStream - Destination writable stream
 */
export async function streamFromFtp(remotePath, writableStream) {
  const client = await createClient();
  try {
    await client.downloadTo(writableStream, `${FTP_BASE}/${remotePath}`);
  } finally {
    client.close();
  }
}

/**
 * Downloads a remote file into memory as a Buffer.
 * Intended for small-to-medium chunks (e.g. upload chunk blocks).
 *
 * @param {string} remotePath - Path relative to FTP_BASE
 * @returns {Promise<Buffer>}
 */
export async function downloadBufferFromFtp(remotePath) {
  const client = await createClient();
  try {
    const parts = [];
    const sink = new PassThrough();
    sink.on('data', (chunk) => {
      parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    await client.downloadTo(sink, `${FTP_BASE}/${remotePath}`);
    return Buffer.concat(parts);
  } finally {
    client.close();
  }
}

/**
 * Returns the size (in bytes) of a remote file.
 *
 * @param {string} remotePath - Path relative to FTP_BASE
 * @returns {Promise<number>}
 */
export async function ftpFileSize(remotePath) {
  const client = await createClient();
  try {
    return await client.size(`${FTP_BASE}/${remotePath}`);
  } finally {
    client.close();
  }
}

/**
 * Deletes a file from the FTP server.
 * Silently ignores errors (e.g. file already deleted).
 *
 * @param {string} remotePath - Path relative to FTP_BASE
 */
export async function deleteFromFtp(remotePath) {
  const client = await createClient();
  try {
    await client.remove(`${FTP_BASE}/${remotePath}`);
  } catch (err) {
    console.warn('[ftp] delete warning:', err.message);
  } finally {
    client.close();
  }
}
