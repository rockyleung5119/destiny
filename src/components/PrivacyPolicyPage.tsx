import React from 'react';

const PrivacyPolicyPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last Updated: July 27, 2025
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                Please read this privacy policy carefully before using our services. By using Indicate.Top, you agree to be bound by this privacy policy.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Privacy Protection Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                1. Privacy Protection
              </h2>
              <p className="text-gray-600 mb-4">
                Your personal information and cosmic data are protected with enterprise-grade security
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Data Protection</h3>
                  <p className="text-gray-600 text-sm">All personal data is encrypted and stored securely with industry-standard protocols</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">End-to-End Encryption</h3>
                  <p className="text-gray-600 text-sm">Your readings and personal information are encrypted from device to server</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">No Third-Party Tracking</h3>
                  <p className="text-gray-600 text-sm">We never share your data with advertisers or third-party tracking services</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Secure Storage</h3>
                  <p className="text-gray-600 text-sm">Data is stored in certified secure facilities with regular security audits</p>
                </div>
              </div>
            </section>

            {/* Data Collection Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. Information We Collect
              </h2>
              <p className="text-gray-600 mb-4">
                We collect and process the following types of information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li>Personal information (name, email, birth date and time)</li>
                <li>Usage data and service preferences</li>
                <li>Payment information for premium services</li>
              </ul>
            </section>

            {/* User Control Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. User Control
              </h2>
              <p className="text-gray-600 mb-4">
                You have full control over your data and can delete it at any time
              </p>
              <p className="text-gray-600">
                You have the right to access, modify, or delete your personal data at any time.
              </p>
            </section>

            {/* Transparency Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. Full Transparency
              </h2>
              <p className="text-gray-600 mb-4">
                Clear privacy policies with no hidden data collection or usage
              </p>
              <p className="text-gray-600">
                Your personal information is encrypted and stored securely. We do not share your data with third parties without your consent.
              </p>
            </section>

            {/* Privacy Commitment Section */}
            <section className="bg-purple-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-purple-800 mb-4">
                Our Privacy Commitment
              </h2>
              <p className="text-purple-700">
                We are committed to protecting your privacy and maintaining the confidentiality of your cosmic journey. Your trust is sacred to us, and we employ the highest standards of data protection to ensure your personal information remains secure.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. Contact Us
              </h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  <strong>Email:</strong> support@indicate.top
                </p>
                <p className="text-gray-600">
                  <strong>Website:</strong> https://www.indicate.top
                </p>
              </div>
            </section>
          </div>

          <div className="border-t border-gray-300 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>This Privacy Policy is effective as of the date last updated above.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
