#!/usr/bin/env node
// =============================================================
//  fetchLyrics.js  —  Download Taylor Swift lyrics from lrclib.net
//
//  USAGE:
//    node fetchLyrics.js              # fetch all songs
//    node fetchLyrics.js --missing    # only fetch songs without a txt file
//    node fetchLyrics.js --album red  # fetch one album only
//
//  Requires Node.js 18+ (uses native fetch).
//  No npm install needed — zero dependencies.
//
//  Output:
//    lyrics/<album-slug>/<song-slug>.txt   ← one file per song
//    lyrics/manifest.json                  ← index of what was found
// =============================================================

const fs   = require("fs");
const path = require("path");

const { SONGS, albumSlug, songSlug } = require("./songs.js");

// ── Config ────────────────────────────────────────────────────
const LYRICS_DIR    = path.join(__dirname, "lyrics");
const MANIFEST_PATH = path.join(LYRICS_DIR, "manifest.json");
const DELAY_MS      = 250;   // ms between requests — be polite to lrclib
const MAX_RETRIES   = 2;

// ── CLI args ──────────────────────────────────────────────────
const args        = process.argv.slice(2);
const MISSING_ONLY = args.includes("--missing");
const ALBUM_FILTER = (() => {
  const idx = args.indexOf("--album");
  return idx !== -1 ? args[idx + 1]?.toLowerCase() : null;
})();

// ── Helpers ───────────────────────────────────────────────────
function lyricsPath(song) {
  return path.join(LYRICS_DIR, albumSlug(song.album), songSlug(song.title) + ".txt");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function pad(n, w) {
  return String(n).padStart(w, " ");
}

// Progress bar
function progressBar(done, total, width = 30) {
  const pct   = done / total;
  const filled = Math.round(pct * width);
  const bar   = "█".repeat(filled) + "░".repeat(width - filled);
  return `[${bar}] ${pad(done, String(total).length)}/${total}`;
}

// ── lrclib API ────────────────────────────────────────────────
const LRCLIB = "https://lrclib.net/api";

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "TaylorSwiftQuiz/1.0 (fan project; github.com/taylor-swift-quiz)" },
      });
      if (res.status === 404) return null;       // not found — don't retry
      if (res.status === 429) {
        // Rate limited — back off
        const retry = parseInt(res.headers.get("Retry-After") || "5", 10);
        console.warn(`\n  ⏳ Rate limited. Waiting ${retry}s…`);
        await sleep(retry * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Try lrclib's exact-match endpoint first, then search as fallback.
 * Returns plain-text lyrics string, or null.
 */
async function getLyrics(song) {
  // 1. Exact GET
  const getUrl = `${LRCLIB}/get?artist_name=${enc("Taylor Swift")}&track_name=${enc(song.title)}&album_name=${enc(song.album)}`;
  try {
    const data = await fetchWithRetry(getUrl);
    if (data && data.plainLyrics) return data.plainLyrics;
  } catch { /* fall through to search */ }

  // 2. Search fallback
  const searchUrl = `${LRCLIB}/search?artist_name=${enc("Taylor Swift")}&track_name=${enc(song.title)}`;
  try {
    const results = await fetchWithRetry(searchUrl);
    if (!Array.isArray(results) || results.length === 0) return null;
    // Pick the best match: prefer exact title, then most duration-accurate
    const match = results.find(r =>
      r.artistName?.toLowerCase().includes("taylor swift") &&
      r.trackName?.toLowerCase() === song.title.toLowerCase()
    ) || results.find(r =>
      r.artistName?.toLowerCase().includes("taylor swift")
    );
    return match?.plainLyrics || null;
  } catch {
    return null;
  }
}

function enc(s) { return encodeURIComponent(s); }

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("\n🎵  Taylor Swift Quiz — Lyrics Fetcher");
  console.log("────────────────────────────────────────");
  console.log(`  Source : lrclib.net (free, no API key)`);
  console.log(`  Output : lyrics/<album>/<song>.txt`);
  if (MISSING_ONLY)  console.log(`  Mode   : --missing (skipping already-fetched songs)`);
  if (ALBUM_FILTER)  console.log(`  Filter : album containing "${ALBUM_FILTER}"`);
  console.log();

  // Ensure output directories exist
  for (const song of SONGS) {
    const dir = path.join(LYRICS_DIR, albumSlug(song.album));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // Load or create manifest
  let manifest = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try { manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")); } catch {}
  }

  // Filter songs list
  let songs = SONGS;
  if (ALBUM_FILTER) {
    songs = songs.filter(s => s.album.toLowerCase().includes(ALBUM_FILTER));
    if (songs.length === 0) {
      console.error(`❌ No songs matched album filter "${ALBUM_FILTER}"`);
      process.exit(1);
    }
  }
  if (MISSING_ONLY) {
    songs = songs.filter(s => !fs.existsSync(lyricsPath(s)));
  }

  const total   = songs.length;
  let   found   = 0;
  let   missing = 0;
  let   errors  = 0;
  const notFound = [];

  console.log(`Fetching ${total} song${total !== 1 ? "s" : ""}…\n`);

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const key  = `${albumSlug(song.album)}/${songSlug(song.title)}`;

    process.stdout.write(`\r  ${progressBar(i, total)}  ${song.title.slice(0, 35).padEnd(35)}`);

    try {
      const lyrics = await getLyrics(song);

      if (lyrics) {
        // Save to file
        const outPath = lyricsPath(song);
        fs.writeFileSync(outPath, lyrics, "utf8");
        manifest[key] = {
          title:   song.title,
          album:   song.album,
          year:    song.year,
          lines:   lyrics.split("\n").filter(Boolean).length,
          fetched: new Date().toISOString(),
        };
        found++;
      } else {
        missing++;
        notFound.push(song.title);
        manifest[key] = { title: song.title, album: song.album, year: song.year, missing: true };
      }
    } catch (err) {
      errors++;
      manifest[key] = { title: song.title, album: song.album, year: song.year, error: err.message };
    }

    // Save manifest incrementally
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    await sleep(DELAY_MS);
  }

  // ── Summary ────────────────────────────────────────────────
  process.stdout.write(`\r  ${progressBar(total, total)}  Done!                                   \n\n`);

  console.log("────────────────────────────────────────");
  console.log(`  ✅  Found    : ${found}`);
  console.log(`  ⚠️   Not found: ${missing}`);
  if (errors > 0) console.log(`  ❌  Errors   : ${errors}`);
  console.log("────────────────────────────────────────");

  if (notFound.length > 0) {
    console.log("\nSongs not found on lrclib:");
    notFound.forEach(t => console.log(`  • ${t}`));
  }

  console.log(`\n✨ Done! Lyrics saved to: lyrics/`);
  console.log(`   Next step: node buildDB.js\n`);
}

main().catch(err => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
