import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Membership from './components/Membership';
import LoginDetailed from './components/LoginDetailed';
import Footer from './components/Footer';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import ContactPage from './components/ContactPage';

import Navigation from './components/Navigation';
import MemberSettings from './components/MemberSettings';
import TestBaziDisplay from './components/TestBaziDisplay';

import HealthCheck from './components/HealthCheck';
import ErrorBoundary from './components/ErrorBoundary';

// 内部组件，使用AuthContext
function AppContent() {
  const [currentView, setCurrentView] = useState<'main' | 'settings' | 'test' | 'terms' | 'privacy' | 'contact'>('main');
  const [forceRender, setForceRender] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

  console.log('🔍 App render - currentView:', currentView, 'isAuthenticated:', isAuthenticated, 'user:', user);

  // 监听认证状态变化
  useEffect(() => {
    const handleAuthStateChange = () => {
      console.log('🔄 Auth state changed, forcing re-render');
      setForceRender(prev => prev + 1);
      // 如果在设置页面且用户已登出，返回主页
      if (!isAuthenticated && currentView === 'settings') {
        setCurrentView('main');
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, [isAuthenticated, currentView]);

  const handleShowSettings = () => {
    setCurrentView('settings');
  };

  const handleBackToMain = () => {
    console.log('handleBackToMain called');
    setCurrentView('main');
  };

  const handleShowTest = () => {
    setCurrentView('test');
  };

  const handleShowTerms = () => {
    setCurrentView('terms');
  };

  const handleShowPrivacy = () => {
    setCurrentView('privacy');
  };

  const handleShowContact = () => {
    setCurrentView('contact');
  };

  const handleScrollToMembership = () => {
    const membershipSection = document.getElementById('membership');
    if (membershipSection) {
      membershipSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logout initiated');
    logout();
    setCurrentView('main');
    // 强制重新渲染
    setForceRender(prev => prev + 1);
  };

  const handleLoginSuccess = (userData: any) => {
    // AuthContext会自动处理用户状态更新
    console.log('Login success:', userData);
  };

  if (currentView === 'settings') {
    return (
      <div className="relative min-h-screen shimmer-background">
        <MemberSettings onBack={handleBackToMain} />
      </div>
    );
  }

  if (currentView === 'test') {
    return (
      <div className="relative min-h-screen">
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={handleBackToMain}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回主页
          </button>
        </div>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">测试页面</h2>
          <p className="text-gray-600">测试功能正在开发中...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'terms') {
    return (
        <div className="relative min-h-screen bg-gray-50">
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={handleBackToMain}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              ← Back
            </button>
          </div>
          <div className="pt-16">
            <TermsOfService />
          </div>
        </div>
    );
  }

  if (currentView === 'privacy') {
    return (
        <div className="relative min-h-screen bg-gray-50">
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={handleBackToMain}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              ← Back
            </button>
          </div>
          <div className="pt-16">
            <PrivacyPolicyPage />
          </div>
        </div>
    );
  }

  if (currentView === 'contact') {
    return (
        <ContactPage onBack={() => setCurrentView('main')} />
    );
  }

  return (
    <div className="min-h-screen shimmer-background">
        <Header />
        <Hero />
        <Services onShowSettings={handleShowSettings} />
        <About />
        <Membership />
        <LoginDetailed onLoginSuccess={handleLoginSuccess} onShowSettings={handleShowSettings} onShowTerms={handleShowTerms} />
        <Footer
          onShowTerms={handleShowTerms}
          onShowPrivacy={handleShowPrivacy}
          onScrollToMembership={handleScrollToMembership}
          onShowContact={handleShowContact}
        />

        {/* Navigation for logged in users */}
        <Navigation
          isLoggedIn={isAuthenticated}
          currentUser={user}
          onShowSettings={handleShowSettings}
          onLogout={handleLogout}
        />

        {/* Health Check Component */}
        <HealthCheck />
    </div>
  );
}

// 主App组件，提供AuthProvider
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;