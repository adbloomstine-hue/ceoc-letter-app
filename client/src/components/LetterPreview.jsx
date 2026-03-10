import { generateLetterContent } from '../shared/letterTemplate'

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function LetterPreview({ formData, signatureImage }) {
  const html = generateLetterContent({
    fullName: formData.fullName,
    company: formData.company,
    address: formData.address,
    city: formData.city,
    zip: formData.zip,
    assemblyMember: formData.assemblyMember,
    senator: formData.senator,
    signatureImage,
    date: formatDate(),
  })

  const previewStyles = '<style>'
    + '.ceoc-letter{font-size:18px}'
    + '.ceoc-letter .content p{font-size:18px}'
    + '.ceoc-letter .address-block{font-size:18px}'
    + '.ceoc-letter .signature-block{font-size:18px}'
    + '</style>'

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div
        style={{ zoom: 0.55 }}
        dangerouslySetInnerHTML={{ __html: html + previewStyles }}
      />
    </div>
  )
}
