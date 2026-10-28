import React from 'react';
import { Heart, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#0B0F19] py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                ✦
              </span>
              <span className="font-display font-bold text-white text-sm">
                English Learning Dutt
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              Your friendly, personal AI English speaking & conversation coach.
              Listen → Speak → Correct → Explain → Practice → Remember → Improve.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span>Levels: A1, A2, B1, B2, C1</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Audio Privacy Protected
            </span>
            <span className="flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for English Learners
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} English Learning Dutt. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>CEFR Estimation Guide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
