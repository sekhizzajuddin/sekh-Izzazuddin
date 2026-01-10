
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { DEFAULT_ADMIN, CHOCOLATE, GOLD, GOLD_LIGHT } from '../constants';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Robustly verify/restore Admin credentials on every mount
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    const adminIndex = users.findIndex((u: any) => u.username === DEFAULT_ADMIN.username);
    
    if (adminIndex === -1) {
      users.push({
        id: 'admin-id',
        username: DEFAULT_ADMIN.username,
        password: DEFAULT_ADMIN.password,
        role: DEFAULT_ADMIN.role,
        displayName: 'Izzaz Admin'
      });
    } else {
      // Restore password if it was lost or changed in constants
      users[adminIndex].password = DEFAULT_ADMIN.password;
    }
    localStorage.setItem('app_users', JSON.stringify(users));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users: any[] = JSON.parse(localStorage.getItem('app_users') || '[]');

    if (isLogin) {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user); // Pass the full stored user object to ensure profile fields are included
      } else {
        setError('Incorrect username or password. Check credentials.');
      }
    } else {
      if (users.some(u => u.username === username)) {
        setError('Username already taken');
        return;
      }
      const newUser: User = { 
        id: `u-${Date.now()}`, 
        username, 
        password, 
        role: 'User',
        displayName: username // Default display name to username for new users
      };
      users.push(newUser);
      localStorage.setItem('app_users', JSON.stringify(users));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row items-center justify-center px-4 py-12 md:py-24">
      <div className="md:w-1/2 md:pr-16 text-center md:text-left mb-8 md:mb-0 max-w-lg">
        <h1 className="text-5xl md:text-6xl font-serif font-black mb-4 tracking-tighter" style={{ color: CHOCOLATE }}>Academic</h1>
        <p className="text-xl md:text-2xl text-[#5c4033] leading-tight font-medium">
          The premier space for curated Q&A and deep knowledge sharing.
        </p>
      </div>

      <div className="w-full max-w-[396px]">
        <div className="bg-white p-6 rounded-xl shadow-2xl border border-[#E5E1DA]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-md">{error}</div>}
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-lg bg-[#FDFBF7]"
              placeholder="Username"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-lg bg-[#FDFBF7]"
              placeholder="Password"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg text-[#D4AF37] text-xl font-bold transition-all active:scale-95 shadow-md hover:brightness-125"
              style={{ backgroundColor: CHOCOLATE }}
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>
          
          <div className="mt-4 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="px-6 py-3 rounded-lg text-[#2b1810] text-lg font-bold transition-all border border-[#D4AF37] bg-[#F4E4BC] hover:bg-[#D4AF37] hover:text-white"
            >
              {isLogin ? 'Create new account' : 'Back to login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
