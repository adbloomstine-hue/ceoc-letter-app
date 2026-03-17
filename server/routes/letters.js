const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const { queries } = require('../services/db');
const { lookupReps } = require('../services/repLookup');
const { generatePDF } = require('../services/pdfGenerator');

// Max 100 submissions per IP per 15 minutes
// (many employees share one public IP at a company office)
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_DISABLED === 'true',
  message: { error: 'Too many submissions from this IP. Please try again later.' },
  // In production, trust proxy is set (Railway). In dev, suppress the X-Forwarded-For
  // validation warning since we handle proxy trust correctly for each environment.
  validate: { xForwardedForHeader: false },
});

// POST /api/lookup-reps
router.post('/lookup-reps', async (req, res) => {
  try {
    const { street, city, zip } = req.body;

    if (!street || !city || !zip) {
      return res.status(400).json({ error: 'Street, city, and zip are required' });
    }

    const result = await lookupReps(street, city, zip);
    res.json(result);
  } catch (error) {
    console.error('Rep lookup error:', error);
    res.status(500).json({
      assemblyMember: null,
      senator: null,
      error: error.message || 'Failed to look up representatives. Please check your address and try again.',
    });
  }
});

// POST /api/submit-letter
router.post('/submit-letter', submitLimiter, async (req, res) => {
  try {
    const { fullName, company, address, city, zip, assemblyMember, senator, signatureImage, lat, lng } = req.body;

    if (!fullName || !company || !address || !city || !zip || !signatureImage) {
      return res.status(400).json({ error: 'All required fields must be filled in' });
    }

    const date = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // Insert letter into database (letter_date captures the date printed on the letter)
    const result = queries.insertLetter.run({
      full_name: fullName,
      company,
      address,
      city,
      zip,
      assembly_member: assemblyMember?.name || null,
      assembly_district: assemblyMember?.district || null,
      senator: senator?.name || null,
      senate_district: senator?.district || null,
      lat: lat || null,
      lng: lng || null,
      signature_image: signatureImage,
      pdf_path: null,
      letter_date: date,
    });

    const letterId = result.lastInsertRowid;

    // Generate PDF
    const { filepath } = await generatePDF({
      fullName, company, address, city, zip,
      assemblyMember, senator, signatureImage, date,
    }, letterId);

    // Update PDF path in database
    queries.updatePdfPath.run(filepath, letterId);

    // Send PDF as download
    res.download(filepath, `CEOC-Letter-${fullName.replace(/\s+/g, '-')}.pdf`);
  } catch (error) {
    console.error('Submit letter error:', error);
    res.status(500).json({ error: 'Failed to generate letter. Please try again.' });
  }
});

module.exports = router;
