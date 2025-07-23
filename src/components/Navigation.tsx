import React, { useState } from 'react';
import { Settings, User, LogOut, Menu, X } from 'lucide-react';
import { authAPI } from '../services/api';

interface NavigationProps {
  isLoggedIn: boolean;
  currentUser: any;
  onShowSettings: () => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  isLoggedIn, 
  currentUser, 
  onShowSettings, 
  onLogout 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  const handleSettingsClick = () => {
    onShowSettings();
    setIsMenuOpen(false);
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block fixed top-4 right-4 z-50">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2">
              <User size={16} className="text-white" />
              <span className="text-white text-sm font-medium">
                {currentUser?.name || 'User'}
              </span>
            </div>
            
            <button
              onClick={onShowSettings}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Member Settings"
            >
              <Settings size={18} />
            </button>
            
            <button
              onClick={onLogout}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-white"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 min-w-[200px]">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <User size={16} className="text-white" />
                <span className="text-white text-sm font-medium">
                  {currentUser?.name || 'User'}
                </span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handleSettingsClick}
                  className="w-full flex items-center gap-3 px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <Settings size={16} />
                  Member Settings
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;
