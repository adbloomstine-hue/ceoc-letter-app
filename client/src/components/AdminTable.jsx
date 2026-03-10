import { useState, useEffect, useCallback } from 'react'

const PAGE_SIZE = 50

export default function AdminTable() {
  const [letters, setLetters] = useState([])
  const [stats, setStats] = useState({ total: 0, uniqueAssembly: 0, uniqueSenate: 0, companyCounts: [] })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ name: '', company: '', assemblyDistrict: '', senateDistrict: '' })
  const [exporting, setExporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalFiltered, setTotalFiltered] = useState(0)

  const fetchLetters = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.name) params.set('name', filters.name)
      if (filters.company) params.set('company', filters.company)
      if (filters.assemblyDistrict) params.set('assemblyDistrict', filters.assemblyDistrict)
      if (filters.senateDistrict) params.set('senateDistrict', filters.senateDistrict)
      params.set('page', page)
      params.set('limit', PAGE_SIZE)

      const [lettersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/letters?${params}`, { credentials: 'include' }),
        fetch('/api/admin/stats', { credentials: 'include' }),
      ])
      if (lettersRes.status === 401) throw new Error('unauthorized')

      const data = await lettersRes.json()
      setLetters(data.rows || [])
      setTotalPages(data.totalPages || 1)
      setTotalFiltered(data.total || 0)

      if (statsRes.ok) setStats(await statsRes.json())
    } catch (err) {
      if (err.message === 'unauthorized') throw err
      console.error('Failed to fetch letters:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    const timer = setTimeout(fetchLetters, 300)
    return () => clearTimeout(timer)
  }, [fetchLetters])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [filters.name, filters.company, filters.assemblyDistrict, filters.senateDistrict])

  const downloadPdf = async (id, name) => {
    const res = await fetch(`/api/admin/letters/${id}/pdf`, { credentials: 'include' })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CEOC-Letter-${name.replace(/\s+/g, '-')}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAll = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (filters.name) params.set('name', filters.name)
      if (filters.company) params.set('company', filters.company)
      if (filters.assemblyDistrict) params.set('assemblyDistrict', filters.assemblyDistrict)
      if (filters.senateDistrict) params.set('senateDistrict', filters.senateDistrict)
      const qs = params.toString()
      const res = await fetch(`/api/admin/export${qs ? '?' + qs : ''}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ceoc-letters-all.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export letters:', err)
    } finally {
      setExporting(false)
    }
  }

  const clearAll = async () => {
    setClearing(true)
    try {
      const res = await fetch('/api/admin/clear', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to clear')
      setShowClearConfirm(false)
      setPage(1)
      fetchLetters()
    } catch (err) {
      console.error('Failed to clear submissions:', err)
    } finally {
      setClearing(false)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'Z')
    return d.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const startIdx = (page - 1) * PAGE_SIZE

  return (
    <div className="overflow-hidden">
      {/* Summary Stats Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-baseline gap-6 mb-3">
          <div>
            <span className="text-2xl font-bold text-navy-800">{stats.total}</span>
            <span className="text-sm text-gray-500 ml-1.5">Total Letters</span>
          </div>
          <div>
            <span className="text-lg font-bold text-gold-700">{stats.uniqueAssembly}</span>
            <span className="text-xs text-gray-500 ml-1">Assembly Districts</span>
          </div>
          <div>
            <span className="text-lg font-bold text-green-700">{stats.uniqueSenate}</span>
            <span className="text-xs text-gray-500 ml-1">Senate Districts</span>
          </div>
        </div>
        {stats.companyCounts.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Letters by Company</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
              {stats.companyCounts.map((c) => (
                <div key={c.company} className="flex items-center justify-between text-sm py-0.5">
                  <span className="text-gray-700 truncate mr-2">{c.company}</span>
                  <span className="font-semibold text-navy-800 tabular-nums">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {(filters.name || filters.company || filters.assemblyDistrict || filters.senateDistrict) && (
          <div className="mt-3 text-sm text-gold-700 font-medium">
            Showing {totalFiltered} of {stats.total} total letters
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Filter by name..."
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none text-sm"
        />
        <select
          value={filters.company}
          onChange={(e) => setFilters((f) => ({ ...f, company: e.target.value }))}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none text-sm bg-white"
        >
          <option value="">All Companies</option>
          {stats.companyCounts.map((c) => (
            <option key={c.company} value={c.company}>{c.company} ({c.count})</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Assembly district..."
          value={filters.assemblyDistrict}
          onChange={(e) => setFilters((f) => ({ ...f, assemblyDistrict: e.target.value }))}
          className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none text-sm"
        />
        <input
          type="text"
          placeholder="Senate district..."
          value={filters.senateDistrict}
          onChange={(e) => setFilters((f) => ({ ...f, senateDistrict: e.target.value }))}
          className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none text-sm"
        />
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={downloadAll}
            disabled={exporting || stats.total === 0}
            className="px-4 py-2 bg-gold-500 text-white text-sm font-medium rounded-lg hover:bg-gold-600 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {exporting ? 'Exporting...' : 'Download All (ZIP)'}
          </button>
          {(filters.name || filters.company || filters.assemblyDistrict || filters.senateDistrict) && (
            <span className="text-[10px] text-gray-400">Downloads letters matching current filters</span>
          )}
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={stats.total === 0}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          Clear All
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-navy-800 mb-2">Clear All Submissions?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete all {stats.total} letter{stats.total !== 1 ? 's' : ''} and their PDF files. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearAll}
                disabled={clearing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {clearing ? 'Clearing...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-800 text-white">
              <th className="text-left px-3 py-3 font-medium w-8">#</th>
              <th className="text-left px-3 py-3 font-medium">Name</th>
              <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Company</th>
              <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">City</th>
              <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">ZIP</th>
              <th className="text-left px-3 py-3 font-medium">Assembly Member</th>
              <th className="text-left px-3 py-3 font-medium hidden sm:table-cell">Dist</th>
              <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Senator</th>
              <th className="text-left px-3 py-3 font-medium hidden sm:table-cell">Dist</th>
              <th className="text-left px-3 py-3 font-medium hidden xl:table-cell">Date</th>
              <th className="text-left px-3 py-3 font-medium">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-gray-400">Loading...</td>
              </tr>
            ) : letters.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-gray-400">No letters submitted yet.</td>
              </tr>
            ) : (
              letters.map((letter, i) => (
                <tr key={letter.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-400">{startIdx + i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-navy-800">{letter.full_name}</td>
                  <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">{letter.company}</td>
                  <td className="px-3 py-2.5 text-gray-600 hidden lg:table-cell">{letter.city}</td>
                  <td className="px-3 py-2.5 text-gray-600 hidden lg:table-cell">{letter.zip}</td>
                  <td className="px-3 py-2.5 text-gray-600">{letter.assembly_member || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600 hidden sm:table-cell">{letter.assembly_district || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">{letter.senator || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600 hidden sm:table-cell">{letter.senate_district || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-400 hidden xl:table-cell">{formatDate(letter.submitted_at)}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => downloadPdf(letter.id, letter.full_name)}
                      className="px-3 py-1.5 bg-navy-800 text-white text-xs font-medium rounded-md hover:bg-navy-700 transition-colors"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
        <div className="text-sm text-gray-400">
          {totalFiltered === 0
            ? '0 letters'
            : `Showing ${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, totalFiltered)} of ${totalFiltered} letter${totalFiltered !== 1 ? 's' : ''}`}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium text-navy-800 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-navy-800 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
