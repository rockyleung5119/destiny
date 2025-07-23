import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const { t } = useLanguage();

  const privacyFeatures = [
    {
      icon: Shield,
      titleKey: 'dataProtection',
      descriptionKey: 'dataProtectionDesc',
    },
    {
      icon: Lock,
      titleKey: 'encryption',
      descriptionKey: 'encryptionDesc',
    },
    {
      icon: Eye,
      titleKey: 'noTracking',
      descriptionKey: 'noTrackingDesc',
    },
    {
      icon: Database,
      titleKey: 'secureStorage',
      descriptionKey: 'secureStorageDesc',
    },
    {
      icon: UserCheck,
      titleKey: 'userControl',
      descriptionKey: 'userControlDesc',
    },
    {
      icon: FileText,
      titleKey: 'transparency',
      descriptionKey: 'transparencyDesc',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('privacyProtection')}</h3>
        <p className="text-gray-600 mb-6">{t('privacyDescription')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {privacyFeatures.map((feature, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">{t(feature.titleKey)}</h4>
              <p className="text-sm text-gray-600">{t(feature.descriptionKey)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">{t('privacyCommitment')}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {t('privacyCommitmentText')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">GDPR Compliant</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">CCPA Compliant</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">ISO 27001</span>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;