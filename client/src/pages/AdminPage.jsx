import { useState, useEffect } from 'react'
import AdminTable from '../components/AdminTable'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)

  useEffect(() => {
    fetch('/api/admin/check', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setAuthenticated(data.authenticated)
        setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      })
      if (res.ok) {
        setAuthenticated(true)
      } else {
        setLoginError('Invalid password.')
      }
    } catch {
      setLoginError('Login failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setAuthenticated(false)
    setPassword('')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-sans font-black text-navy-800">CEOC Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Enter the admin password to continue.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none"
              autoFocus
            />
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-navy-800 text-white font-medium rounded-lg hover:bg-navy-700 transition-colors"
            >
              Log In
            </button>
          </form>
          <a href="/" className="block text-center text-sm text-gray-400 mt-4 hover:text-gray-600">
            Back to form
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3">
              <img src="/ceoc-logo.jpg" alt="CEOC Logo" className="w-10 h-10 rounded-full" />
              <span className="text-2xl font-sans font-black tracking-wide hover:text-gold-400 transition-colors">CEOC</span>
            </a>
            <span className="text-navy-300 text-sm hidden sm:inline">|</span>
            <span className="text-gold-400 text-sm hidden sm:inline">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-navy-200 hover:text-white transition-colors">
              Back to Form
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-navy-300 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 overflow-hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-sans font-black text-navy-800">Submitted Letters</h1>
          <p className="text-gray-500 text-sm mt-1">View, filter, and download advocacy letters.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 overflow-hidden">
          <AdminTable />
        </div>
      </main>

      <footer className="bg-navy-800 text-navy-300 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <a href="/privacy" className="text-navy-300 hover:text-white transition-colors">
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  )
}
