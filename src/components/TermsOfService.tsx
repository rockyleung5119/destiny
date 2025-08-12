import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 text-lg">
            Last Updated: July 27, 2025
          </p>
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-blue-800 font-medium">
              Please read these terms carefully before using our services. By using Indicate.Top, you agree to be bound by these terms.
            </p>
          </div>
        </div>

        <div className="space-y-10">
          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Table of Contents</h2>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <a href="#section1" className="text-blue-600 hover:text-blue-800 py-1 block">1. Introduction</a>
              <a href="#section2" className="text-blue-600 hover:text-blue-800 py-1 block">2. Service Description</a>
              <a href="#section3" className="text-blue-600 hover:text-blue-800 py-1 block">3. User Obligations</a>
              <a href="#section4" className="text-blue-600 hover:text-blue-800 py-1 block">4. Privacy and Data Protection</a>
              <a href="#section5" className="text-blue-600 hover:text-blue-800 py-1 block">5. Payment Terms</a>
              <a href="#section6" className="text-blue-600 hover:text-blue-800 py-1 block">6. Disclaimer</a>
              <a href="#section7" className="text-blue-600 hover:text-blue-800 py-1 block">7. Contact Information</a>
            </div>
          </section>

          <section id="section1" className="border-l-4 border-purple-400 pl-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              1. Introduction
            </h2>
            <div className="text-gray-700 space-y-4 leading-relaxed">
              <p>Welcome to Indicate.Top, a comprehensive fortune-telling and divination platform that combines traditional Chinese metaphysics with cutting-edge artificial intelligence technology.</p>
              <p>By accessing, browsing, or using our website and services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.</p>
              <p>If you do not agree to these terms, you must immediately discontinue use of our services.</p>
              <p>These Terms constitute a legally binding agreement between you and Indicate.Top regarding your use of our platform and services.</p>
            </div>
          </section>

          <section id="section2" className="border-l-4 border-blue-400 pl-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              2. Service Description
            </h2>
            <div className="text-gray-700 space-y-4 leading-relaxed">
              <p>Indicate.Top is a comprehensive digital platform offering traditional Chinese metaphysical services enhanced by modern AI technology.</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Our Services Include:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>BaZi (Eight Characters) fortune analysis and life path readings</li>
                  <li>Zi Wei Dou Shu (Purple Star Astrology) comprehensive chart interpretations</li>
                  <li>AI-powered fortune predictions and personalized insights</li>
                  <li>Detailed divination reports with actionable recommendations</li>
                  <li>Daily, weekly, and monthly fortune forecasts</li>
                  <li>Compatibility analysis for relationships and business partnerships</li>
                </ul>
              </div>
              <p>All services are provided for entertainment, educational, and cultural exploration purposes only.</p>
              <p>Our platform combines ancient wisdom with modern technology to provide accessible and insightful readings while respecting traditional practices.</p>
            </div>
          </section>

          <section id="section3" className="border-l-4 border-green-400 pl-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              3. User Obligations and Responsibilities
            </h2>
            <div className="text-gray-700 space-y-4 leading-relaxed">
              <p>By using our platform, you acknowledge and agree to the following responsibilities:</p>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">You agree to comply with the following:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, complete, and truthful personal information for readings</li>
                  <li>Use the service responsibly and in accordance with applicable laws</li>
                  <li>Maintain the confidentiality of your account credentials</li>
                  <li>Respect intellectual property rights and proprietary information</li>
                  <li>Not use the service for illegal, harmful, or fraudulent purposes</li>
                  <li>Not attempt to reverse engineer, hack, or compromise our systems</li>
                  <li>Treat our staff and other users with respect and courtesy</li>
                </ul>
              </div>
              <p>Violation of these obligations may result in suspension or termination of your account and access to our services.</p>
            </div>
          </section>

          <section id="section4" className="border-l-4 border-indigo-400 pl-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              4. Privacy and Data Protection
            </h2>
            <div className="text-gray-700 space-y-4 leading-relaxed">
              <p>We are committed to protecting your privacy and personal information.</p>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Data We Collect:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Personal information (name, email, birth date, time, and location)</li>
                  <li>Usage data and service interaction patterns</li>
                  <li>Payment information for premium services (processed securely)</li>
                  <li>Device information and technical data for service improvement</li>
                  <li>Communication records for customer support purposes</li>
                </ul>
              </div>
              <p>Your personal information is encrypted using industry-standard security measures and stored on secure servers.</p>
              <p>We do not share your personal data with third parties without your explicit consent, except as required by law.</p>
              <p>You have the right to access, modify or delete your personal data at any time through your account settings.</p>
            </div>
          </section>

          <section id="section5" className="border-l-4 border-yellow-400 pl-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              5. Payment Terms and Billing
            </h2>
            <div className="text-gray-700 space-y-4 leading-relaxed">
              <p>Our services are offered on both Single Reading and premium subscription basis. Premium features require payment.</p>
              <p>All payments are processed securely through trusted payment providers. We do not store your payment information.</p>
              <p>Subscription fees are billed in advance and are non-refundable except as required by applicable law.</p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Refund Policy:</h3>
                <p>If you are dissatisfied and have not used the service, you can apply for a refund within 7 days after purchasing the premium service.</p>
                <p>Refund requests must be submitted through our customer support with a valid reason.</p>
              </div>
            </div>
          </section>

          <section id="section6" className="border-l-4 border-red-400 pl-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              6. Disclaimer and Limitations
            </h2>
            <div className="text-gray-700 space-y-4 leading-relaxed">
              <p>Our fortune-telling and divination services are based on traditional metaphysical practices, cultural beliefs, and AI-assisted analysis.</p>
              <p>All readings, predictions, and insights are provided for entertainment, educational, and cultural exploration purposes only.</p>
              <p>Results should not be used as the sole basis for important life decisions including medical, legal, financial, or relationship matters.</p>
              <p>We do not guarantee the accuracy, completeness, or reliability of any predictions or readings provided through our platform.</p>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <h3 className="font-bold text-red-800 mb-2">IMPORTANT DISCLAIMER:</h3>
                <p className="text-red-800 font-medium">
                  Consult qualified professionals for medical, legal, financial, psychological, or other important matters.
                </p>
                <p className="text-red-800 mt-2">
                  Individual results may vary. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </section>

          <section id="section7" className="border-l-4 border-gray-400 pl-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              7. Contact Information and Support
            </h2>
            <div className="text-gray-700 space-y-4 leading-relaxed">
              <p>For questions, concerns, or support regarding these Terms of Service, please contact us:</p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Email:</strong> support@indicate.top</p>
                    <p><strong>Website:</strong> https://www.indicate.top</p>
                  </div>
                  <div>
                    <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM (UTC+8)</p>
                    <p><strong>Response Time:</strong> We aim to respond within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t-2 border-gray-200 bg-gray-50 -mx-8 px-8 rounded-b-lg">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-500">
                These Terms of Service are effective as of the date last updated above and supersede all previous versions.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() => window.close()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                © 2025 Indicate.Top. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
