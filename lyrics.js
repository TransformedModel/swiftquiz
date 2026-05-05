// =============================================================
//  lyrics.js  —  Browser-facing Lyrics & Quiz API
//
//  Load order in index.html:
//    <script src="songs.js"></script>
//    <script src="snippetEngine.js"></script>
//    <script src="lyricsDB.js"></script>   ← optional, pre-built
//    <script src="lyrics.js"></script>
//
//  If lyricsDB.js is present (built via `node buildDB.js`),
//  snippets are served instantly from it.
//
//  Otherwise, songs are fetched on-demand from lrclib.net
//  and cached in localStorage — the quiz still works, just
//  the first load for each song takes a moment.
// =============================================================

const LyricsEngine = (function () {
  "use strict";

  // ── Constants ───────────────────────────────────────────────
  const LRCLIB_BASE  = "https://lrclib.net/api";
  const CACHE_PREFIX = "tsq_lrc_v3_";
  const CACHE_TTL    = 30 * 24 * 60 * 60 * 1000; // 30 days

  // ── Seed snippets (fallback when lrclib is unreachable) ─────
  // These are used ONLY when:
  //   (a) lyricsDB.js was not built, AND
  //   (b) lrclib.net is unreachable
  const SEED_SNIPPETS = [
    // Taylor Swift (2006)
    { lyric: "when you think Tim McGraw",           song: "Tim McGraw",                       album: "Taylor Swift" },
    { lyric: "hope you think my favorite",          song: "Tim McGraw",                       album: "Taylor Swift" },
    { lyric: "grabbed a pen and wrote",             song: "Our Song",                         album: "Taylor Swift" },
    { lyric: "our song is a slamming",              song: "Our Song",                         album: "Taylor Swift" },
    { lyric: "Drew looks at me",                    song: "Teardrops on My Guitar",           album: "Taylor Swift" },
    { lyric: "talks about her all summer",          song: "Teardrops on My Guitar",           album: "Taylor Swift" },
    { lyric: "should've said no you",               song: "Should've Said No",                album: "Taylor Swift" },
    { lyric: "I have an excellent father",          song: "The Best Day",                     album: "Taylor Swift" },
    { lyric: "it was the night things",             song: "Change",                           album: "Taylor Swift" },
    { lyric: "tied together with a smile",          song: "Tied Together with a Smile",       album: "Taylor Swift" },
    // Fearless
    { lyric: "spinning around in the street",       song: "Fearless",                         album: "Fearless" },
    { lyric: "back when I was fifteen",             song: "Fifteen",                          album: "Fearless" },
    { lyric: "somebody tells you they love",        song: "Fifteen",                          album: "Fearless" },
    { lyric: "Romeo save me they're",               song: "Love Story",                       album: "Fearless" },
    { lyric: "marry me Juliet you'll",              song: "Love Story",                       album: "Fearless" },
    { lyric: "she wears short skirts I",            song: "You Belong With Me",               album: "Fearless" },
    { lyric: "say you're sorry that face",          song: "White Horse",                      album: "Fearless" },
    { lyric: "hey Stephen I know looks",            song: "Hey Stephen",                      album: "Fearless" },
    { lyric: "you're not sorry no no",              song: "You're Not Sorry",                 album: "Fearless" },
    { lyric: "the way I loved you",                 song: "The Way I Loved You",              album: "Fearless" },
    // Speak Now
    { lyric: "you are not the kind",                song: "Speak Now",                        album: "Speak Now" },
    { lyric: "go back to December",                 song: "Back to December",                 album: "Speak Now" },
    { lyric: "you with your words like",            song: "Mean",                             album: "Speak Now" },
    { lyric: "someday I'll be living",              song: "Mean",                             album: "Speak Now" },
    { lyric: "I was so enchanted by",               song: "Enchanted",                        album: "Speak Now" },
    { lyric: "please don't be in love",             song: "Enchanted",                        album: "Speak Now" },
    { lyric: "long live all the mountains",         song: "Long Live",                        album: "Speak Now" },
    { lyric: "I said remember this moment",         song: "Long Live",                        album: "Speak Now" },
    { lyric: "long were the nights when",           song: "Dear John",                        album: "Speak Now" },
    { lyric: "sparks fly it's like",               song: "Sparks Fly",                       album: "Speak Now" },
    { lyric: "haunted by the ghost of",             song: "Haunted",                          album: "Speak Now" },
    { lyric: "never grow up just stay",             song: "Never Grow Up",                    album: "Speak Now" },
    // Red
    { lyric: "loving him is like driving",          song: "Red",                              album: "Red" },
    { lyric: "I knew you were trouble",             song: "I Knew You Were Trouble",          album: "Red" },
    { lyric: "I remember it all too",               song: "All Too Well",                     album: "Red" },
    { lyric: "wind in my hair I",                   song: "All Too Well",                     album: "Red" },
    { lyric: "you kept me like a",                  song: "All Too Well",                     album: "Red" },
    { lyric: "autumn leaves falling down like",     song: "All Too Well",                     album: "Red" },
    { lyric: "we're happy free confused and",       song: "22",                               album: "Red" },
    { lyric: "we are never ever getting",           song: "We Are Never Ever Getting Back Together", album: "Red" },
    { lyric: "pull my chair out and",               song: "Begin Again",                      album: "Red" },
    { lyric: "holy ground back to a",               song: "Holy Ground",                      album: "Red" },
    { lyric: "treacherous put your lips close",     song: "Treacherous",                      album: "Red" },
    { lyric: "all I knew this morning",             song: "Everything Has Changed",           album: "Red" },
    { lyric: "stay stay stay I've been",            song: "Stay Stay Stay",                   album: "Red" },
    // 1989
    { lyric: "the players gonna play play",         song: "Shake It Off",                     album: "1989" },
    { lyric: "got a long list of",                  song: "Blank Space",                      album: "1989" },
    { lyric: "cherry lips crystal skies I",         song: "Blank Space",                      album: "1989" },
    { lyric: "you got that James Dean",             song: "Style",                            album: "1989" },
    { lyric: "band-aids don't fix bullet holes",    song: "Bad Blood",                        album: "1989" },
    { lyric: "say you'll remember me standing",     song: "Wildest Dreams",                   album: "1989" },
    { lyric: "are we out of the",                   song: "Out of the Woods",                 album: "1989" },
    { lyric: "the drought was the very",            song: "Clean",                            album: "1989" },
    { lyric: "ten months sober I must",             song: "Clean",                            album: "1989" },
    { lyric: "heartbreak is the national anthem",   song: "New Romantics",                    album: "1989" },
    { lyric: "when we first dropped our",           song: "Welcome to New York",              album: "1989" },
    { lyric: "everybody here was someone else",     song: "Welcome to New York",              album: "1989" },
    // reputation
    { lyric: "I knew he was a",                     song: "...Ready for It?",                 album: "reputation" },
    { lyric: "I don't like your kingdom",           song: "Look What You Made Me Do",         album: "reputation" },
    { lyric: "the old Taylor can't come",           song: "Look What You Made Me Do",         album: "reputation" },
    { lyric: "you should take it as",               song: "Gorgeous",                         album: "reputation" },
    { lyric: "ocean blue eyes looking in",          song: "Gorgeous",                         album: "reputation" },
    { lyric: "this ain't for the best",             song: "Delicate",                         album: "reputation" },
    { lyric: "don't blame me love made",            song: "Don't Blame Me",                   album: "reputation" },
    { lyric: "it was the best of",                  song: "Getaway Car",                      album: "reputation" },
    { lyric: "we were running we were",             song: "Getaway Car",                      album: "reputation" },
    { lyric: "please don't ever become a",          song: "New Year's Day",                   album: "reputation" },
    { lyric: "hold on to the memories",             song: "New Year's Day",                   album: "reputation" },
    { lyric: "carve your name into my",             song: "Dress",                            album: "reputation" },
    { lyric: "end game big reputation",             song: "End Game",                         album: "reputation" },
    { lyric: "all the liars are calling",           song: "Call It What You Want",            album: "reputation" },
    // Lover
    { lyric: "we could leave the Christmas",        song: "Lover",                            album: "Lover" },
    { lyric: "can I go where you",                  song: "Lover",                            album: "Lover" },
    { lyric: "bad boy shiny toy with",              song: "Cruel Summer",                     album: "Lover" },
    { lyric: "fever dream high in the",             song: "Cruel Summer",                     album: "Lover" },
    { lyric: "I'm drunk in the back",               song: "Cruel Summer",                     album: "Lover" },
    { lyric: "say it in the street",                song: "You Need to Calm Down",            album: "Lover" },
    { lyric: "I promise that you'll never",         song: "ME!",                              album: "Lover" },
    { lyric: "I hope I never lose",                 song: "Cornelia Street",                  album: "Lover" },
    { lyric: "what's it like to brag",              song: "The Man",                          album: "Lover" },
    { lyric: "London boy drinking beer",            song: "London Boy",                       album: "Lover" },
    { lyric: "paper rings darling you're",          song: "Paper Rings",                      album: "Lover" },
    { lyric: "the archer I am the",                 song: "The Archer",                       album: "Lover" },
    { lyric: "daylight I wake up feeling",          song: "Daylight",                         album: "Lover" },
    { lyric: "I forgot that you existed",           song: "I Forgot That You Existed",        album: "Lover" },
    // folklore
    { lyric: "vintage tee brand new phone",         song: "cardigan",                         album: "folklore" },
    { lyric: "when you are young they",             song: "cardigan",                         album: "folklore" },
    { lyric: "I knew you'd come back",              song: "cardigan",                         album: "folklore" },
    { lyric: "I think I've seen this",              song: "exile",                            album: "folklore" },
    { lyric: "you never gave a warning",            song: "exile",                            album: "folklore" },
    { lyric: "back when we were still",             song: "august",                           album: "folklore" },
    { lyric: "salt air and the rust",               song: "august",                           album: "folklore" },
    { lyric: "please picture me in the",            song: "seven",                            album: "folklore" },
    { lyric: "I was so ahead of",                   song: "this is me trying",               album: "folklore" },
    { lyric: "I'm still on that trapeze",           song: "mirrorball",                       album: "folklore" },
    { lyric: "look at this godforsaken mess",       song: "illicit affairs",                  album: "folklore" },
    { lyric: "I didn't have it in",                 song: "my tears ricochet",               album: "folklore" },
    { lyric: "I had the time of",                   song: "the 1",                            album: "folklore" },
    { lyric: "would you tell me to",                song: "betty",                            album: "folklore" },
    { lyric: "something med school did not",        song: "epiphany",                         album: "folklore" },
    { lyric: "mad woman what a shame",              song: "mad woman",                        album: "folklore" },
    { lyric: "tulle making its way",                song: "invisible string",                 album: "folklore" },
    // evermore
    { lyric: "I'm like the water when",             song: "willow",                           album: "evermore" },
    { lyric: "the more that you say",               song: "willow",                           album: "evermore" },
    { lyric: "you booked the night train",          song: "champagne problems",               album: "evermore" },
    { lyric: "she would've been a good",            song: "champagne problems",               album: "evermore" },
    { lyric: "what must it be like",                song: "gold rush",                        album: "evermore" },
    { lyric: "forever is the sweetest con",         song: "cowboy like me",                   album: "evermore" },
    { lyric: "I wait by the door",                  song: "tolerate it",                      album: "evermore" },
    { lyric: "I think he did it",                   song: "no body no crime",                 album: "evermore" },
    { lyric: "there is happiness in our",           song: "happiness",                        album: "evermore" },
    { lyric: "were you waiting at our",             song: "coney island",                     album: "evermore" },
    { lyric: "dorothea I saw you dancing",          song: "dorothea",                         album: "evermore" },
    { lyric: "oh what a sign I",                    song: "ivy",                              album: "evermore" },
    { lyric: "I had the shiniest wheels",           song: "long story short",                 album: "evermore" },
    { lyric: "what died didn't stay dead",          song: "marjorie",                         album: "evermore" },
    { lyric: "keep your eyes open marjorie",        song: "marjorie",                         album: "evermore" },
    { lyric: "ever just sit and think",             song: "evermore",                         album: "evermore" },
    { lyric: "right where you left me",             song: "right where you left me",          album: "evermore" },
    // Midnights
    { lyric: "it's me hi I'm the",                  song: "Anti-Hero",                        album: "Midnights" },
    { lyric: "I have this thing where",             song: "Anti-Hero",                        album: "Midnights" },
    { lyric: "meet me at midnight",                 song: "Lavender Haze",                    album: "Midnights" },
    { lyric: "I feel the lavender haze",            song: "Lavender Haze",                    album: "Midnights" },
    { lyric: "the burgundy on my t-shirt",          song: "Maroon",                           album: "Midnights" },
    { lyric: "I can make the whole",                song: "Bejeweled",                        album: "Midnights" },
    { lyric: "karma is my boyfriend",               song: "Karma",                            album: "Midnights" },
    { lyric: "what if I told you",                  song: "Mastermind",                       album: "Midnights" },
    { lyric: "draw a cat eye sharp",                song: "Vigilante Shit",                   album: "Midnights" },
    { lyric: "he wanted it comfortable I",          song: "Midnight Rain",                    album: "Midnights" },
    { lyric: "from sprinkler splashes to",          song: "You're on Your Own, Kid",          album: "Midnights" },
    { lyric: "bigger than the whole sky",           song: "Bigger Than the Whole Sky",        album: "Midnights" },
    { lyric: "jet-lagged drunk on you in",          song: "Paris",                            album: "Midnights" },
    { lyric: "would've could've should've",         song: "Would've Could've Should've",      album: "Midnights" },
    { lyric: "glitch you've ruined my entire",      song: "Glitch",                           album: "Midnights" },
    { lyric: "high infidelity put on",              song: "High Infidelity",                  album: "Midnights" },
    { lyric: "you're losing me don't call",         song: "You're Losing Me",                 album: "Midnights" },
    // TTPD
    { lyric: "I was supposed to be",               song: "Fortnight",                         album: "The Tortured Poets Department" },
    { lyric: "once in twenty lifetimes",            song: "Fortnight",                        album: "The Tortured Poets Department" },
    { lyric: "you're not Dylan Thomas I'm",         song: "The Tortured Poets Department",    album: "The Tortured Poets Department" },
    { lyric: "down bad crying at the",              song: "Down Bad",                         album: "The Tortured Poets Department" },
    { lyric: "I had the blinds up",                 song: "So Long, London",                  album: "The Tortured Poets Department" },
    { lyric: "Florida is one hell of",              song: "Florida!!!",                       album: "The Tortured Poets Department" },
    { lyric: "fresh out the slammer",               song: "Fresh Out the Slammer",            album: "The Tortured Poets Department" },
    { lyric: "what if I roll the",                  song: "Guilty as Sin?",                   album: "The Tortured Poets Department" },
    { lyric: "I'm so in love I",                    song: "I Can Do It With a Broken Heart",  album: "The Tortured Poets Department" },
    { lyric: "the smallest man who ever",           song: "The Smallest Man Who Ever Lived",  album: "The Tortured Poets Department" },
    { lyric: "this is the golden age",              song: "The Alchemy",                      album: "The Tortured Poets Department" },
    { lyric: "you've got edge she never",           song: "Clara Bow",                        album: "The Tortured Poets Department" },
    { lyric: "so high school you know",             song: "So High School",                   album: "The Tortured Poets Department" },
    { lyric: "my boy only breaks his",              song: "My Boy Only Breaks His Favorite Toys", album: "The Tortured Poets Department" },
    { lyric: "but daddy I love him",                song: "But Daddy I Love Him",             album: "The Tortured Poets Department" },
    { lyric: "loml you're the loss of",             song: "loml",                             album: "The Tortured Poets Department" },
    { lyric: "how did it end tell",                 song: "How Did It End?",                  album: "The Tortured Poets Department" },
    { lyric: "Cassandra had the gift of",           song: "Cassandra",                        album: "The Tortured Poets Department" },
    { lyric: "the manuscript was all wrong",        song: "The Manuscript",                   album: "The Tortured Poets Department" },
  ];

  // ── localStorage cache ──────────────────────────────────────
  function cacheRead(song) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + song.album + "_" + song.title);
      if (!raw) return null;
      const { ts, snippets } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return null;
      return snippets;
    } catch { return null; }
  }

  function cacheWrite(song, snippets) {
    try {
      localStorage.setItem(
        CACHE_PREFIX + song.album + "_" + song.title,
        JSON.stringify({ ts: Date.now(), snippets })
      );
    } catch { /* storage full */ }
  }

  // ── lrclib fetch ────────────────────────────────────────────
  async function fetchLyrics(song) {
    const enc = encodeURIComponent;
    const getUrl = `${LRCLIB_BASE}/get?artist_name=${enc("Taylor Swift")}&track_name=${enc(song.title)}&album_name=${enc(song.album)}`;
    try {
      const res = await fetch(getUrl);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      return data.plainLyrics || null;
    } catch {
      // Fallback: search
      try {
        const searchUrl = `${LRCLIB_BASE}/search?artist_name=${enc("Taylor Swift")}&track_name=${enc(song.title)}`;
        const res  = await fetch(searchUrl);
        const list = await res.json();
        const hit  = Array.isArray(list) && list.find(r =>
          r.artistName?.toLowerCase().includes("taylor swift")
        );
        return hit?.plainLyrics || null;
      } catch { return null; }
    }
  }

  // ── Public: get snippets for one song ───────────────────────
  async function getSnippetsForSong(song) {
    // 1. pre-built DB
    if (window.ALL_SNIPPETS) {
      const hits = window.ALL_SNIPPETS.filter(s => s.song === song.title);
      if (hits.length > 0) return hits;
    }
    // 2. localStorage cache
    const cached = cacheRead(song);
    if (cached && cached.length > 0) return cached;
    // 3. lrclib live fetch
    const lyrics = await fetchLyrics(song);
    if (lyrics) {
      const snippets = window.SnippetEngine
        ? window.SnippetEngine.extractSnippets(lyrics, song.title, song.album)
        : [];
      if (snippets.length > 0) { cacheWrite(song, snippets); return snippets; }
    }
    // 4. seed fallback
    return SEED_SNIPPETS.filter(s => s.song === song.title);
  }

  // ── Public: background preload ──────────────────────────────
  async function preloadLyrics(songs, onProgress) {
    const total = songs.length;
    for (let i = 0; i < songs.length; i++) {
      await getSnippetsForSong(songs[i]);
      if (onProgress) onProgress(i + 1, total);
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // ── Public: full snippet pool ───────────────────────────────
  function getSnippetPool() {
    // If lyricsDB.js was loaded, use its flat array
    if (window.ALL_SNIPPETS && window.ALL_SNIPPETS.length > 0) {
      return [...window.ALL_SNIPPETS];
    }

    // Otherwise collect from localStorage cache + seeds
    const live = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(CACHE_PREFIX)) continue;
        const { snippets } = JSON.parse(localStorage.getItem(key) || "{}");
        if (Array.isArray(snippets)) live.push(...snippets);
      }
    } catch {}

    const all  = [...live, ...SEED_SNIPPETS];
    const seen = new Set();
    return all.filter(s => {
      const k = s.lyric.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  // ── Public: generate a 20-question quiz ─────────────────────
  function generateQuiz() {
    const pool = getSnippetPool();

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Select 20 snippets — at most 2 per song for variety
    const selected = [];
    for (const s of pool) {
      if (selected.length >= 20) break;
      const count = selected.filter(q => q.song === s.song).length;
      if (count < 2) selected.push(s);
    }

    // Build wrong-answer pool from the master song list
    const allSongs = (window.SONGS || []).map(s => ({ song: s.title, album: s.album }));

    return selected.map(snippet => {
      const correct = { song: snippet.song, album: snippet.album };
      const wrong   = allSongs
        .filter(s => s.song !== correct.song)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      const options = [...wrong, correct].sort(() => Math.random() - 0.5);
      return { lyric: snippet.lyric, correctSong: correct.song, correctAlbum: correct.album, options };
    });
  }

  // ── Public API ───────────────────────────────────────────────
  return { getSnippetsForSong, preloadLyrics, getSnippetPool, generateQuiz, SEED_SNIPPETS };
}());

// Expose as a browser global so app.js can reach it via window.LyricsEngine
window.LyricsEngine = LyricsEngine;
