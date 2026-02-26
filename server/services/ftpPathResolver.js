import path from 'path';

/**
 * Sanitise a folder name for use as a safe FTP directory component.
 * Replaces anything that is not alphanumeric, space, underscore, hyphen, or period
 * with an underscore, then collapses consecutive underscores.
 */
function sanitizeName(name) {
  return (name || 'Untitled')
    .replace(/[^a-zA-Z0-9 _\-().]/g, '_')
    .replace(/_+/g, '_')
    .trim() || 'Untitled';
}

/**
 * Resolves the full FTP directory path for a Firestore folder by walking up
 * the parentId chain.
 *
 * @param {string} folderId - Firestore folder document ID
 * @param {FirebaseFirestore.Firestore} db - Admin Firestore instance
 * @returns {Promise<string>} The folder path relative to FTP_BASE, e.g. "ProjectA/SubProject"
 */
export async function resolveFolderFtpPath(folderId, db) {
  if (!folderId) return '';
  const parts = [];
  let currentId = folderId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId)) break; // guard against circular refs
    visited.add(currentId);
    const doc = await db.collection('folders').doc(currentId).get();
    if (!doc.exists) break;
    const data = doc.data();
    parts.unshift(sanitizeName(data.name));
    currentId = data.parentId || null;
  }

  return parts.join('/');
}

/**
 * Computes the FTP storage path for a file, given its folder (or null for root).
 * - Files in a folder: {folderPath}/{savedAs}
 * - Files at root: kept at their original storagePath (unchanged)
 *
 * @param {object} fileData - Firestore file document data
 * @param {string|null} targetFolderId - Target folder ID (null = root)
 * @param {FirebaseFirestore.Firestore} db - Admin Firestore instance
 * @returns {Promise<string>} New storagePath
 */
export async function computeFileFtpPath(fileData, targetFolderId, db) {
  const fileName = fileData.savedAs || path.posix.basename(fileData.storagePath || '');
  if (!fileName) return fileData.storagePath || '';

  if (!targetFolderId) {
    // Moving to root — use the original service-category path if available,
    // otherwise fall back to _root/{filename}
    if (fileData.originalStoragePath) return fileData.originalStoragePath;
    return fileData.storagePath || `_root/${fileName}`;
  }

  const folderPath = await resolveFolderFtpPath(targetFolderId, db);
  return folderPath ? `${folderPath}/${fileName}` : fileName;
}

/**
 * Recursively collects all descendant folder IDs of a given folder.
 *
 * @param {string} folderId
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<string[]>} Array of folder IDs (not including the given one)
 */
export async function getDescendantFolderIds(folderId, db) {
  const ids = [];
  const queue = [folderId];

  while (queue.length > 0) {
    const current = queue.shift();
    const snap = await db.collection('folders').where('parentId', '==', current).get();
    for (const doc of snap.docs) {
      ids.push(doc.id);
      queue.push(doc.id);
    }
  }

  return ids;
}

/**
 * Updates storagePath and url for all files inside a folder (and its descendants)
 * after the folder's FTP path changed (e.g. folder renamed or moved).
 *
 * @param {string} folderId - The folder whose FTP path changed
 * @param {FirebaseFirestore.Firestore} db
 */
export async function updateDescendantFilePaths(folderId, db) {
  const allFolderIds = [folderId, ...(await getDescendantFolderIds(folderId, db))];

  for (const fid of allFolderIds) {
    const folderPath = await resolveFolderFtpPath(fid, db);
    const filesSnap = await db.collection('files').where('folderId', '==', fid).get();

    for (const fileDoc of filesSnap.docs) {
      const data = fileDoc.data();
      const fileName = data.savedAs || path.posix.basename(data.storagePath || '');
      if (!fileName) continue;

      const newStoragePath = folderPath ? `${folderPath}/${fileName}` : fileName;
      const encodedPath = newStoragePath.split('/').map(encodeURIComponent).join('/');

      await fileDoc.ref.update({
        storagePath: newStoragePath,
        url: `/api/files/${encodedPath}`,
        updatedAt: new Date(),
      });
    }
  }
}

export { sanitizeName };
