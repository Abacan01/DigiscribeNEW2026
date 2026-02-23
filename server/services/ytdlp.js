import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Domains where a plain HTTP fetch returns HTML, not the actual media.
// For these we try yt-dlp first.
const VIDEO_PLATFORM_PATTERNS = [
  'youtube.com', 'youtu.be',
  'vimeo.com',
  'dailymotion.com', 'dai.ly',
  'streamable.com',
  'facebook.com', 'fb.watch',
  'twitter.com', 'x.com',
  'instagram.com',
  'tiktok.com', 'vm.tiktok.com',
  'twitch.tv',
  'soundcloud.com',
  'bandcamp.com',
];

// Ensure deno, node, and pip-installed binaries (e.g. ~/.local/bin) are on PATH
const denoDir = path.join(os.homedir(), '.deno', 'bin');
const localBin = path.join(os.homedir(), '.local', 'bin');
const execEnv = { ...process.env };
const extraPaths = [denoDir, localBin].filter((p) => !execEnv.PATH?.includes(p));
if (extraPaths.length) {
  execEnv.PATH = `${extraPaths.join(':')}:${execEnv.PATH || ''}`;
}

/**
 * Returns true if the URL belongs to a video/audio platform
 * that requires yt-dlp to extract the actual media stream.
 */
export function isVideoPlatformUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return VIDEO_PLATFORM_PATTERNS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

// Resolve cookies file path (for YouTube bot-detection bypass).
// Supports two formats for YTDLP_COOKIES_FILE:
//   1. A file path (no newlines) – used as-is
//   2. The full Netscape cookie file content pasted directly into the env var –
//      written to a temp file so yt-dlp can read it.
let cookiesFile = null;
const _cookiesEnv = process.env.YTDLP_COOKIES_FILE;
if (_cookiesEnv) {
  if (_cookiesEnv.includes('\n') || _cookiesEnv.startsWith('# Netscape')) {
    // Env var contains the raw cookie content – write it to a temp file once
    const tmpCookies = path.join(os.tmpdir(), 'ytdlp_cookies.txt');
    try {
      fs.writeFileSync(tmpCookies, _cookiesEnv, 'utf8');
      cookiesFile = tmpCookies;
    } catch (e) {
      console.warn('[ytdlp] Failed to write cookies temp file:', e.message);
    }
  } else {
    cookiesFile = path.resolve(_cookiesEnv);
  }
}

/**
 * Downloads media from a video platform URL using yt-dlp.
 *
 * @param {string} url - The platform URL (e.g. Dailymotion page)
 * @param {string} outputDir - Directory to save the downloaded file
 * @returns {Promise<{filePath: string, fileName: string, mimeType: string}>}
 */
export function downloadWithYtdlp(url, outputDir) {
  return new Promise((resolve, reject) => {
    // Template: timestamp-%(title)s.%(ext)s
    const template = path.join(outputDir, `${Date.now()}-%(title).80B.%(ext)s`);

    const args = [
      url,
      '-f', 'bv*+ba/b',           // best video+audio, or best single stream
      '--merge-output-format', 'mp4',  // merge into mp4 container
      '--no-playlist',              // single video only
      '--force-overwrites',         // timestamp prefix already ensures uniqueness; skip logic breaks --print
      '--restrict-filenames',       // safe filenames
      '-o', template,
      '--print', '%(title)s',            // print clean video title (printed first by yt-dlp)
      '--print', 'after_move:filepath',  // print final path to stdout (printed second)
      '--no-simulate',
      '--js-runtimes', 'deno', '--js-runtimes', 'node',  // use deno or node for JS extraction
    ];

    // Pass cookies file if configured (required for YouTube on server/datacenter IPs)
    if (cookiesFile && fs.existsSync(cookiesFile)) {
      args.push('--cookies', cookiesFile);
    }

    const ytdlpBinEnv = process.env.YTDLP_BIN?.trim();
    const candidates = [
      ytdlpBinEnv ? { cmd: ytdlpBinEnv, argsPrefix: [] } : null,
      { cmd: 'yt-dlp', argsPrefix: [] },
      { cmd: path.join(os.homedir(), '.local', 'bin', 'yt-dlp'), argsPrefix: [] },
      { cmd: 'python3', argsPrefix: ['-m', 'yt_dlp'] },
      { cmd: 'python', argsPrefix: ['-m', 'yt_dlp'] },
    ].filter(Boolean);

    const parseYtdlpOutput = (stdout) => {
      const lines = stdout.trim().split('\n');
      const title = lines.length >= 2 ? lines[lines.length - 2] : null;
      const filePath = lines[lines.length - 1];

      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('yt-dlp did not produce an output file.');
      }

      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const cleanTitle = title ? title.trim() : fileName.replace(/^\d+-/, '');
      const originalName = cleanTitle.endsWith(ext) ? cleanTitle : `${cleanTitle}${ext}`;

      const mimeMap = {
        '.mp4': 'video/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska',
        '.mov': 'video/quicktime', '.avi': 'video/x-msvideo', '.flv': 'video/x-flv',
        '.m4v': 'video/mp4', '.3gp': 'video/3gpp', '.ts': 'video/mp2t',
        '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav',
        '.ogg': 'audio/ogg', '.opus': 'audio/opus', '.flac': 'audio/flac',
        '.aac': 'audio/aac', '.wma': 'audio/x-ms-wma',
      };
      const mimeType = mimeMap[ext] || 'video/mp4';

      return { filePath, fileName, originalName, mimeType };
    };

    const tryCandidate = (index = 0) => {
      if (index >= candidates.length) {
        return reject(new Error('yt-dlp is not installed on the server (tried binary and python module fallbacks).'));
      }

      const candidate = candidates[index];
      const candidateArgs = [...candidate.argsPrefix, ...args];

      execFile(candidate.cmd, candidateArgs, { timeout: 300_000, maxBuffer: 10 * 1024 * 1024, env: execEnv }, (err, stdout, stderr) => {
        if (err) {
          if (err.code === 'ENOENT') {
            return tryCandidate(index + 1);
          }

          const combined = stderr || err.message;
          if (combined.includes('Sign in to confirm') || combined.includes('bot')) {
            const hasCookies = cookiesFile && fs.existsSync(cookiesFile);
            const msg = hasCookies
              ? 'YouTube blocked this download despite cookies being provided. The cookies may be expired — re-export them from your browser and replace the cookies file.'
              : 'YouTube requires authentication from this server. Set the YTDLP_COOKIES_FILE environment variable to a Netscape-format cookies.txt exported from your browser (see https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp).';
            return reject(new Error(msg));
          }
          const errorLines = combined.split('\n');
          const errorLine = errorLines.find((l) => l.startsWith('ERROR:')) || errorLines[errorLines.length - 1];
          const cleanMsg = errorLine?.replace(/^ERROR:\s*(\[.*?\]\s*)?/, '').trim() || err.message;
          return reject(new Error(cleanMsg));
        }

        try {
          const parsed = parseYtdlpOutput(stdout);
          return resolve(parsed);
        } catch (parseErr) {
          return reject(parseErr);
        }
      });
    };

    tryCandidate(0);
  });
}
