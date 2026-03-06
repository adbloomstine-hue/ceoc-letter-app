const express = require('express');
const router = express.Router();
const { queries } = require('../services/db');
const { lookupReps } = require('../services/repLookup');
const { generatePDF } = require('../services/pdfGenerator');

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
router.post('/submit-letter', async (req, res) => {
  try {
    const { fullName, company, address, city, zip, assemblyMember, senator, signatureImage, lat, lng } = req.body;

    if (!fullName || !company || !address || !city || !zip || !signatureImage) {
      return res.status(400).json({ error: 'All required fields must be filled in' });
    }

    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // Insert letter into database
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
