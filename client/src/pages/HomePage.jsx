import LetterForm from '../components/LetterForm'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-navy-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/ceoc-logo.jpg" alt="CEOC Logo" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-wide">CEOC</h1>
                <p className="text-gold-400 text-sm tracking-widest uppercase mt-0.5">
                  California Employee Ownership Coalition
                </p>
              </div>
            </div>
            <a
              href="/admin"
              className="text-sm text-navy-200 hover:text-white transition-colors hidden sm:block"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-navy-800 text-white pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-sans font-black mb-3">
              Make Your Voice Heard
            </h2>
            <p className="text-navy-100 text-base sm:text-lg leading-relaxed">
              Generate a signed advocacy letter to your California Assembly Member supporting
              employee ownership legislation. Fill out the form below, and we'll find your
              representative and create a personalized letter for you to download.
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <main className="max-w-6xl mx-auto px-4 -mt-6 sm:-mt-8 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
          <LetterForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy-800 text-navy-300 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <a href="/privacy" className="text-navy-300 hover:text-white transition-colors">
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  )
}
