#!/usr/bin/env node
/**
 * CEOC Letter Generator — 1,000 Submission Load Test
 * Usage: node load-test.js
 * Requires server running on localhost:3001 with TEST_MODE=true and RATE_LIMIT_DISABLED=true
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:3001';
const TOTAL = 1000;
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 500;

// ── Realistic test data pools ──────────────────────────────────────────────

const firstNames = ['James','Maria','David','Linda','Michael','Patricia','Robert','Jennifer','John','Barbara',
  'William','Susan','Richard','Jessica','Joseph','Sarah','Thomas','Karen','Charles','Lisa',
  'Christopher','Nancy','Daniel','Betty','Matthew','Margaret','Anthony','Sandra','Mark','Ashley',
  'Donald','Dorothy','Steven','Kimberly','Paul','Emily','Andrew','Donna','Kenneth','Michelle',
  'Joshua','Carol','Kevin','Amanda','Brian','Melissa','George','Deborah','Edward','Stephanie'];

const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts'];

const companies = [
  'Sunrise Bakery Co.','Pacific Coast Plumbing','Bay Area Tech Solutions','Golden Gate Staffing',
  'Central Valley Farms','Sierra Nevada Construction','LA Design Studio','San Diego Marine Services',
  'Inland Empire Logistics','Sacramento Valley Dentistry','Coastal Catering Group','Redwood Engineering',
  'Mission Hills Auto Repair','Harbor Freight Consulting','Valley Wide Insurance','Mesa Verde Landscaping',
  'Crestview Software Inc.','Sunbelt Distribution LLC','Pacific Rim Imports','Eastside Community Clinic',
  'Northgate Realty Group','Lakeshore Accounting Services','Hillcrest Medical Supply','Canyon View Hotels',
  'Desert Springs HVAC','Westwood Financial Advisors','Oakdale Manufacturing','Pinecrest Childcare',
  'Riverview Legal Group','Horizon Energy Partners','Blue Sky Aviation Services','Malibu Media Productions',
  'Vineyard Estate Winery','Foothill Veterinary Clinic','Bayview Seafood Market','Summit IT Consulting',
  'Garden Grove Florist','Lakewood Auto Glass','Clearwater Pool Services','Alpine Ski & Board Shop',
];

const caAddresses = [
  // LA area
  { address:'1234 Wilshire Blvd', city:'Los Angeles', zip:'90010' },
  { address:'5678 Sunset Blvd', city:'Hollywood', zip:'90028' },
  { address:'910 Venice Blvd', city:'Venice', zip:'90291' },
  { address:'2345 Colorado Blvd', city:'Pasadena', zip:'91101' },
  { address:'789 Long Beach Blvd', city:'Long Beach', zip:'90802' },
  { address:'456 Torrance Blvd', city:'Torrance', zip:'90503' },
  { address:'321 Santa Monica Blvd', city:'Santa Monica', zip:'90401' },
  { address:'654 Burbank Blvd', city:'Burbank', zip:'91505' },
  // Bay Area
  { address:'100 Market St', city:'San Francisco', zip:'94105' },
  { address:'400 Broadway', city:'Oakland', zip:'94607' },
  { address:'221 Main St', city:'San Jose', zip:'95113' },
  { address:'800 El Camino Real', city:'Palo Alto', zip:'94301' },
  { address:'500 Castro St', city:'Mountain View', zip:'94041' },
  { address:'123 University Ave', city:'Berkeley', zip:'94710' },
  { address:'77 Fremont St', city:'San Francisco', zip:'94105' },
  { address:'900 Blossom Hill Rd', city:'San Jose', zip:'95123' },
  // San Diego
  { address:'600 Broadway', city:'San Diego', zip:'92101' },
  { address:'1122 Garnet Ave', city:'San Diego', zip:'92109' },
  { address:'333 College Blvd', city:'Oceanside', zip:'92057' },
  { address:'88 Town Center Pkwy', city:'Santee', zip:'92071' },
  // Sacramento
  { address:'1500 J St', city:'Sacramento', zip:'95814' },
  { address:'2200 L St', city:'Sacramento', zip:'95816' },
  { address:'777 Sunrise Blvd', city:'Roseville', zip:'95678' },
  { address:'400 Howe Ave', city:'Sacramento', zip:'95825' },
  // Central Valley
  { address:'1800 Fulton St', city:'Fresno', zip:'93721' },
  { address:'2100 H St', city:'Bakersfield', zip:'93301' },
  { address:'600 W Main St', city:'Visalia', zip:'93291' },
  { address:'900 McHenry Ave', city:'Modesto', zip:'95350' },
  { address:'1400 Sutter St', city:'Stockton', zip:'95206' },
  { address:'300 W Tulare Ave', city:'Tulare', zip:'93274' },
];

// Fake IP pool — 200 different IPs so rate limiter won't block the test
const fakeIPs = Array.from({ length: 200 }, (_, i) => {
  const a = 10 + (i % 50);
  const b = 1 + Math.floor(i / 50);
  return `${a}.${b}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
});

// Minimal valid 1x1 transparent PNG as base64 (real signature placeholder)
const FAKE_SIG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildPayload(i) {
  const loc = randomItem(caAddresses);
  const first = randomItem(firstNames);
  const last = randomItem(lastNames);
  return {
    fullName: `${first} ${last}`,
    company: randomItem(companies),
    address: loc.address,
    city: loc.city,
    zip: loc.zip,
    assemblyMember: { name: `Assembly Member ${Math.floor(Math.random() * 80) + 1}`, district: String(Math.floor(Math.random() * 80) + 1) },
    senator: { name: `Senator ${Math.floor(Math.random() * 40) + 1}`, district: String(Math.floor(Math.random() * 40) + 1) },
    signatureImage: FAKE_SIG,
    lat: 34.0 + (Math.random() * 6),
    lng: -122.0 + (Math.random() * 8),
  };
}

// ── HTTP request helper ──────────────────────────────────────────────────────

function postJSON(url, body, fakeIP) {
  return new Promise((resolve) => {
    const start = performance.now();
    const bodyStr = JSON.stringify(body);
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'X-Forwarded-For': fakeIP,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          ms: Math.round(performance.now() - start),
          body: data.slice(0, 200),
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, ms: Math.round(performance.now() - start), body: err.message });
    });

    req.setTimeout(120000, () => {
      req.destroy();
      resolve({ status: 0, ms: 120000, body: 'TIMEOUT' });
    });

    req.write(bodyStr);
    req.end();
  });
}

// ── Run batches ──────────────────────────────────────────────────────────────

async function runLoadTest() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('CEOC Load Test — 1,000 Submissions');
  console.log(`Target: ${BASE_URL}/api/submit-letter`);
  console.log(`Batches: ${TOTAL / BATCH_SIZE} × ${BATCH_SIZE} concurrent, ${BATCH_DELAY_MS}ms delay`);
  console.log('='.repeat(60));

  const results = [];
  const overallStart = performance.now();
  let batchNum = 0;

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    batchNum++;
    const batchStart = performance.now();
    const batchPromises = [];

    for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL); j++) {
      const fakeIP = fakeIPs[j % fakeIPs.length];
      batchPromises.push(postJSON(`${BASE_URL}/api/submit-letter`, buildPayload(j), fakeIP));
    }

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    const batchMs = Math.round(performance.now() - batchStart);
    const ok = batchResults.filter(r => r.status === 200).length;
    const errs = batchResults.filter(r => r.status !== 200);
    const avgMs = Math.round(batchResults.reduce((s, r) => s + r.ms, 0) / batchResults.length);

    process.stdout.write(
      `Batch ${String(batchNum).padStart(2)} [${i + 1}-${Math.min(i + BATCH_SIZE, TOTAL)}]: ` +
      `${ok}/${batchResults.length} ok, avg ${avgMs}ms, batch ${batchMs}ms` +
      (errs.length ? `  ⚠ errors: ${errs.map(e => `${e.status}(${e.body.slice(0,40)})`).join(', ')}` : '') +
      '\n'
    );

    if (i + BATCH_SIZE < TOTAL) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  const totalMs = Math.round(performance.now() - overallStart);

  // ── Summary ──────────────────────────────────────────────────────────────
  const success = results.filter(r => r.status === 200);
  const failures = results.filter(r => r.status !== 200);
  const status429 = results.filter(r => r.status === 429);
  const status500 = results.filter(r => r.status === 500);
  const timeouts = results.filter(r => r.body === 'TIMEOUT');
  const allMs = results.map(r => r.ms).sort((a, b) => a - b);
  const avgMs = Math.round(allMs.reduce((s, v) => s + v, 0) / allMs.length);
  const p95 = allMs[Math.floor(allMs.length * 0.95)];
  const p99 = allMs[Math.floor(allMs.length * 0.99)];

  console.log(`\n${'='.repeat(60)}`);
  console.log('RESULTS');
  console.log('='.repeat(60));
  console.log(`Total time:      ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`Successes:       ${success.length}/${TOTAL} (${((success.length / TOTAL) * 100).toFixed(1)}%)`);
  console.log(`Failures:        ${failures.length}`);
  console.log(`  429 rate limit: ${status429.length}`);
  console.log(`  500 errors:     ${status500.length}`);
  console.log(`  Timeouts:       ${timeouts.length}`);
  console.log(`  Other:          ${failures.length - status429.length - status500.length - timeouts.length}`);
  console.log(`Avg response:    ${avgMs}ms`);
  console.log(`p95 response:    ${p95}ms`);
  console.log(`p99 response:    ${p99}ms`);
  console.log(`Min response:    ${allMs[0]}ms`);
  console.log(`Max response:    ${allMs[allMs.length - 1]}ms`);

  if (failures.length > 0) {
    console.log('\nFirst 5 failures:');
    failures.slice(0, 5).forEach(f => console.log(`  status=${f.status} body=${f.body}`));
  }

  return { success: success.length, failures: failures.length, avgMs, p95, p99, totalMs };
}

// ── DB verification ──────────────────────────────────────────────────────────

function getDB() {
  const Database = require('./server/node_modules/better-sqlite3');
  const path = require('path');
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'server', 'ceoc.db');
  return new Database(dbPath, { readonly: true });
}

async function verifyDatabase(expectedCount) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('DATABASE VERIFICATION');
  console.log('='.repeat(60));

  const db = getDB();

  // WAL mode
  const walMode = db.pragma('journal_mode');
  console.log(`WAL mode:        ${walMode[0]?.journal_mode === 'wal' ? '✅ wal' : '❌ ' + JSON.stringify(walMode)}`);

  // Record count
  const { total } = db.prepare('SELECT COUNT(*) as total FROM letters').get();
  console.log(`Total records:   ${total} (expected ≥ ${expectedCount}) ${total >= expectedCount ? '✅' : '❌'}`);

  // Missing fields
  const missingName = db.prepare("SELECT COUNT(*) as n FROM letters WHERE full_name IS NULL OR full_name=''").get().n;
  const missingCompany = db.prepare("SELECT COUNT(*) as n FROM letters WHERE company IS NULL OR company=''").get().n;
  const missingPdf = db.prepare("SELECT COUNT(*) as n FROM letters WHERE pdf_path IS NULL").get().n;
  console.log(`Missing name:    ${missingName === 0 ? '✅ 0' : '❌ ' + missingName}`);
  console.log(`Missing company: ${missingCompany === 0 ? '✅ 0' : '❌ ' + missingCompany}`);
  console.log(`Missing pdf_path:${missingPdf === 0 ? '✅ 0' : '❌ ' + missingPdf}`);

  // Duplicate IDs
  const { dupes } = db.prepare('SELECT COUNT(*) - COUNT(DISTINCT id) as dupes FROM letters').get();
  console.log(`Duplicate IDs:   ${dupes === 0 ? '✅ 0' : '❌ ' + dupes}`);

  // Integrity check
  const integrity = db.pragma('integrity_check');
  const ok = integrity[0]?.integrity_check === 'ok';
  console.log(`Integrity check: ${ok ? '✅ ok' : '❌ ' + JSON.stringify(integrity)}`);

  db.close();
  return { total, ok };
}

async function verifyPDFs(expectedCount) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('PDF FILE VERIFICATION');
  console.log('='.repeat(60));

  const db = getDB();
  const rows = db.prepare('SELECT pdf_path FROM letters WHERE pdf_path IS NOT NULL ORDER BY id DESC').all();
  db.close();

  const fs = require('fs');
  const pathMod = require('path');
  const SERVER_DIR = pathMod.join(__dirname, 'server');
  const resolvePdf = p => p && (pathMod.isAbsolute(p) ? p : pathMod.resolve(SERVER_DIR, p));
  let found = 0, missing = 0;
  for (const row of rows) {
    const abs = resolvePdf(row.pdf_path);
    if (abs && fs.existsSync(abs)) found++;
    else missing++;
  }
  console.log(`PDFs on disk:    ${found}/${rows.length} ${missing === 0 ? '✅' : '❌ missing: ' + missing}`);
  return { found, missing };
}

// ── Admin dashboard check ────────────────────────────────────────────────────

async function checkAdminDashboard() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('ADMIN DASHBOARD CHECK');
  console.log('='.repeat(60));

  // Login
  const loginRes = await postJSON(`${BASE_URL}/api/admin/login`, { password: process.env.ADMIN_PASSWORD || 'admin123!' }, '127.0.0.1');
  console.log(`Admin login:     status=${loginRes.status} ${loginRes.status === 200 ? '✅' : '❌'}`);

  // GET /api/admin/letters (page 1) — timing test
  const start = performance.now();
  const lettersRes = await new Promise((resolve) => {
    const lib = BASE_URL.startsWith('https') ? https : http;
    const parsed = new URL(`${BASE_URL}/api/admin/letters?page=1&limit=50`);
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { Cookie: '' }, // no session cookie needed — checking timing only with stats
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, ms: Math.round(performance.now() - start), body: data.slice(0, 300) }));
    });
    req.on('error', (err) => resolve({ status: 0, ms: Math.round(performance.now() - start), body: err.message }));
    req.end();
  });

  console.log(`Admin /letters:  status=${lettersRes.status}, ${lettersRes.ms}ms ${lettersRes.ms < 3000 ? '✅' : '⚠ slow: ' + lettersRes.ms + 'ms'}`);
  return { loginOk: loginRes.status === 200 };
}

// ── Rate limit spot check ────────────────────────────────────────────────────

async function checkRateLimit() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('RATE LIMIT CHECK (5 requests from same IP)');
  console.log('='.repeat(60));

  const TEST_IP = '192.168.99.1'; // unique IP not used in load test
  const statuses = [];
  for (let i = 0; i < 7; i++) {
    const r = await postJSON(`${BASE_URL}/api/submit-letter`, buildPayload(9000 + i), TEST_IP);
    statuses.push(r.status);
    process.stdout.write(`  Request ${i + 1}: status=${r.status}\n`);
  }
  const got429 = statuses.some(s => s === 429);
  console.log(`Rate limit fires after 5: ${got429 ? '✅' : '❌ no 429 received'}`);
  return got429;
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    // Health check
    const health = await new Promise((resolve) => {
      const lib = BASE_URL.startsWith('https') ? https : http;
      const parsed = new URL(`${BASE_URL}/api/health`);
      const req = lib.request({ hostname: parsed.hostname, port: parsed.port || 80, path: parsed.pathname, method: 'GET' }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      });
      req.on('error', (e) => resolve({ status: 0, body: e.message }));
      req.end();
    });

    if (health.status !== 200) {
      console.error(`❌ Server not reachable at ${BASE_URL} — status=${health.status} body=${health.body}`);
      console.error('Start the server with: TEST_MODE=true RATE_LIMIT_DISABLED=true node server/index.js');
      process.exit(1);
    }
    console.log(`✅ Server reachable: ${health.body}`);

    // Wave 1
    console.log('\n── WAVE 1 ──────────────────────────────────────────────────');
    const wave1 = await runLoadTest();

    // DB + PDF verification
    await verifyDatabase(wave1.success);
    await verifyPDFs(wave1.success);

    // Admin dashboard
    await checkAdminDashboard();

    // Wave 2 (stability check)
    console.log('\n── WAVE 2 (stability recovery check) ──────────────────────');
    const wave2 = await runLoadTest();

    await verifyDatabase(wave1.success + wave2.success);
    await verifyPDFs(wave1.success + wave2.success);

    // Rate limit check (re-enable limiter first via env — can't change process.env of running server,
    // so we just test with RATE_LIMIT_DISABLED=false by running against a rate-limit-enabled endpoint)
    await checkRateLimit();

    // Final integrity check
    console.log(`\n${'='.repeat(60)}`);
    console.log('FINAL INTEGRITY CHECK');
    const db = getDB();
    const finalCount = db.prepare('SELECT COUNT(*) as n FROM letters').get().n;
    const integrity = db.pragma('integrity_check');
    db.close();
    console.log(`Total records:   ${finalCount}`);
    console.log(`Integrity:       ${integrity[0]?.integrity_check === 'ok' ? '✅ ok' : '❌ ' + JSON.stringify(integrity)}`);

    console.log(`\n${'='.repeat(60)}`);
    console.log('LOAD TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`Wave 1: ${wave1.success}/1000 ok, avg ${wave1.avgMs}ms, p95 ${wave1.p95}ms`);
    console.log(`Wave 2: ${wave2.success}/1000 ok, avg ${wave2.avgMs}ms, p95 ${wave2.p95}ms`);
    console.log(`Total records in DB: ${finalCount}`);
    console.log('');
    console.log('Run cleanup: node cleanup-test.js');

  } catch (err) {
    console.error('Load test error:', err);
    process.exit(1);
  }
})();
