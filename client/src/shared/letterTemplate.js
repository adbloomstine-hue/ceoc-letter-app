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
    + '.ceoc-letter .date{margin-bottom:16px;color:#555}'
    + '.ceoc-letter .address-block{margin-bottom:16px;line-height:1.5}'
    + '.ceoc-letter .content p{line-height:1.8;margin-bottom:14px}'
    + '.ceoc-letter .signature-block{margin-top:28px;line-height:1.6}'
    + '.ceoc-letter .rep-row{display:flex;gap:24px;margin-top:8px}'
    + '.ceoc-letter .rep-row span{white-space:nowrap}'
    + '</style>'
    + '<div class="ceoc-letter">'
    + '<div class="letter-body">'
    + '<div class="date">' + displayDate + '</div>'
    + '<div class="address-block">'
    + 'The Honorable Suzette Martinez Valladares<br>'
    + 'California State Senate<br>'
    + '1021 O Street, Room 7140<br>'
    + 'Sacramento, CA 95814'
    + '</div>'
    + '<p><strong>Dear Senator Valladares:</strong></p>'
    + '<div class="content">'
    + '<p>I am writing to express my strong support for Senate Bill 1174, which creates a contracting preference for construction companies that operate an employee stock ownership plan (ESOP). I believe that fostering employee ownership is crucial for building a stronger and more sustainable local economy.</p>'
    + '<p>Employee ownership offers significant benefits for businesses, employees, and the broader community. Employees at ESOP companies have 92% higher median household wealth, earn 33% higher wages, and stay with their employers 52% longer than similar workers at traditional firms. These companies have also demonstrated greater stability during economic downturns, including the COVID-19 pandemic, when they were far more likely to preserve jobs, pay, and benefits.</p>'
    + '<p>As an employee owner in California, I believe the state should invest taxpayer dollars in companies that give employee owners across the state access to wealth-building opportunities that have historically been limited to company executives.</p>'
    + '<p>Please record my personal support for SB 1174. I invite you to share my position with any and all relevant legislators and appropriate legislative committees.</p>'
    + '<p>California should absolutely do more to promote employee ownership growth in California. Thank you for your time and consideration.</p>'
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
  + '.ceoc-letter{font-size:12.5px;line-height:1.4}'
  + '.ceoc-letter .letter-body{padding:0}'
  + '.ceoc-letter .date{margin-bottom:10px}'
  + '.ceoc-letter .address-block{margin-bottom:10px;line-height:1.4;font-size:12.5px}'
  + '.ceoc-letter .content p{line-height:1.45;margin-bottom:8px}'
  + '.ceoc-letter .signature-block{margin-top:16px;line-height:1.4}'
  + '.ceoc-letter .signature-block img{max-height:45px}'
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
