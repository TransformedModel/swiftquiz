#!/usr/bin/env node
// =============================================================
//  buildDB.js  —  Compile lyrics/ txt files → lyricsDB.js
//
//  USAGE:
//    node buildDB.js
//
//  Reads every .txt file in the lyrics/ folder tree,
//  runs extractSnippets() on each one, and writes
//  lyricsDB.js — a self-contained JS module that the
//  browser loads directly (no fetch needed at quiz time).
//
//  Run this after fetchLyrics.js whenever you add new songs.
// =============================================================

const fs   = require("fs");
const path = require("path");

const { SONGS, albumSlug, songSlug } = require("./songs.js");
const { extractSnippets, makeLyricsKey, slugify } = require("./snippetEngine.js");

const LYRICS_DIR = path.join(__dirname, "lyrics");
const OUT_FILE   = path.join(__dirname, "lyricsDB.js");

// ── Helpers ───────────────────────────────────────────────────
function lyricsFilePath(song) {
  return path.join(LYRICS_DIR, albumSlug(song.album), songSlug(song.title) + ".txt");
}

// ── Main ──────────────────────────────────────────────────────
function main() {
  console.log("\n🔨  Taylor Swift Quiz — DB Builder");
  console.log("────────────────────────────────────────");

  // Build a lookup map: lyricsKey → song metadata
  const songMap = {};
  for (const song of SONGS) {
    const key = makeLyricsKey(song.title, song.album);
    songMap[key] = song;
  }

  // Walk the lyrics/ tree and collect all txt files
  const lyricsMap = {};   // key → raw lyrics text
  let   fileCount = 0;
  let   missing   = 0;

  for (const song of SONGS) {
    const filePath = lyricsFilePath(song);
    if (!fs.existsSync(filePath)) {
      missing++;
      continue;
    }
    const text = fs.readFileSync(filePath, "utf8");
    if (!text.trim()) { missing++; continue; }
    const key = makeLyricsKey(song.title, song.album);
    lyricsMap[key] = text;
    fileCount++;
  }

  console.log(`  📂 Lyrics files found : ${fileCount}`);
  console.log(`  ⚠️   Missing           : ${missing}`);

  // Extract snippets for every song that has lyrics
  const allSnippets = [];
  const perSong     = {};
  let   songsDone   = 0;

  for (const [key, text] of Object.entries(lyricsMap)) {
    const song     = songMap[key];
    if (!song) continue;
    const snippets = extractSnippets(text, song.title, song.album);
    perSong[key]   = { song: song.title, album: song.album, snippets };
    allSnippets.push(...snippets);
    songsDone++;
    process.stdout.write(`\r  ✂️   Extracting snippets: ${songsDone}/${fileCount}`);
  }
  console.log(); // newline after progress

  // Global deduplication
  const seen   = new Set();
  const unique = allSnippets.filter(s => {
    const k = s.lyric.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`\n  🎵  Total snippets     : ${unique.length}`);
  console.log(`  📝  Unique songs        : ${Object.keys(perSong).length}`);

  // ── Generate lyricsDB.js ──────────────────────────────────
  const timestamp = new Date().toISOString();
  const dbJson    = JSON.stringify(perSong, null, 0); // compact

  const output = `// =============================================================
//  lyricsDB.js  —  AUTO-GENERATED  •  Do not edit manually
//  Built: ${timestamp}
//  Songs: ${Object.keys(perSong).length}
//  Total snippets: ${unique.length}
//
//  Regenerate with: node buildDB.js
// =============================================================

/* global window */
(function (root) {
  "use strict";

  // Per-song map: lyricsKey → { song, album, snippets[] }
  const LYRICS_DB = ${dbJson};

  // Flat array of every snippet across all songs (deduplicated)
  const ALL_SNIPPETS = (function () {
    const seen = new Set();
    const out  = [];
    for (const entry of Object.values(LYRICS_DB)) {
      for (const s of entry.snippets) {
        const k = s.lyric.toLowerCase();
        if (!seen.has(k)) { seen.add(k); out.push(s); }
      }
    }
    return out;
  })();

  const db = { LYRICS_DB, ALL_SNIPPETS };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = db;
  } else {
    root.LYRICS_DB    = LYRICS_DB;
    root.ALL_SNIPPETS = ALL_SNIPPETS;
  }
}(typeof window !== "undefined" ? window : global));
`;

  fs.writeFileSync(OUT_FILE, output, "utf8");

  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`\n  💾  Written to : lyricsDB.js  (${kb} KB)`);
  console.log("\n✅  Database built successfully!");
  console.log("   The quiz will load lyricsDB.js automatically.\n");
}

main();
