// ============================================================
//  app.js — SwiftQuiz · Quiz Engine
//  Depends on: songs.js, snippetEngine.js, lyrics.js
//  Optional:   lyricsDB.js, firebase.js
// ============================================================

(function () {
  "use strict";

  // ── Config ───────────────────────────────────────────────────
  const QUIZ_LENGTH     = 15;
  const MAX_PER_SONG    = 2;   // max snippets from the same song per quiz
  const ANSWER_DELAY_MS = 200; // ms before Next button appears after answer

  // ── State ────────────────────────────────────────────────────
  let state = {
    quiz:      [],      // [{lyric, correctSong, correctAlbum, options:[{song,album}]}]
    current:   0,       // index into quiz[]
    score:     0,       // running correct count
    answered:  false,   // has the current question been answered?
    startTime: 0,       // Date.now() when timer started
    endTime:   0,       // Date.now() when last answer submitted
    timerInterval: null,
  };

  // ── DOM helpers ──────────────────────────────────────────────
  const $  = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── Screen transitions ───────────────────────────────────────
  function showScreen(id) {
    $$(".screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
  }

  // ── Timer ────────────────────────────────────────────────────
  function fmtTime(ms) {
    const s    = Math.floor(ms / 1000);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function startTimer() {
    state.startTime = Date.now();
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      $("timer").textContent = fmtTime(Date.now() - state.startTime);
    }, 500);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
    state.endTime = Date.now();
    $("timer").textContent = fmtTime(state.endTime - state.startTime);
  }

  // ── Quiz generation ──────────────────────────────────────────
  function buildQuiz() {
    // Pull the full snippet pool (from lyricsDB.js if loaded, else seeds)
    const pool = (window.LyricsEngine && LyricsEngine.getSnippetPool()) || [];

    if (pool.length < QUIZ_LENGTH) {
      console.warn("Snippet pool smaller than quiz length — run fetchLyrics.js + buildDB.js for a larger pool.");
    }

    // Shuffle pool
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Select QUIZ_LENGTH snippets, at most MAX_PER_SONG per song
    const selected = [];
    const songCount = {};
    for (const s of shuffled) {
      if (selected.length >= QUIZ_LENGTH) break;
      const count = songCount[s.song] || 0;
      if (count < MAX_PER_SONG) {
        selected.push(s);
        songCount[s.song] = count + 1;
      }
    }

    // All unique song names for building wrong-answer choices
    const allSongs = (window.SONGS || []).map(s => ({ song: s.title, album: s.album }));

    return selected.map(snippet => {
      const correct = { song: snippet.song, album: snippet.album };

      // 5 distinct wrong answers, different from the correct song
      const wrong = allSongs
        .filter(s => s.song !== correct.song)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      // Shuffle correct into the 6 options
      const options = [...wrong, correct].sort(() => Math.random() - 0.5);

      return {
        lyric:        snippet.lyric,
        correctSong:  correct.song,
        correctAlbum: correct.album,
        options,
      };
    });
  }

  // ── Start quiz ───────────────────────────────────────────────
  async function startQuiz() {
    showScreen("screen-loading");

    // Reset state
    state.quiz     = buildQuiz();
    state.current  = 0;
    state.score    = 0;
    state.answered = false;

    // Brief pause so the loading screen registers
    await pause(350);

    // Initialise UI chrome
    $("q-total").textContent   = QUIZ_LENGTH;
    $("timer").textContent     = "0:00";
    $("progress-fill").style.width = "0%";

    showScreen("screen-quiz");
    startTimer();
    renderQuestion(0);
  }

  // ── Render one question ──────────────────────────────────────
  function renderQuestion(index) {
    const q = state.quiz[index];
    state.answered = false;

    // Header counter
    $("q-current").textContent = index + 1;

    // Progress bar: fraction of questions already answered
    $("progress-fill").style.width = `${(index / QUIZ_LENGTH) * 100}%`;
    $("progress-fill").parentElement.setAttribute("aria-valuenow", index);

    // Lyric — wrapped in curly quotes, triggers CSS fade-in via re-insertion
    const lyricEl = $("lyric-text");
    lyricEl.textContent = `“${q.lyric}”`;
    // Re-trigger animation by cloning the element
    const clone = lyricEl.cloneNode(true);
    lyricEl.parentNode.replaceChild(clone, lyricEl);

    // Hide Next button
    $("next-row").hidden = true;
    $("btn-next").textContent = index === QUIZ_LENGTH - 1 ? "See Results ✦" : "Next ›";

    // Build option buttons
    const grid = $("options-grid");
    grid.innerHTML = "";
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className      = "option-btn";
      btn.textContent    = opt.song;
      btn.dataset.song   = opt.song;
      btn.type           = "button";
      btn.addEventListener("click", () => handleAnswer(opt.song));
      grid.appendChild(btn);
    });
  }

  // ── Handle an answer pick ────────────────────────────────────
  function handleAnswer(pickedSong) {
    if (state.answered) return;
    state.answered = true;

    const q         = state.quiz[state.current];
    const isCorrect = pickedSong === q.correctSong;
    if (isCorrect) state.score++;

    // Disable all buttons and apply highlights
    $$(".option-btn").forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.song === q.correctSong) {
        btn.classList.add("correct");
      } else if (btn.dataset.song === pickedSong) {
        // This is the wrong one the player picked
        btn.classList.add("wrong");
      }
    });

    // Reveal Next button after a short delay
    setTimeout(() => { $("next-row").hidden = false; }, ANSWER_DELAY_MS);
  }

  // ── Advance to next question or results ──────────────────────
  function advance() {
    if (!state.answered) return;

    if (state.current < QUIZ_LENGTH - 1) {
      state.current++;
      renderQuestion(state.current);
    } else {
      showResults();
    }
  }

  // ── Results screen ───────────────────────────────────────────
  function showResults() {
    stopTimer();
    const elapsed = state.endTime - state.startTime;

    $("results-score").textContent = state.score;
    $("results-den").textContent   = QUIZ_LENGTH;
    $("results-time").textContent  = fmtTime(elapsed);

    // Fill progress bar to 100%
    $("progress-fill").style.width = "100%";

    const perfect = state.score === QUIZ_LENGTH;
    $("results-glyph").textContent  = perfect ? "👑" : "✦";
    $("results-title").textContent  = perfect ? "Perfect Score!" : "Quiz Complete!";
    $("lb-entry").hidden            = !perfect;

    if (perfect) {
      $("player-name").value = "";
      $("entry-msg").textContent = "";
      $("btn-submit").disabled   = false;
    }

    showScreen("screen-results");
  }

  // ── Submit leaderboard entry ─────────────────────────────────
  async function submitScore() {
    const name = $("player-name").value.trim();
    if (!name) {
      $("entry-msg").textContent = "Please enter your name first.";
      return;
    }

    const elapsed = state.endTime - state.startTime;
    $("btn-submit").disabled   = true;
    $("entry-msg").textContent = "Saving…";

    try {
      if (window.Leaderboard) {
        await window.Leaderboard.addEntry({ name, timeMs: elapsed });
        $("entry-msg").textContent = "✓ Saved! You're on the leaderboard.";
      } else {
        $("entry-msg").textContent = "⚠ Leaderboard not connected — fill in firebase-config.js.";
        $("btn-submit").disabled = false;
      }
    } catch {
      $("entry-msg").textContent = "✗ Could not save. Try again.";
      $("btn-submit").disabled = false;
    }
  }

  // ── Leaderboard screen ───────────────────────────────────────
  let lbUnsubscribe = null;

  function teardownLeaderboard() {
    if (lbUnsubscribe) { lbUnsubscribe(); lbUnsubscribe = null; }
    const dot = $("live-dot");
    if (dot) dot.hidden = true;
  }

  async function showLeaderboard() {
    teardownLeaderboard();
    showScreen("screen-leaderboard");
    $("lb-list").innerHTML = '<p class="lb-msg">Loading…</p>';

    if (!window.Leaderboard) {
      $("lb-list").innerHTML =
        '<p class="lb-msg">Leaderboard not connected.<br>' +
        'Fill in <strong>firebase-config.js</strong> to enable it.<br>' +
        'See <strong>SETUP.md</strong> for instructions.</p>';
      return;
    }

    // Use real-time subscription if available
    if (Leaderboard.subscribeToEntries) {
      const dot = $("live-dot");
      if (dot) dot.hidden = false;

      lbUnsubscribe = Leaderboard.subscribeToEntries(entries => {
        renderLeaderboard(entries);
      });
    } else {
      try {
        const entries = await Leaderboard.getEntries();
        renderLeaderboard(entries);
      } catch {
        $("lb-list").innerHTML = '<p class="lb-msg">Could not load leaderboard.</p>';
      }
    }
  }

  function renderLeaderboard(entries) {
    const list = $("lb-list");
    if (!entries || entries.length === 0) {
      list.innerHTML = '<p class="lb-msg">No entries yet — be the first with a perfect score!</p>';
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];

    list.innerHTML = entries.map((e, i) => {
      const dateStr = e.date?.toDate
        ? relativeDate(e.date.toDate())
        : "";
      return `
        <div class="lb-row ${i < 3 ? "lb-top" : ""}">
          <span class="lb-rank">${medals[i] !== undefined ? medals[i] : i + 1}</span>
          <span class="lb-name">
            ${esc(e.name)}
            ${dateStr ? `<span class="lb-date">${dateStr}</span>` : ""}
          </span>
          <span class="lb-time">${fmtTime(e.timeMs)}</span>
        </div>`;
    }).join("");
  }

  /** Returns a short relative date string, e.g. "today", "2 days ago" */
  function relativeDate(date) {
    const diffMs   = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 30)  return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month ago";
    if (diffMonths < 12)  return `${diffMonths} months ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
  }

  // ── Particle background ──────────────────────────────────────
  function initParticles() {
    const container = $("particles");
    for (let i = 0; i < 90; i++) {
      const p = document.createElement("div");
      p.className  = "particle";
      const size   = 1 + Math.random() * 2.2;
      p.style.cssText = [
        `left:${Math.random() * 100}%`,
        `top:${Math.random() * 100}%`,
        `width:${size}px`,
        `height:${size}px`,
        `animation-delay:${(Math.random() * 7).toFixed(2)}s`,
        `animation-duration:${(2.5 + Math.random() * 4.5).toFixed(2)}s`,
      ].join(";");
      container.appendChild(p);
    }
  }

  // ── Utilities ────────────────────────────────────────────────
  function pause(ms) { return new Promise(r => setTimeout(r, ms)); }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    initParticles();

    // Button wiring
    $("btn-start").addEventListener("click", startQuiz);
    $("btn-next").addEventListener("click", advance);
    $("btn-again").addEventListener("click", startQuiz);
    $("btn-submit").addEventListener("click", submitScore);
    $("btn-lb-start").addEventListener("click", showLeaderboard);
    $("btn-lb-results").addEventListener("click", showLeaderboard);
    $("btn-back").addEventListener("click", () => {
      teardownLeaderboard();
      showScreen("screen-start");
    });

    // Enter key submits leaderboard name
    $("player-name").addEventListener("keydown", e => {
      if (e.key === "Enter") submitScore();
    });

    // Background preload (low priority, 3 s after load)
    setTimeout(() => {
      if (window.LyricsEngine && window.SONGS && !window.ALL_SNIPPETS) {
        LyricsEngine.preloadLyrics(window.SONGS);
      }
    }, 3000);
  }

  document.addEventListener("DOMContentLoaded", init);

}());
