/**
 * Server-side wrapper for the shared letter template.
 *
 * The single source of truth lives at: client/src/shared/letterTemplate.js (ESM)
 * This CJS module loads it via dynamic import() at startup.
 *
 * IMPORTANT: Call loadTemplate() before the server starts listening.
 */

let _generateLetterContent = null;
let _generateLetterHTML = null;

async function loadTemplate() {
  const templatePath = require('path').resolve(__dirname, '../../client/src/shared/letterTemplate.js');
  const mod = await import(templatePath);
  _generateLetterContent = mod.generateLetterContent;
  _generateLetterHTML = mod.generateLetterHTML;
  console.log('Letter template loaded from shared source');
}

function generateLetterContent(data) {
  if (!_generateLetterContent) throw new Error('Template not loaded. Call loadTemplate() first.');
  return _generateLetterContent(data);
}

function generateLetterHTML(data) {
  if (!_generateLetterHTML) throw new Error('Template not loaded. Call loadTemplate() first.');
  return _generateLetterHTML(data);
}

module.exports = { loadTemplate, generateLetterContent, generateLetterHTML };
