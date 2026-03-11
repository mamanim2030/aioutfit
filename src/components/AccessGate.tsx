import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

interface AccessGateProps {
  onAccessGranted: () => void;
}

export function AccessGate({ onAccessGranted }: AccessGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded access code for demonstration
    // In a real app, this would validate against a backend
    if (code === 'outfit2025') {
      onAccessGranted();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-4xl text-white mb-2">Internal Access</h1>
          <p className="text-white/40 text-sm">This application is restricted to authorized personnel only.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors`}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group"
          >
            <span>Enter Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center mt-8 text-xs text-white/20">
          Protected by SecureGate • Code: outfit2025
        </p>
      </motion.div>
    </div>
  );
}
