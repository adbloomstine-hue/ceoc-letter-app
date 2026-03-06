import { useState, useCallback, useEffect } from 'react'

export default function RepLookup({ street, city, zip, onRepsFound, lookupRef }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reps, setReps] = useState(null)

  const lookupReps = useCallback(async () => {
    if (!street || !city || !zip || zip.length < 5) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/lookup-reps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street, city, zip }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setReps(null)
      } else {
        setReps(data)
        onRepsFound(data)
      }
    } catch {
      setError("We couldn't find your representatives. Please check your address and try again.")
      setReps(null)
    } finally {
      setLoading(false)
    }
  }, [street, city, zip, onRepsFound])

  // Expose lookupReps to parent via ref
  useEffect(() => {
    if (lookupRef) {
      lookupRef.current = lookupReps
    }
  }, [lookupRef, lookupReps])

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center gap-2 p-3 bg-navy-50 border border-navy-100 rounded-lg">
          <svg className="animate-spin h-4 w-4 text-navy-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-navy-700">Finding your representatives...</span>
        </div>
      )}

      {reps && !loading && (reps.assemblyMember || reps.senator) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-semibold text-green-800">Your Representatives Found</span>
          </div>
          {reps.assemblyMember && (
            <p className="text-sm text-green-800 ml-7">
              Assembly Member: <strong>{reps.assemblyMember.name}</strong> — District {reps.assemblyMember.district} ({reps.assemblyMember.party})
            </p>
          )}
          {reps.senator && (
            <p className="text-sm text-green-800 ml-7">
              State Senator: <strong>{reps.senator.name}</strong> — District {reps.senator.district} ({reps.senator.party})
            </p>
          )}
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      {!reps && !loading && !error && (
        <p className="text-xs text-gray-400">
          Your representatives will be found automatically when you complete your address.
        </p>
      )}
    </div>
  )
}
