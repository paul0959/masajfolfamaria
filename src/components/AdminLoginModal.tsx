import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X } from 'lucide-react';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'administrator' && password === 'terapeut') {
      onLogin();
      setUsername('');
      setPassword('');
      setError('');
    } else {
      setError('Credențiale incorecte.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-sage-900/60 backdrop-blur-sm" onClick={onClose}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between bg-cream-50">
              <h3 className="text-xl font-serif text-sage-900 flex items-center gap-2">
                <Lock size={18} /> Autentificare
              </h3>
              <button onClick={onClose} className="text-sage-400 hover:text-sage-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Utilizator</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-sage-200 px-4 py-2 focus:outline-none focus:border-sage-500 text-sage-900" 
                  autoComplete="off"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Parolă</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-sage-200 px-4 py-2 focus:outline-none focus:border-sage-500 text-sage-900" 
                />
              </div>

              <div className="mt-8">
                <button type="submit" className="w-full bg-sage-700 text-white px-8 py-3 hover:bg-sage-600 transition-colors uppercase tracking-widest text-sm">
                  Intră în Panou
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
