// =============================================================
//  snippetEngine.js  —  Lyric → Quiz Snippet Extractor
//  Pure function, no I/O. Works in Node.js and browser.
//
//  Given a raw lyrics string, returns an array of
//  { lyric: "4-5 words", song: "Title", album: "Album" }
//  objects suitable for use as quiz questions.
// =============================================================

// Words too generic to open a recognisable snippet
const STOP_STARTERS = new Set([
  "a","an","the","and","but","or","so","yet","for","nor",
  "i","you","he","she","we","they","it","me","him","her","us","them",
  "my","your","his","its","our","their",
  "is","are","was","were","be","been","being",
  "have","has","had","do","does","did",
  "will","would","could","should","may","might","shall","must","can",
  "not","no","yes","if","when","while","as","because","since","though",
  "at","in","on","to","of","for","with","by","from","into","onto",
  "this","that","these","those",
  "then","there","here","now","just","like","still","also","too",
  "oh","ooh","ah","yeah","hey","la","na","mmm","uh","hmm","whoa","woah",
  "all","up","out","down","back","off","away","over","under",
  "what","who","how","where","why","which",
  "about","around","after","before","between","through","without",
]);

// Filler-heavy patterns — lines that are pure ad-libs
const FILLER_RE = /^(oh+|ah+|la+|na+|yeah+|hey+|mmm+|whoa+|uh+|eh+)[,\s!]*(oh+|ah+|la+|na+|yeah+|hey+|mmm+|whoa+|uh+|eh+|,|\s)*$/i;

// LRC timestamp pattern  [mm:ss.xx] or <mm:ss.xx>
const TIMESTAMP_RE = /\[?\d{1,2}:\d{2}(?:\.\d+)?\]?|<\d{1,2}:\d{2}(?:\.\d+)?>/g;

// Section header pattern  [Chorus], [Verse 1], (Pre-Chorus), etc.
const HEADER_RE = /^[\[(].{0,40}[\])]\s*$/;

/**
 * Clean a single raw lyrics line:
 *  - Strip LRC timestamps
 *  - Strip section headers
 *  - Strip leading/trailing whitespace
 *  Returns null if the line should be discarded entirely.
 */
function cleanLine(raw) {
  const stripped = raw.replace(TIMESTAMP_RE, "").trim();
  if (!stripped) return null;
  if (HEADER_RE.test(stripped)) return null;
  if (FILLER_RE.test(stripped)) return null;
  return stripped;
}

/**
 * Tokenise a clean lyric line into an array of word strings.
 * Keeps apostrophes inside contractions ("don't" → "don't").
 * Strips all other punctuation.
 */
function tokenise(line) {
  return line.match(/[a-zA-Z']+/g) || [];
}

/**
 * Score a candidate window (array of words).
 * Higher = more quiz-worthy.
 */
function scoreWindow(words) {
  let score = 0;
  const first = words[0].toLowerCase();

  // Prefer windows that don't start with a stop word
  if (!STOP_STARTERS.has(first)) score += 3;

  // Prefer windows with more non-stop words overall
  const contentCount = words.filter(w => !STOP_STARTERS.has(w.toLowerCase())).length;
  score += contentCount;

  // Slight preference for 5-word windows over 4-word
  if (words.length === 5) score += 1;

  // Penalise all-caps words (usually screamed ad-libs: "STAY")
  const allCaps = words.filter(w => w === w.toUpperCase() && w.length > 1).length;
  score -= allCaps;

  return score;
}

/**
 * Extract quiz-ready snippets from a full lyrics string.
 *
 * Strategy: take every consecutive pair of clean lyric lines
 * (joined with a newline) where both lines have ≥ 3 words.
 * This gives a two-line snippet that shows a natural couplet
 * rather than a short word fragment.
 *
 * @param {string} lyricsText   Full raw lyrics (plain or LRC).
 * @param {string} songTitle    Song title, stored on each snippet.
 * @param {string} albumName    Album name, stored on each snippet.
 * @returns {Array<{lyric, song, album}>}
 */
function extractSnippets(lyricsText, songTitle, albumName) {
  if (!lyricsText || typeof lyricsText !== "string") return [];

  const seen     = new Set();
  const snippets = [];

  const lines = lyricsText.split(/\r?\n/).map(cleanLine).filter(Boolean);

  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];

    // Both lines need at least 3 words of substance
    if (tokenise(line1).length < 3 || tokenise(line2).length < 3) continue;

    const lyric = `${line1}\n${line2}`;
    const key   = lyric.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    snippets.push({ lyric, song: songTitle, album: albumName });
  }

  return snippets;
}

/**
 * Given an array of songs (objects with .title and .album),
 * and a map of songKey → lyricsText, return all extracted snippets.
 *
 * @param {Object} lyricsMap   { "song-slug__album-slug": "full lyrics..." }
 * @param {Array}  songs       Array from songs.js
 * @returns {Array<{lyric, song, album}>}
 */
function extractAllSnippets(lyricsMap, songs) {
  const all  = [];
  const seen = new Set();

  for (const song of songs) {
    const key   = makeLyricsKey(song.title, song.album);
    const text  = lyricsMap[key];
    if (!text) continue;

    const snippets = extractSnippets(text, song.title, song.album);
    for (const s of snippets) {
      const dedup = s.lyric.toLowerCase();
      if (!seen.has(dedup)) {
        seen.add(dedup);
        all.push(s);
      }
    }
  }
  return all;
}

/** Canonical key used to cross-reference songs ↔ lyric files. */
function makeLyricsKey(title, album) {
  return `${slugify(title)}__${slugify(album)}`;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Fisher-Yates shuffle (in-place)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { extractSnippets, extractAllSnippets, makeLyricsKey, slugify, shuffle };
} else {
  window.SnippetEngine = { extractSnippets, extractAllSnippets, makeLyricsKey, slugify, shuffle };
}
