const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'ceoc.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    company TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    assembly_member TEXT,
    assembly_district TEXT,
    senator TEXT,
    senate_district TEXT,
    lat REAL,
    lng REAL,
    signature_image TEXT,
    pdf_path TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    letter_date TEXT
  )
`);

// Add columns if upgrading from old schema
const columns = db.pragma('table_info(letters)').map(c => c.name);
if (!columns.includes('senator')) {
  db.exec('ALTER TABLE letters ADD COLUMN senator TEXT');
}
if (!columns.includes('senate_district')) {
  db.exec('ALTER TABLE letters ADD COLUMN senate_district TEXT');
}
if (!columns.includes('assembly_district')) {
  db.exec('ALTER TABLE letters ADD COLUMN assembly_district TEXT');
}
if (!columns.includes('lat')) {
  db.exec('ALTER TABLE letters ADD COLUMN lat REAL');
}
if (!columns.includes('lng')) {
  db.exec('ALTER TABLE letters ADD COLUMN lng REAL');
}
if (!columns.includes('letter_date')) {
  db.exec('ALTER TABLE letters ADD COLUMN letter_date TEXT');
}

// Create indexes for faster queries at scale
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_submitted_at ON letters(submitted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_full_name ON letters(full_name);
  CREATE INDEX IF NOT EXISTS idx_company ON letters(company);
  CREATE INDEX IF NOT EXISTS idx_assembly_district ON letters(assembly_district);
  CREATE INDEX IF NOT EXISTS idx_senate_district ON letters(senate_district);
`);

const SELECT_COLS = 'id, full_name, company, address, city, zip, assembly_member, assembly_district, senator, senate_district, submitted_at, letter_date, pdf_path';

const queries = {
  insertLetter: db.prepare(`
    INSERT INTO letters (full_name, company, address, city, zip, assembly_member, assembly_district, senator, senate_district, lat, lng, signature_image, pdf_path, letter_date)
    VALUES (@full_name, @company, @address, @city, @zip, @assembly_member, @assembly_district, @senator, @senate_district, @lat, @lng, @signature_image, @pdf_path, @letter_date)
  `),

  getLetterById: db.prepare('SELECT * FROM letters WHERE id = ?'),

  getAllLetters: db.prepare(`SELECT ${SELECT_COLS} FROM letters ORDER BY submitted_at DESC`),

  // Paginated query with filters
  getLettersPaginated: (filters = {}, page = 1, limit = 50) => {
    let whereClauses = ['1=1'];
    const params = [];

    if (filters.name) {
      whereClauses.push('full_name LIKE ?');
      params.push(`%${filters.name}%`);
    }
    if (filters.company) {
      whereClauses.push('company LIKE ?');
      params.push(`%${filters.company}%`);
    }
    if (filters.assemblyDistrict) {
      whereClauses.push('assembly_district LIKE ?');
      params.push(`%${filters.assemblyDistrict}%`);
    }
    if (filters.senateDistrict) {
      whereClauses.push('senate_district LIKE ?');
      params.push(`%${filters.senateDistrict}%`);
    }

    const where = whereClauses.join(' AND ');
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) as total FROM letters WHERE ${where}`;
    const total = db.prepare(countSql).get(...params).total;

    const dataSql = `SELECT ${SELECT_COLS} FROM letters WHERE ${where} ORDER BY submitted_at DESC LIMIT ? OFFSET ?`;
    const rows = db.prepare(dataSql).all(...params, limit, offset);

    return { rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  searchLetters: (filters) => {
    let sql = `SELECT ${SELECT_COLS} FROM letters WHERE 1=1`;
    const params = [];

    if (filters.name) {
      sql += ' AND full_name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    if (filters.company) {
      sql += ' AND company LIKE ?';
      params.push(`%${filters.company}%`);
    }
    if (filters.assemblyDistrict) {
      sql += ' AND assembly_district LIKE ?';
      params.push(`%${filters.assemblyDistrict}%`);
    }
    if (filters.senateDistrict) {
      sql += ' AND senate_district LIKE ?';
      params.push(`%${filters.senateDistrict}%`);
    }

    sql += ' ORDER BY submitted_at DESC';
    return db.prepare(sql).all(...params);
  },

  getStats: () => {
    return db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT assembly_district) as uniqueAssembly,
        COUNT(DISTINCT senate_district) as uniqueSenate
      FROM letters
    `).get();
  },

  updatePdfPath: db.prepare('UPDATE letters SET pdf_path = ? WHERE id = ?'),

  deleteAllLetters: db.prepare('DELETE FROM letters'),

  getAllPdfPaths: db.prepare('SELECT pdf_path FROM letters WHERE pdf_path IS NOT NULL'),
};

module.exports = { db, queries };
