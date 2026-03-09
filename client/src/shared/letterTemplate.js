/**
 * Shared letter template — SINGLE SOURCE OF TRUTH.
 *
 * Used by:
 *   - Client: imported directly into LetterPreview.jsx (ESM)
 *   - Server: loaded via dynamic import() at startup (see server/templates/letterTemplate.js)
 *
 * Any change here automatically updates both the live preview AND the PDF.
 */

export function generateLetterContent({ fullName, company, address, city, zip, assemblyMember, senator, signatureImage, date }) {
  const asmName = assemblyMember?.name || '[Assembly Member]';
  const asmDistrict = assemblyMember?.district || '[#]';

  const senName = senator?.name || '[Senator]';
  const senDistrict = senator?.district || '[#]';

  const displayName = fullName || '[Full Name]';
  const displayCompany = company || '[Company Name]';
  const displayAddress = address || '[Street Address]';
  const displayCity = city || '[City]';
  const displayZip = zip || '[ZIP]';
  const displayDate = date || '[Date]';

  const signatureHTML = signatureImage
    ? '<img src="' + signatureImage + '" style="max-height:60px;display:block;margin-bottom:4px;" />'
    : '<div style="height:50px;display:flex;align-items:flex-end;color:#ccc;font-style:italic;font-size:13px;margin-bottom:4px;font-family:sans-serif;">[Your signature will appear here]</div>';

  return '<style>'
    + '.ceoc-letter{font-family:"Liberation Serif","Noto Serif",Georgia,"Times New Roman",Times,serif;margin:0;padding:0;color:#222;font-size:14px;line-height:1.6}'
    + '.ceoc-letter .letter-body{padding:48px;max-width:680px}'
    + '.ceoc-letter .date{margin-bottom:20px;color:#555}'
    + '.ceoc-letter .content p{line-height:1.8;margin-bottom:14px}'
    + '.ceoc-letter .blockquote{border-left:3px solid #c9a84c;padding:10px 20px;margin:16px 0;font-style:italic;color:#444;background:#fafaf5}'
    + '.ceoc-letter .blockquote p{margin:0}'
    + '.ceoc-letter .signature-block{margin-top:28px;line-height:1.6}'
    + '.ceoc-letter .rep-row{display:flex;gap:24px;margin-top:8px}'
    + '.ceoc-letter .rep-row span{white-space:nowrap}'
    + '</style>'
    + '<div class="ceoc-letter">'
    + '<div class="letter-body">'
    + '<div class="date">' + displayDate + '</div>'
    + '<p><strong>Dear Senator Valladares,</strong></p>'
    + '<div class="content">'
    + '<p>I am writing to express my strong support for Senate Bill 1174, which creates a contracting preference for construction companies that operate an employee stock ownership plan, commonly referred to as an ESOP. I believe that fostering employee ownership is crucial for building a stronger, more equitable, and sustainable local economy.</p>'
    + '<p>Employee ownership offers significant benefits for businesses, employees, and the broader community.</p>'
    + '<p>Here\u2019s why employee ownership is so important:</p>'
    + '<p>Government Code Section 12100.31(c) perfectly explains the benefits of employee ownership:</p>'
    + '<div class="blockquote">'
    + '<p>\u201CEmployees becoming owners would create opportunities for wealth-building and community stability. It would also help California create a more inclusive, equitable, and stable economy, supported by the studies of employee-owned businesses and their success and resiliency during the Great Recession and the COVID-19 pandemic.\u201D</p>'
    + '</div>'
    + '<p>As an employee owner in the construction industry in California, this bill would allow me, my co-workers and thousands of other employee owners in California to experience the benefits and advantages currently provided to the few company owners who qualify for a DBE or similar program. I urge you to consider the many benefits of employee ownership and to actively support SB 1174 when it is heard on March 24 in the Senate Transportation Committee and promote employee ownership growth in California.</p>'
    + '<p>Thank you for your time and consideration.</p>'
    + '</div>'
    + '<div class="signature-block">'
    + '<p>Sincerely,</p>'
    + signatureHTML
    + '<strong>' + displayName + '</strong><br>'
    + displayCompany + '<br>'
    + displayAddress + '<br>'
    + displayCity + ', CA ' + displayZip
    + '<div class="rep-row">'
    + '<span>State Senator: ' + senName + ', SD ' + senDistrict + '</span>'
    + '<span>Assembly Member: ' + asmName + ', AD ' + asmDistrict + '</span>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';
}

const PDF_STYLE_OVERRIDES = '<style>'
  + '.ceoc-letter{font-size:13px;line-height:1.45}'
  + '.ceoc-letter .letter-body{padding:0}'
  + '.ceoc-letter .date{margin-bottom:14px}'
  + '.ceoc-letter .content p{line-height:1.55;margin-bottom:9px}'
  + '.ceoc-letter .blockquote{padding:8px 16px;margin:10px 0}'
  + '.ceoc-letter .signature-block{margin-top:20px;line-height:1.5}'
  + '.ceoc-letter .signature-block img{max-height:50px}'
  + '</style>';

export function generateLetterHTML(data) {
  return '<!DOCTYPE html>'
    + '<html>'
    + '<head><meta charset="utf-8">'
    + '<style>body,html{font-family:"Liberation Serif","Noto Serif",Georgia,"Times New Roman",Times,serif;}</style>'
    + '</head>'
    + '<body style="margin:0;padding:0;">'
    + generateLetterContent(data)
    + PDF_STYLE_OVERRIDES
    + '</body>'
    + '</html>';
}
