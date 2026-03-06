require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { loadGeoData } = require('./services/geoData');
const { loadTemplate } = require('./templates/letterTemplate');
const lettersRouter = require('./routes/letters');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure PDF storage directory exists
const pdfDir = process.env.PDF_PATH || path.join(__dirname, 'storage/pdfs');
fs.mkdirSync(pdfDir, { recursive: true });

// Load GeoJSON into memory before anything else
loadGeoData();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', lettersRouter);
app.use('/api/admin', adminRouter);

// Production: Express serves the built React app
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Load shared letter template (ESM) then start server
loadTemplate().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to load letter template:', err);
  process.exit(1);
});
