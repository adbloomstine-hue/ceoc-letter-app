import { useState, useCallback, useRef } from 'react'
import SignaturePad from './SignaturePad'
import RepLookup from './RepLookup'
import LetterPreview from './LetterPreview'

const INITIAL_FORM = {
  fullName: '',
  company: '',
  address: '',
  city: '',
  state: 'CA',
  zip: '',
  assemblyMember: null,
  senator: null,
  lat: null,
  lng: null,
}

export default function LetterForm() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [companySelect, setCompanySelect] = useState('')
  const [signatureImage, setSignatureImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const repLookupRef = useRef(null)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCompanySelect = (e) => {
    const val = e.target.value
    setCompanySelect(val)
    setFormData((prev) => ({ ...prev, company: val === '__other__' ? '' : val }))
  }

  const handleCompanyOther = (e) => {
    setFormData((prev) => ({ ...prev, company: e.target.value }))
  }

  const handleRepsFound = useCallback((data) => {
    setFormData((prev) => ({
      ...prev,
      assemblyMember: data.assemblyMember,
      senator: data.senator,
      lat: data.lat,
      lng: data.lng,
    }))
  }, [])

  const handleZipBlur = useCallback(() => {
    // Trigger rep lookup from the RepLookup component
    if (repLookupRef.current) {
      repLookupRef.current()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.fullName || !formData.company || !formData.address || !formData.city || !formData.zip) {
      setError('Please fill in all required fields.')
      return
    }
    if (!formData.assemblyMember || !formData.senator) {
      setError('We could not find your Assembly Member or Senator. Please check that your address is correct and within California.')
      return
    }
    if (!signatureImage) {
      setError('Please provide your digital signature.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/submit-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          company: formData.company,
          address: formData.address,
          city: formData.city,
          zip: formData.zip,
          assemblyMember: formData.assemblyMember,
          senator: formData.senator,
          signatureImage,
          lat: formData.lat,
          lng: formData.lng,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit letter')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CEOC-Letter-${formData.fullName.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-sans font-black text-navy-800 mb-2">
          Your letter has been submitted.
        </h2>
        <p className="text-gray-600 mb-6">
          Check your downloads for a copy. Thank you for advocating for employee ownership in California!
        </p>
        <button
          onClick={() => {
            setSubmitted(false)
            setFormData(INITIAL_FORM)
            setCompanySelect('')
            setSignatureImage(null)
          }}
          className="px-6 py-2 bg-gold-500 text-white font-medium rounded-lg hover:bg-gold-600 transition-colors"
        >
          Submit Another Letter
        </button>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Form */}
      <div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-navy-800 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-colors"
              placeholder=""
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-navy-800 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <select
              id="company"
              required
              value={companySelect}
              onChange={handleCompanySelect}
              className="w-full px-4 py-2.5 h-[46px] text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-colors bg-white"
            >
              <option value="" disabled>-- Select Your Company --</option>
              <option value="Pavement Recycling Systems, Inc.">Pavement Recycling Systems, Inc.</option>
              <option value="Marina Landscape">Marina Landscape</option>
              <option value="Caltrol">Caltrol</option>
              <option value="Blois Construction">Blois Construction</option>
              <option value="Bapko Metal">Bapko Metal</option>
              <option value="Ghilotti Construction Company">Ghilotti Construction Company</option>
              <option value="Griffith Company">Griffith Company</option>
              <option value="Riverside Construction">Riverside Construction</option>
              <option value="Couts Heating and Cooling">Couts Heating and Cooling</option>
              <option value="Murray Company">Murray Company</option>
              <option value="McGuire and Hester">McGuire and Hester</option>
              <option value="__other__">Other</option>
            </select>
            {companySelect === '__other__' && (
              <input
                type="text"
                required
                value={formData.company}
                onChange={handleCompanyOther}
                placeholder="Please enter your company name"
                className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-colors"
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label htmlFor="address" className="block text-sm font-medium text-navy-800">
                Home Address <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => { if (repLookupRef.current) repLookupRef.current() }}
                title="Refresh address lookup"
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-navy-600 hover:text-gold-600 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0113.5-4.5L20 7M20 15a8 8 0 01-13.5 4.5L4 17" />
                </svg>
                Refresh
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-1">We use your home address to find your state representatives.</p>
            <input
              id="address"
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-colors"
              placeholder=""
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-navy-800 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-colors"
                placeholder=""
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-navy-800 mb-1">
                State
              </label>
              <input
                id="state"
                type="text"
                value="CA"
                readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-navy-800 mb-1">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                id="zip"
                name="zip"
                type="text"
                required
                value={formData.zip}
                onChange={handleChange}
                onBlur={handleZipBlur}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-colors"
                placeholder=""
              />
            </div>
          </div>

          {/* Rep Lookup */}
          <div className="pt-1">
            <RepLookup
              street={formData.address}
              city={formData.city}
              zip={formData.zip}
              onRepsFound={handleRepsFound}
              lookupRef={repLookupRef}
            />
          </div>

          {/* Signature */}
          <div className="pt-1">
            <SignaturePad onSignatureChange={setSignatureImage} />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 leading-relaxed">
            By submitting this form, you agree to our{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy-800 underline hover:text-gold-600 transition-colors"
            >
              Privacy Policy
            </a>
            . Your information will be used solely to generate your advocacy letter and will not be sold or shared with third parties.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gold-500 text-white font-semibold rounded-lg hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg shadow-md hover:shadow-lg"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Your Letter...
              </span>
            ) : (
              'Submit & Download Letter'
            )}
          </button>
        </form>
      </div>

      {/* Live Preview */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <h3 className="text-lg font-sans font-black text-navy-800 mb-3">Letter Preview</h3>
        <LetterPreview formData={formData} signatureImage={signatureImage} />
      </div>
    </div>
  )
}
