require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { loadGeoData } = require('./services/geoData');
const { loadTemplate } = require('./templates/letterTemplate');
const lettersRouter = require('./routes/letters');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure PDF storage directory exists
const pdfDir = process.env.PDF_PATH || path.join(__dirname, 'storage/pdfs');
fs.mkdirSync(pdfDir, { recursive: true });

// Load GeoJSON into memory before anything else
loadGeoData();

// Trust Railway's reverse proxy so secure cookies work behind HTTPS
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: isProduction
    ? process.env.CLIENT_URL
    : ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Use SQLite-backed session store instead of MemoryStore
const sessionDb = new Database(path.join(__dirname, 'sessions.db'));
app.use(session({
  store: new SqliteStore({
    client: sessionDb,
    expired: { clear: true, intervalMs: 900000 }, // clean expired sessions every 15 min
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', lettersRouter);
app.use('/api/admin', adminRouter);

// Production: Express serves the built React app
if (isProduction) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Load shared letter template (ESM) then start server
let server;
loadTemplate().then(() => {
  server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to load letter template:', err);
  process.exit(1);
});

// Graceful shutdown for Railway SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');

  // Force exit after 5 seconds so Railway doesn't SIGKILL us (which triggers crash emails)
  const forceExit = setTimeout(() => {
    console.log('Force exit after timeout');
    process.exit(0);
  }, 5000);
  forceExit.unref();

  if (server) {
    server.close(() => {
      try { sessionDb.close(); } catch (_) {}
      console.log('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Prevent unhandled errors from crashing the process silently
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Give time to flush logs, then exit
  setTimeout(() => process.exit(1), 1000);
});
