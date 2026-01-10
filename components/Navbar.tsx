
import React from 'react';
import { User } from '../types';
import { CHOCOLATE, GOLD } from '../constants';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onViewAccount: () => void;
  activeView: 'feed' | 'account';
  isVisible?: boolean; 
}

const getInitials = (name: string): string => {
  if (!name) return "?";
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return names[0].substring(0, 2).toUpperCase();
};

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onViewAccount, activeView, isVisible = true }) => {
  const displayName = user?.displayName || user?.username || "";
  const initials = getInitials(displayName);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E1DA] px-4 h-14 flex justify-between items-center shadow-sm transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex items-center space-x-2">
        <div 
          onClick={() => window.location.href = '/'}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-md academic-logo"
        >
          <span className="text-[#D4AF37] text-xl font-bold font-serif italic tracking-tighter">A</span>
        </div>
        <span className="font-bold text-[#2b1810] text-lg hidden sm:block ml-1 font-serif tracking-tight">Academic</span>
      </div>
      
      <div className="flex items-center space-x-2">
        {user && (
          <>
            <button 
              onClick={onViewAccount}
              className={`flex items-center space-x-1.5 p-1 px-3 rounded-full transition-colors ${
                activeView === 'account' ? 'bg-[#F4E4BC] text-[#2b1810]' : 'hover:bg-[#F9F6F1]'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[#2b1810] flex items-center justify-center overflow-hidden border border-[#D4AF37]/30 shadow-sm text-[10px] font-black text-[#D4AF37]">
                 {user.profilePic ? (
                   <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
                 ) : initials}
              </div>
              <span className="font-bold text-sm hidden md:block">{displayName}</span>
            </button>
            
            <div className="w-[1px] h-6 bg-[#E5E1DA] mx-1 hidden md:block"></div>

            <button 
              onClick={onLogout}
              className="w-9 h-9 rounded-full bg-[#F9F6F1] flex items-center justify-center hover:bg-[#E5E1DA] transition-colors text-[#2b1810]"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
