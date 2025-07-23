import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Membership from './components/Membership';
import LoginDetailed from './components/LoginDetailed';
import Footer from './components/Footer';


import Navigation from './components/Navigation';
import MemberSettings from './components/MemberSettings';

function App() {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status on app load
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          setCurrentUser(JSON.parse(user));
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
    };

    checkLoginStatus();
  }, []);

  const handleShowSettings = () => {
    setCurrentView('settings');
  };

  const handleBackToMain = () => {
    console.log('handleBackToMain called');
    setCurrentView('main');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView('main');
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  if (currentView === 'settings') {
    return (
      <LanguageProvider>
        <div className="relative min-h-screen shimmer-background">
          <MemberSettings onBack={handleBackToMain} />
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen shimmer-background">
        <Header />
        <Hero />
        <Services />
        <About />
        <Membership />
        <LoginDetailed onLoginSuccess={handleLoginSuccess} onShowSettings={handleShowSettings} />
        <Footer />

        {/* Navigation for logged in users */}
        <Navigation
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onShowSettings={handleShowSettings}
          onLogout={handleLogout}
        />
      </div>
    </LanguageProvider>
  );
}

export default App;