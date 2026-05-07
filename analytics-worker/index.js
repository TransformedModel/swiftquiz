// =============================================================
//  analytics-worker/index.js  —  SwiftQuiz Analytics Ingestor
//
//  Accepts POST /log  { sessionId, event, data }
//  Enriches with Cloudflare geo (city, country, region, timezone)
//  Writes to Firestore  events/{docId}
//
//  Required secrets (set via: wrangler secret put <NAME>):
//    FIREBASE_PROJECT_ID
//    FIREBASE_CLIENT_EMAIL     ← from service account JSON
//    FIREBASE_PRIVATE_KEY      ← from service account JSON (full PEM)
// =============================================================

// Module-level token cache — persists across requests in the same isolate
let _cachedToken  = null;
let _tokenExpiry  = 0;

export default {
  async fetch(request, env) {

    // ── CORS preflight ───────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return respond(null, 204, corsHeaders(request));
    }

    const url = new URL(request.url);

    // ── Health check ─────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/health') {
      return respond({ ok: true }, 200, corsHeaders(request));
    }

    // ── Only accept POST /log ─────────────────────────────────
    if (request.method !== 'POST' || url.pathname !== '/log') {
      return respond({ error: 'Not found' }, 404, corsHeaders(request));
    }

    // ── Parse body ───────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return respond({ error: 'Invalid JSON' }, 400, corsHeaders(request));
    }

    // ── Enrich with Cloudflare geo ───────────────────────────
    const cf  = request.cf || {};
    const doc = {
      sessionId : String(body.sessionId || 'unknown').slice(0, 64),
      event     : String(body.event     || 'unknown').slice(0, 64),
      ts        : new Date().toISOString(),
      city      : cf.city       ?? null,
      country   : cf.country    ?? null,
      region    : cf.region     ?? null,
      timezone  : cf.timezone   ?? null,
      latitude  : cf.latitude   ?? null,
      longitude : cf.longitude  ?? null,
      data      : (body.data && typeof body.data === 'object') ? body.data : {},
    };

    // ── Write to Firestore (best-effort — never block the quiz) ──
    try {
      await writeEvent(doc, env);
    } catch (err) {
      console.error('[analytics] Firestore write failed:', err.message);
    }

    return respond(null, 204, corsHeaders(request));
  },
};

// ── Firestore REST write ──────────────────────────────────────
async function writeEvent(doc, env) {
  const token     = await getAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  const endpoint  = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events`;

  const res = await fetch(endpoint, {
    method  : 'POST',
    headers : {
      'Authorization' : `Bearer ${token}`,
      'Content-Type'  : 'application/json',
    },
    body: JSON.stringify(toFirestoreDoc(doc)),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Firestore ${res.status}: ${txt}`);
  }
}

// ── Convert a plain JS object to Firestore REST document format ──
function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean')        return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toFirestoreValue) } };
  }
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) fields[k] = toFirestoreValue(val);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return { fields };
}

// ── OAuth2 access token via service-account JWT ───────────────
async function getAccessToken(env) {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry - 60_000) return _cachedToken;

  const jwt = await makeJWT(env);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method  : 'POST',
    headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
    body    : `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);

  const { access_token, expires_in } = await res.json();
  _cachedToken = access_token;
  _tokenExpiry = now + (expires_in ?? 3600) * 1000;
  return _cachedToken;
}

// ── Build and sign a service-account JWT (RS256) ─────────────
async function makeJWT(env) {
  const now  = Math.floor(Date.now() / 1000);
  const b64u = obj =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const header  = b64u({ alg: 'RS256', typ: 'JWT' });
  const payload = b64u({
    iss   : env.FIREBASE_CLIENT_EMAIL,
    scope : 'https://www.googleapis.com/auth/datastore',
    aud   : 'https://oauth2.googleapis.com/token',
    iat   : now,
    exp   : now + 3600,
  });

  const signing = `${header}.${payload}`;

  // Import the PEM private key (handle both \\n and real newlines)
  const pem = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const der = Uint8Array.from(
    atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')),
    c => c.charCodeAt(0)
  );
  const key = await crypto.subtle.importKey(
    'pkcs8', der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(signing)
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signing}.${sig}`;
}

// ── Helpers ───────────────────────────────────────────────────
function corsHeaders(request) {
  // Restrict to your production domain + localhost for dev
  const allowed = [
    'https://ready-for-it.niharikakohli.com',
    'http://localhost',
    'http://127.0.0.1',
  ];
  const origin  = request.headers.get('Origin') || '';
  const allow   = allowed.some(a => origin.startsWith(a)) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin'  : allow,
    'Access-Control-Allow-Methods' : 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers' : 'Content-Type',
  };
}

function respond(body, status, headers) {
  return new Response(
    body ? JSON.stringify(body) : null,
    {
      status,
      headers: {
        'Content-Type': body ? 'application/json' : 'text/plain',
        ...headers,
      },
    }
  );
}
