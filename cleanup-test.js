#!/usr/bin/env node
/**
 * CEOC Load Test Cleanup
 * Deletes all test records from the DB and their PDF files from disk,
 * then confirms integrity and 0 records.
 */

const Database = require('./server/node_modules/better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'server', 'ceoc.db');
const db = new Database(dbPath);

console.log('Fetching all PDF paths...');
const rows = db.prepare('SELECT id, pdf_path FROM letters').all();
console.log(`Found ${rows.length} records.`);

// Delete PDF files
const SERVER_DIR = path.join(__dirname, 'server');

function resolvePdfPath(p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  // Relative paths in the DB were written relative to server/ CWD
  return path.resolve(SERVER_DIR, p);
}

let deletedFiles = 0, missingFiles = 0, failedFiles = 0;
for (const row of rows) {
  if (!row.pdf_path) continue;
  const absPath = resolvePdfPath(row.pdf_path);
  try {
    fs.unlinkSync(absPath);
    deletedFiles++;
  } catch (e) {
    if (e.code === 'ENOENT') missingFiles++;
    else { console.error(`Failed to delete ${absPath}:`, e.message); failedFiles++; }
  }
}
console.log(`PDFs deleted: ${deletedFiles}, missing (ok): ${missingFiles}, failed: ${failedFiles}`);

// Delete all DB records
const result = db.prepare('DELETE FROM letters').run();
console.log(`Records deleted: ${result.changes}`);

// Final checks
const remaining = db.prepare('SELECT COUNT(*) as n FROM letters').get().n;
const integrity = db.pragma('integrity_check');

console.log(`\nRecords remaining: ${remaining === 0 ? '✅ 0' : '❌ ' + remaining}`);
console.log(`Integrity check:   ${integrity[0]?.integrity_check === 'ok' ? '✅ ok' : '❌ ' + JSON.stringify(integrity)}`);

db.close();
console.log('\nCleanup complete. Admin dashboard should now show 0 records.');
