import React from 'react';
import { Mail, Clock, Globe, Calendar, ArrowLeft } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ← Back
        </button>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contact & Support
            </h1>
            <p className="text-xl text-gray-600">
              Get in touch with us for any questions or support needs.
            </p>
          </div>

          {/* Business Information Card */}
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Business Information</h2>
              <div className="w-16 h-1 bg-purple-600 mx-auto rounded"></div>
            </div>

            <div className="space-y-6">
              {/* Website */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Website</h3>
                  <a href="https://www.indicate.top" className="text-purple-600 hover:text-purple-700 font-medium">
                    www.indicate.top
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Email</h3>
                  <a href="mailto:support@indicate.top" className="text-blue-600 hover:text-blue-700 font-medium">
                    support@indicate.top
                  </a>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Business Hours</h3>
                  <p className="text-gray-600">Monday - Friday, 9:00 AM - 6:00 PM (EST)</p>
                </div>
              </div>

              {/* Founded */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Founded</h3>
                  <p className="text-gray-600">2025</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default ContactPage;
