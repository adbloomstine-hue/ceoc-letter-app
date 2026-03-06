const htmlPdfNode = require('html-pdf-node');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const { generateLetterHTML } = require('../templates/letterTemplate');

const PDF_DIR = process.env.PDF_PATH || path.join(__dirname, '..', 'storage', 'pdfs');

// Ensure PDF directory exists
fs.mkdirSync(PDF_DIR, { recursive: true });

async function generatePDF(letterData, letterId) {
  const html = generateLetterHTML(letterData);
  const filename = `letter-${letterId}-${Date.now()}.pdf`;
  const filepath = path.join(PDF_DIR, filename);

  const file = { content: html };
  const options = {
    format: 'Letter',
    margin: { top: '0.75in', right: '0.85in', bottom: '0.75in', left: '0.85in' },
    printBackground: true,
  };

  const pdfBuffer = await htmlPdfNode.generatePdf(file, options);
  await fsp.writeFile(filepath, pdfBuffer);

  return { filepath, filename };
}

module.exports = { generatePDF, PDF_DIR };
