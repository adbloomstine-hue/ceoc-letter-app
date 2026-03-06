const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const { generateLetterHTML } = require('../templates/letterTemplate');

const PDF_DIR = process.env.PDF_PATH || path.join(__dirname, '..', 'storage', 'pdfs');

// Ensure PDF directory exists
fs.mkdirSync(PDF_DIR, { recursive: true });

/**
 * Find the Chromium executable path.
 * Checks env var first (for Railway/production), then common system paths.
 */
function findChromiumPath() {
  // Explicit env var takes priority (set CHROMIUM_PATH on Railway)
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;

  // Common paths on different systems
  const candidates = [
    // Nixpacks / Railway (nixpkgs chromium)
    '/nix/var/nix/profiles/default/bin/chromium',
    // Linux
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(
    'Chromium not found. Set CHROMIUM_PATH env var or install Chromium. ' +
    'Checked: ' + candidates.join(', ')
  );
}

// Resolve path once at startup
let chromiumPath;
try {
  chromiumPath = findChromiumPath();
  console.log('Chromium found at:', chromiumPath);
} catch (err) {
  console.warn('Warning:', err.message);
  console.warn('PDF generation will fail until Chromium is available.');
}

async function generatePDF(letterData, letterId) {
  if (!chromiumPath) {
    throw new Error('Chromium is not available. Cannot generate PDF.');
  }

  const html = generateLetterHTML(letterData);
  const filename = `letter-${letterId}-${Date.now()}.pdf`;
  const filepath = path.join(PDF_DIR, filename);

  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: { top: '0.75in', right: '0.85in', bottom: '0.75in', left: '0.85in' },
      printBackground: true,
    });

    await fsp.writeFile(filepath, pdfBuffer);
  } finally {
    await browser.close();
  }

  return { filepath, filename };
}

module.exports = { generatePDF, PDF_DIR };
