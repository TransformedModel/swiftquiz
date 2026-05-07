// =============================================================
//  analytics-worker/index.js  —  SwiftQuiz Analytics Worker
//
//  POST /log   { sessionId, event, data }  — ingest an event
//  GET  /report?token=SECRET               — aggregated dashboard data
//  GET  /health                            — smoke test
//
//  Required secrets (wrangler secret put <NAME>):
//    FIREBASE_PROJECT_ID
//    FIREBASE_CLIENT_EMAIL
//    FIREBASE_PRIVATE_KEY
//    REPORT_TOKEN              ← choose any long random string
// =============================================================

let _cachedToken = null;
let _tokenExpiry = 0;

export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return respond(null, 204, corsHeaders(request));
    }

    const url = new URL(request.url);

    // ── Health ────────────────────────────────────────────────
    if (url.pathname === '/health') {
      return respond({ ok: true }, 200, corsHeaders(request));
    }

    // ── Ingest event ──────────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/log') {
      let body;
      try { body = await request.json(); }
      catch { return respond({ error: 'Invalid JSON' }, 400, corsHeaders(request)); }

      const cf  = request.cf || {};
      const doc = {
        sessionId : String(body.sessionId || 'unknown').slice(0, 64),
        event     : String(body.event     || 'unknown').slice(0, 64),
        ts        : new Date().toISOString(),
        city      : cf.city      ?? null,
        country   : cf.country   ?? null,
        region    : cf.region    ?? null,
        timezone  : cf.timezone  ?? null,
        latitude  : cf.latitude  ?? null,
        longitude : cf.longitude ?? null,
        data      : (body.data && typeof body.data === 'object') ? body.data : {},
      };

      try { await writeEvent(doc, env); }
      catch (err) { console.error('[analytics] write failed:', err.message); }

      return respond(null, 204, corsHeaders(request));
    }

    // ── Report (token-gated) ──────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/report') {
      const token = url.searchParams.get('token');
      if (!token || token !== env.REPORT_TOKEN) {
        return respond({ error: 'Unauthorized' }, 401, corsHeaders(request));
      }
      try {
        const events = await fetchAllEvents(env);
        const report = aggregate(events);
        return respond(report, 200, {
          ...corsHeaders(request),
          'Cache-Control': 'no-store',
        });
      } catch (err) {
        console.error('[report] failed:', err.message);
        return respond({ error: 'Report generation failed' }, 500, corsHeaders(request));
      }
    }

    return respond({ error: 'Not found' }, 404, corsHeaders(request));
  },
};

