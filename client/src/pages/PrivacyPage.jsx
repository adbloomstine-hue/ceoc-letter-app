export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-navy-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-4">
              <img src="/ceoc-logo.jpg" alt="CEOC Logo" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-wide hover:text-gold-400 transition-colors">
                  CEOC
                </h1>
                <p className="text-gold-400 text-sm tracking-widest uppercase mt-0.5">
                  California Employee Ownership Coalition
                </p>
              </div>
            </a>
            <a
              href="/"
              className="text-sm text-navy-200 hover:text-white transition-colors"
            >
              Back to Form
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-[720px] w-full mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-3xl sm:text-4xl font-sans font-black text-navy-800 mb-2">
          Privacy Policy
        </h2>
        <p className="text-sm text-gray-500 mb-10">
          California Employee Ownership Coalition (CEOC) &mdash; Effective Date: March 5, 2026
        </p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          {/* Overview */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">Overview</h3>
            <p>
              The California Employee Ownership Coalition ("CEOC," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect the personal information you provide when using the CEOC Letter Generator at this website (the "Site").
            </p>
            <p className="mt-3">
              Please read this policy carefully before submitting your information. By using the Site, you agree to the practices described in this Privacy Policy.
            </p>
          </section>

          {/* What Information We Collect */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">What Information We Collect</h3>
            <p className="mb-3">
              When you use the CEOC Letter Generator, we collect the following information:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Full name</li>
              <li>Company name</li>
              <li>Home or work address (used solely to identify your California State Assembly Member and State Senator)</li>
              <li>Digital signature (drawn by you on the form)</li>
            </ul>
            <p className="mt-3">
              We do not collect your email address, phone number, social security number, financial information, or any other sensitive personal data.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">How We Use Your Information</h3>
            <p>
              We use your information for one purpose only: to generate a personalized advocacy letter in support of Senate Bill 1174, addressed to your California State Assembly Member and State Senator based on your address.
            </p>
            <p className="mt-3">
              Your address is used exclusively to identify your elected representatives using district boundary data stored locally on our server. Your address is not shared with any third party, including the California Legislature or any government agency.
            </p>
            <p className="mt-3">
              A copy of your submitted letter is stored securely on our servers so that CEOC staff can track advocacy participation. You will receive a downloadable PDF copy of your letter at the time of submission.
            </p>
          </section>

          {/* How We Do Not Use Your Information */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">How We Do Not Use Your Information</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>We do not sell your personal information to anyone</li>
              <li>We do not share your personal information with advertisers or marketing companies</li>
              <li>We do not use your information for any purpose other than generating your advocacy letter</li>
              <li>We do not send you emails or contact you after submission</li>
              <li>We do not use your information for automated decision-making or profiling</li>
            </ul>
          </section>

          {/* How We Store and Protect Your Information */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">How We Store and Protect Your Information</h3>
            <p>
              Your submitted information is stored in a secure database accessible only to authorized CEOC staff. We use industry-standard security practices to protect your data from unauthorized access.
            </p>
            <p className="mt-3">
              We retain submitted letter records for a period of one (1) year following the date of submission, after which records are deleted from our system.
            </p>
            <p className="mt-3">
              Your digital signature is stored solely as part of your submitted letter record and is not used for any other purpose.
            </p>
          </section>

          {/* Your Rights Under California Law */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">Your Rights Under California Law</h3>
            <p className="mb-3">
              If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Right to Know</strong> — You may request information about the personal data we have collected about you</li>
              <li><strong>Right to Delete</strong> — You may request that we delete your personal information from our records</li>
              <li><strong>Right to Opt-Out</strong> — We do not sell personal information, so there is nothing to opt out of</li>
              <li><strong>Right to Non-Discrimination</strong> — We will not discriminate against you for exercising any of your privacy rights</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us using the information at the bottom of this page. We will respond to verified requests within 45 days as required by law.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">Cookies and Tracking</h3>
            <p>
              This Site does not use tracking cookies, advertising pixels, or third-party analytics tools. We do not track your behavior across other websites.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">Third-Party Services</h3>
            <p>
              This Site uses the United States Census Bureau Geocoding API to convert your address into geographic coordinates for the purpose of identifying your representatives. Your address is transmitted to this service only for that purpose. No other third-party services receive your personal information.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">Children's Privacy</h3>
            <p>
              This Site is not directed at children under the age of 16. We do not knowingly collect personal information from children. If you believe a child has submitted information through this Site, please contact us and we will delete it promptly.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will update the Effective Date at the top of this page.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h3 className="text-xl font-sans font-black text-navy-800 mb-3">Contact Us</h3>
            <p>
              California Employee Ownership Coalition (CEOC)
              <br />
              Website:{' '}
              <a
                href="https://caemployeeownership.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-600 hover:text-gold-700 underline"
              >
                caemployeeownership.com
              </a>
            </p>
            <p className="mt-4 text-sm text-gray-500">
              This Privacy Policy was last updated on March 5, 2026.
            </p>
          </section>
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
