const express = require('express');
const router = express.Router();
const { queries } = require('../services/db');
const archiver = require('archiver');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET /api/admin/check
router.get('/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

// GET /api/admin/stats
router.get('/stats', requireAuth, (req, res) => {
  try {
    const stats = queries.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/letters
router.get('/letters', requireAuth, (req, res) => {
  try {
    const { name, company, assemblyDistrict, senateDistrict, page = 1, limit = 50 } = req.query;
    const filters = {};
    if (name) filters.name = name;
    if (company) filters.company = company;
    if (assemblyDistrict) filters.assemblyDistrict = assemblyDistrict;
    if (senateDistrict) filters.senateDistrict = senateDistrict;

    const result = queries.getLettersPaginated(filters, parseInt(page, 10), parseInt(limit, 10));
    res.json(result);
  } catch (error) {
    console.error('Get letters error:', error);
    res.status(500).json({ error: 'Failed to fetch letters' });
  }
});

// GET /api/admin/letters/:id/pdf
router.get('/letters/:id/pdf', requireAuth, (req, res) => {
  try {
    const letter = queries.getLetterById.get(req.params.id);
    if (!letter || !letter.pdf_path) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    if (!fs.existsSync(letter.pdf_path)) {
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    res.download(letter.pdf_path, `CEOC-Letter-${letter.full_name.replace(/\s+/g, '-')}.pdf`);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// GET /api/admin/export
router.get('/export', requireAuth, (req, res) => {
  try {
    const letters = queries.getAllLetters.all();
    const pdfLetters = letters.filter((l) => {
      try { return l.pdf_path && fs.existsSync(l.pdf_path); }
      catch { return false; }
    });

    if (pdfLetters.length === 0) {
      return res.status(404).json({ error: 'No PDFs available for download' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=ceoc-letters-all.zip');

    // Use level 1 (fast) instead of 9 (max) — much faster for 300+ PDFs with minimal size difference
    const archive = archiver('zip', { zlib: { level: 1 } });
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'ZIP creation failed' });
    });
    archive.pipe(res);

    for (const letter of pdfLetters) {
      const filename = `letter-${letter.id}-${letter.full_name.replace(/\s+/g, '-')}.pdf`;
      archive.file(letter.pdf_path, { name: filename });
    }

    archive.finalize();
  } catch (error) {
    console.error('Export error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to export letters' });
  }
});

// DELETE /api/admin/clear
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    // Get all PDF paths before deleting records
    const pdfRows = queries.getAllPdfPaths.all();

    // Clear all records from the database first (fast)
    const result = queries.deleteAllLetters.run();

    // Delete PDF files from disk asynchronously (non-blocking)
    let deletedFiles = 0;
    let failedFiles = 0;

    const deletePromises = pdfRows.map(async (row) => {
      try {
        if (row.pdf_path) {
          await fsp.unlink(row.pdf_path);
          deletedFiles++;
        }
      } catch (fileErr) {
        // ENOENT = file doesn't exist — not a real failure
        if (fileErr.code !== 'ENOENT') {
          console.error(`Failed to delete PDF: ${row.pdf_path}`, fileErr);
          failedFiles++;
        }
      }
    });

    await Promise.all(deletePromises);

    res.json({
      success: true,
      deletedRecords: result.changes,
      deletedFiles,
      failedFiles,
    });
  } catch (error) {
    console.error('Clear submissions error:', error);
    res.status(500).json({ error: 'Failed to clear submissions' });
  }
});

module.exports = router;