// ── Firestore: write one event ────────────────────────────────
async function writeEvent(doc, env) {
  const token = await getAccessToken(env);
  const res   = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/events`,
    {
      method  : 'POST',
      headers : { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body    : JSON.stringify(toFsDoc(doc)),
    }
  );
  if (!res.ok) throw new Error(`Firestore ${res.status}: ${await res.text()}`);
}

// ── Firestore: read all events (paginated) ────────────────────
async function fetchAllEvents(env) {
  const token  = await getAccessToken(env);
  const base   = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/events`;
  const all    = [];
  let pageToken = null;

  do {
    const u = new URL(base);
    u.searchParams.set('pageSize', '300');
    if (pageToken) u.searchParams.set('pageToken', pageToken);

    const res  = await fetch(u.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Firestore list ${res.status}: ${await res.text()}`);

    const body = await res.json();
    if (body.documents) {
      for (const doc of body.documents) {
        all.push(parseFsValue({ mapValue: { fields: doc.fields } }));
      }
    }
    pageToken = body.nextPageToken ?? null;
  } while (pageToken && all.length < 5000);

  return all;
}

// ── Aggregation ───────────────────────────────────────────────
function aggregate(events) {
  events.sort((a, b) => (a.ts ?? '').localeCompare(b.ts ?? ''));

  // Build a map of sessions
  const sessions = new Map();
  const getS = id => {
    if (!sessions.has(id)) sessions.set(id, {
      id, ts: null, city: null, country: null, region: null,
      pageView: false, started: false, completed: false, abandoned: false,
      perfect: false, score: null, totalMs: null, questionsAnswered: 0,
    });
    return sessions.get(id);
  };

  // Per-question accumulators
  const Q = Array.from({ length: 15 }, () => ({ correct: 0, wrong: 0, msTotal: 0, msCount: 0 }));

  for (const e of events) {
    const s = getS(e.sessionId || 'unknown');
    if (!s.ts) s.ts = e.ts;
    s.city    = s.city    || e.city;
    s.country = s.country || e.country;
    s.region  = s.region  || e.region;

    if (e.event === 'page_view')  s.pageView  = true;
    if (e.event === 'quiz_start') s.started   = true;

    if (e.event === 'question_answered') {
      const qi = e.data?.questionIndex ?? -1;
      s.questionsAnswered = Math.max(s.questionsAnswered, qi + 1);
      if (qi >= 0 && qi < 15) {
        if (e.data?.correct) Q[qi].correct++; else Q[qi].wrong++;
        if (e.data?.msOnQuestion > 0) { Q[qi].msTotal += e.data.msOnQuestion; Q[qi].msCount++; }
      }
    }

    if (e.event === 'quiz_complete') {
      s.completed = true;
      s.perfect   = !!e.data?.perfect;
      s.score     = e.data?.score ?? null;
      s.totalMs   = e.data?.totalMs ?? null;
    }

    if (e.event === 'quiz_abandon') s.abandoned = true;
  }

  const list      = Array.from(sessions.values());
  const starters  = list.filter(s => s.started);
  const completers= list.filter(s => s.completed);

  // Drop-off: how many starters answered each question
  const dropoff = Array(15).fill(0);
  for (const s of starters) {
    for (let i = 0; i < s.questionsAnswered; i++) dropoff[i]++;
  }

  // Countries + cities
  const countryMap = new Map();
  const cityMap    = new Map();
  for (const s of list) {
    if (s.country) countryMap.set(s.country, (countryMap.get(s.country) || 0) + 1);
    if (s.city) {
      const k = `${s.city}||${s.country}`;
      const existing = cityMap.get(k) || { city: s.city, country: s.country, count: 0 };
      existing.count++;
      cityMap.set(k, existing);
    }
  }
  const countries = [...countryMap.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count).slice(0, 25);
  const cities = [...cityMap.values()]
    .sort((a, b) => b.count - a.count).slice(0, 25);

  // Recent sessions
  const recent = list
    .sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? ''))
    .slice(0, 30)
    .map(s => ({
      ts      : s.ts,
      country : s.country,
      city    : s.city,
      started : s.started,
      completed: s.completed,
      perfect : s.perfect,
      questionsAnswered: s.questionsAnswered,
      score   : s.score,
      totalMs : s.totalMs,
    }));

  const avgScore = completers.length
    ? +(completers.reduce((a, s) => a + (s.score || 0), 0) / completers.length).toFixed(1)
    : null;

  const avgTime = completers.filter(s => s.totalMs).length
    ? Math.round(completers.reduce((a, s) => a + (s.totalMs || 0), 0) / completers.filter(s => s.totalMs).length)
    : null;

  return {
    generated       : new Date().toISOString(),
    totalSessions   : list.length,
    totalPageViews  : list.filter(s => s.pageView).length,
    quizStarts      : starters.length,
    quizCompletions : completers.length,
    completionRate  : starters.length ? +(completers.length / starters.length).toFixed(3) : 0,
    perfectScores   : list.filter(s => s.perfect).length,
    avgScore,
    avgTimeMs       : avgTime,
    dropoff,
    questionStats   : Q.map((q, i) => ({
      index   : i,
      correct : q.correct,
      wrong   : q.wrong,
      avgMs   : q.msCount ? Math.round(q.msTotal / q.msCount) : null,
    })),
    countries,
    cities,
    recent,
  };
}

// ── Firestore value converters ────────────────────────────────
function toFsValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean')  return { booleanValue: v };
  if (typeof v === 'number')   return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string')   return { stringValue: v };
  if (Array.isArray(v))        return { arrayValue: { values: v.map(toFsValue) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) fields[k] = toFsValue(val);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}
function toFsDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFsValue(v);
  return { fields };
}
function parseFsValue(v) {
  if ('stringValue'  in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue);
  if ('doubleValue'  in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue'    in v) return null;
  if ('mapValue'     in v) {
    const obj = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) obj[k] = parseFsValue(val);
    return obj;
  }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(parseFsValue);
  return null;
}

// ── OAuth2 / JWT ──────────────────────────────────────────────
async function getAccessToken(env) {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry - 60_000) return _cachedToken;
  const jwt = await makeJWT(env);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method  : 'POST',
    headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
    body    : `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`Token exchange: ${await res.text()}`);
  const { access_token, expires_in } = await res.json();
  _cachedToken = access_token;
  _tokenExpiry = now + (expires_in ?? 3600) * 1000;
  return _cachedToken;
}

async function makeJWT(env) {
  const now  = Math.floor(Date.now() / 1000);
  const b64u = obj => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const hdr  = b64u({ alg: 'RS256', typ: 'JWT' });
  const pay  = b64u({ iss: env.FIREBASE_CLIENT_EMAIL, scope: 'https://www.googleapis.com/auth/datastore',
                      aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const msg  = `${hdr}.${pay}`;
  const pem  = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const der  = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g,'').replace(/\s/g,'')), c => c.charCodeAt(0));
  const key  = await crypto.subtle.importKey('pkcs8', der, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['sign']);
  const sig  = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(msg));
  const s64  = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return `${msg}.${s64}`;
}

// ── Helpers ───────────────────────────────────────────────────
function corsHeaders(req) {
  const allowed = ['https://ready-for-it.niharikakohli.com','http://localhost','http://127.0.0.1'];
  const origin  = req.headers.get('Origin') || '';
  const allow   = allowed.some(a => origin.startsWith(a)) ? origin : allowed[0];
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Methods': 'POST,GET,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
function respond(body, status, headers) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: { 'Content-Type': body ? 'application/json' : 'text/plain', ...headers },
  });
}
