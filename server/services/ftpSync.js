/**
 * FTP ↔ Firestore reconciliation service.
 *
 * Periodically checks if files tracked in Firestore still exist on the FTP
 * server. If a file has been deleted from FTP, the corresponding Firestore
 * document is removed so the dashboard stays in sync.
 */

import { existsOnFtp } from './ftp.js';

const BATCH_SIZE = 20;          // check N files per cycle
const CYCLE_INTERVAL_MS = 60_000; // run every 60 seconds

let timer = null;
let running = false;

/**
 * Run one reconciliation cycle: pick a batch of files from Firestore and
 * verify each one still exists on FTP.  Any that are missing get deleted.
 *
 * @param {import('firebase-admin/firestore').Firestore} db - Admin Firestore instance
 */
export async function reconcileOnce(db) {
  if (running) return { checked: 0, removed: 0 };
  running = true;

  let checked = 0;
  let removed = 0;

  try {
    // Only check files that have a storagePath (actual FTP-hosted files)
    const snapshot = await db
      .collection('files')
      .where('storagePath', '!=', null)
      .limit(BATCH_SIZE)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const remotePath = data.storagePath || data.savedAs;
      if (!remotePath) continue;

      // Embedded URL entries have no file on FTP
      if (data.sourceType === 'url' && !data.savedAs) continue;

      checked++;

      const exists = await existsOnFtp(remotePath);
      if (!exists) {
        console.log(`[ftp-sync] File missing on FTP, removing Firestore doc ${doc.id}: ${remotePath}`);
        await doc.ref.delete();
        removed++;
      }
    }
  } catch (err) {
    console.error('[ftp-sync] reconciliation error:', err.message);
  } finally {
    running = false;
  }

  return { checked, removed };
}

/**
 * Start the background reconciliation loop.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {number} intervalMs - Override the default cycle interval
 */
export function startFtpSync(db, intervalMs = CYCLE_INTERVAL_MS) {
  if (timer) return; // already running
  console.log(`[ftp-sync] Starting background reconciliation every ${intervalMs / 1000}s`);

  const run = async () => {
    const { checked, removed } = await reconcileOnce(db);
    if (removed > 0) {
      console.log(`[ftp-sync] Cycle done — checked ${checked}, removed ${removed}`);
    }
  };

  // First run after a short delay to let the server finish starting
  setTimeout(run, 5000);
  timer = setInterval(run, intervalMs);
}

/**
 * Stop the background reconciliation loop.
 */
export function stopFtpSync() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[ftp-sync] Background reconciliation stopped');
  }
}
