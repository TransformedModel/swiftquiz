// ============================================================
//  firebase.js  —  SwiftQuiz Leaderboard · Firebase / Firestore
//
//  Loaded as <script type="module"> in index.html.
//  Reads window.FIREBASE_CONFIG (set by firebase-config.js).
//  Exposes window.Leaderboard = { addEntry, getEntries,
//                                  subscribeToEntries }
//
//  Firestore collection structure:
//    leaderboard/{docId}  →  { name, timeMs, date }
//    Ordered ascending by timeMs (fastest time = rank 1)
// ============================================================

import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ── Guard: skip if config not filled in ──────────────────────
const cfg = window.FIREBASE_CONFIG;

if (!cfg || cfg.apiKey === "YOUR_API_KEY") {
  console.info(
    "SwiftQuiz: Firebase not configured.\n" +
    "Open firebase-config.js and paste your project credentials.\n" +
    "See SETUP.md for step-by-step instructions."
  );
  // Leave window.Leaderboard undefined — app.js handles this gracefully
} else {
  // ── Initialise Firebase ─────────────────────────────────────
  const app = initializeApp(cfg);
  const db  = getFirestore(app);

  const COLL  = "leaderboard";
  const LIMIT = 50;

  // ── Leaderboard API ─────────────────────────────────────────
  window.Leaderboard = {

    /**
     * Add a perfect-score entry to the leaderboard.
     * @param {{ name: string, timeMs: number }} entry
     */
    async addEntry({ name, timeMs }) {
      if (!name || typeof name !== "string") throw new Error("Invalid name");
      if (!Number.isFinite(timeMs) || timeMs <= 0) throw new Error("Invalid time");

      await addDoc(collection(db, COLL), {
        name:   name.trim().slice(0, 30),
        timeMs: Math.round(timeMs),
        date:   serverTimestamp(),
      });
    },

    /**
     * Fetch the current leaderboard as a plain array (one-shot).
     * @returns {Promise<Array<{ id, name, timeMs, date }>>}
     */
    async getEntries() {
      const q    = query(collection(db, COLL), orderBy("timeMs", "asc"), limit(LIMIT));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Subscribe to live leaderboard updates.
     * @param {function} callback  Called with the entries array on each update.
     * @returns {function}  Unsubscribe function — call when leaving the screen.
     */
    subscribeToEntries(callback) {
      const q = query(collection(db, COLL), orderBy("timeMs", "asc"), limit(LIMIT));
      return onSnapshot(q, snap => {
        const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(entries);
      }, err => {
        console.error("Leaderboard listener error:", err);
        callback([]);
      });
    },
  };

  console.info("✅ SwiftQuiz: Firebase leaderboard connected.");
}
