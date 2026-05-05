# SwiftQuiz — Firebase Leaderboard Setup

This guide takes about 5 minutes and gets the shared leaderboard working.

---

## 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Enter a project name (e.g. `swiftquiz`) and click **Continue**
4. Disable Google Analytics if you don't need it, then click **Create project**

---

## 2. Register the Web App

1. Inside your project, click the **web icon** `</>` (or go to Project Settings → Your apps → Add app → Web)
2. Give the app a nickname (e.g. `SwiftQuiz`)
3. **Do not** check "Also set up Firebase Hosting" — you're using Cloudflare
4. Click **Register app**
5. Firebase shows you a `firebaseConfig` object. Copy the values — you'll need them in Step 4.

---

## 3. Enable Firestore Database

1. In the left sidebar, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (you'll paste the correct rules in Step 5)
4. Select a region close to your users (e.g. `us-east1` or `europe-west1`)
5. Click **Enable**

---

## 4. Add Your Config to the App

Open `firebase-config.js` and replace the placeholder values with the ones you copied:

```js
window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",          // from Firebase console
  authDomain:        "your-app.firebaseapp.com",
  projectId:         "your-app",
  storageBucket:     "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc...",
};
```

Save the file. The leaderboard will connect automatically on next page load.

---

## 5. Set Firestore Security Rules

In the Firebase console, go to **Firestore Database → Rules** and replace the default rules with:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /leaderboard/{entry} {

      // Anyone can read the leaderboard
      allow read: if true;

      // Anyone can add a new entry, but only with valid fields
      allow create: if
        request.resource.data.keys().hasOnly(['name', 'timeMs', 'date']) &&
        request.resource.data.name is string &&
        request.resource.data.name.size() >= 1 &&
        request.resource.data.name.size() <= 30 &&
        request.resource.data.timeMs is int &&
        request.resource.data.timeMs > 0 &&
        request.resource.data.timeMs < 3600000;  // max 1 hour

      // Nobody can edit or delete entries
      allow update, delete: if false;
    }
  }
}
```

Click **Publish**.

---

## 6. Deploy to Cloudflare Pages

1. Push your project to a GitHub repository (or connect your existing one)
2. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Pages → Create a project**
3. Connect your GitHub repo
4. Build settings:
   - **Framework preset**: None
   - **Build command**: *(leave blank)*
   - **Build output directory**: `/` (or `.`)
5. Click **Save and Deploy**

Cloudflare will serve the site as a static site — no build step needed.

> **Important:** Make sure `lyricsDB.js` is committed to your repo before deploying. If it's missing, the quiz falls back to seed snippets and live lrclib.net fetches (which work but are slower and less reliable).

---

## 7. Verify It's Working

1. Open your deployed site
2. Play the quiz and get a perfect score (15/15)
3. Enter your name and click **Submit**
4. Click **🏆 Leaderboard** — your entry should appear with a **● LIVE** indicator
5. Open a second browser tab and submit another perfect score — both tabs update in real time

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Leaderboard not connected" message | `firebase-config.js` still has placeholder values | Paste your real Firebase credentials |
| Leaderboard shows but entries don't save | Firestore security rules not published | Go to Firestore → Rules and publish |
| Console error: `PERMISSION_DENIED` | Rules too restrictive or not yet active | Wait ~30 s for rules to propagate, then retry |
| `lyricsDB.js` 404 error in console | File not committed to repo | Run `node buildDB.js` locally, commit the output, redeploy |
| Quiz runs but pool is tiny | `fetchLyrics.js` didn't complete | Run `node fetchLyrics.js --missing` to fill gaps |

---

## Regenerating the Lyrics Database

If you add songs to `songs.js` or want to refresh the lyric pool:

```bash
# Fetch any missing lyrics (safe to re-run)
node fetchLyrics.js --missing

# Rebuild the snippet database
node buildDB.js

# Commit the updated lyricsDB.js
git add lyricsDB.js
git commit -m "rebuild lyric database"
git push
```

Cloudflare Pages will redeploy automatically after the push.
