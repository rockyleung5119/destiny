import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Lock, Crown, Star, Zap, ArrowRight } from 'lucide-react';
import { authAPI } from '../services/api';

interface ServicePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
  reason: string;
  onLogin: () => void;
  onUpgrade: () => void;
}

const ServicePermissionModal: React.FC<ServicePermissionModalProps> = ({
  isOpen,
  onClose,
  serviceTitle,
  reason,
  onLogin,
  onUpgrade,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const isLoggedIn = authAPI.isLoggedIn();

  const getModalContent = () => {
    switch (reason) {
      case 'not_logged_in':
        return {
          icon: <Lock className="w-16 h-16 text-indigo-500" />,
          title: t('loginRequired'),
          description: t('loginRequiredDesc'),
          primaryAction: {
            text: t('loginNow'),
            onClick: onLogin,
            className: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          },
          secondaryAction: {
            text: t('cancel'),
            onClick: onClose,
            className: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
          },
        };

      case 'insufficient_permissions':
        return {
          icon: <Crown className="w-16 h-16 text-yellow-500" />,
          title: t('upgradeRequired'),
          description: t('upgradeRequiredDesc'),
          primaryAction: {
            text: t('upgradePlan'),
            onClick: onUpgrade,
            className: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white',
          },
          secondaryAction: {
            text: t('cancel'),
            onClick: onClose,
            className: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
          },
        };

      case 'no_credits':
        return {
          icon: <Star className="w-16 h-16 text-purple-500" />,
          title: t('noCreditsLeft'),
          description: t('noCreditsLeftDesc'),
          primaryAction: {
            text: t('upgradePlan'),
            onClick: onUpgrade,
            className: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
          },
          secondaryAction: {
            text: t('cancel'),
            onClick: onClose,
            className: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
          },
        };

      case 'membership_expired':
        return {
          icon: <Zap className="w-16 h-16 text-red-500" />,
          title: t('membershipExpired'),
          description: t('membershipExpiredDesc'),
          primaryAction: {
            text: t('renewMembership'),
            onClick: onUpgrade,
            className: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white',
          },
          secondaryAction: {
            text: t('cancel'),
            onClick: onClose,
            className: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
          },
        };

      default:
        return {
          icon: <Lock className="w-16 h-16 text-gray-500" />,
          title: t('accessDenied'),
          description: t('accessDeniedDesc'),
          primaryAction: {
            text: t('ok'),
            onClick: onClose,
            className: 'bg-gray-600 hover:bg-gray-700 text-white',
          },
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {content.icon}
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {content.title}
          </h3>

          {/* Service Title */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 mb-1">{t('requestedService')}</p>
            <p className="font-semibold text-gray-800">{serviceTitle}</p>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {content.description}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={content.primaryAction.onClick}
              className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 ${content.primaryAction.className}`}
            >
              {content.primaryAction.text}
              <ArrowRight className="w-4 h-4" />
            </button>

            {content.secondaryAction && (
              <button
                onClick={content.secondaryAction.onClick}
                className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-200 ${content.secondaryAction.className}`}
              >
                {content.secondaryAction.text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePermissionModal;
