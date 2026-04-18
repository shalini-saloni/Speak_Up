import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser } = useAuth();
  return (
    <header className="glass-navbar w-full py-2 px-7 md:px-14 flex justify-between items-center">
      <Link to="/landing" className="flex items-center group">
        <div className="h-9 w-auto flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <img src="/assets/SpeakUp_logo_final.png" alt="SpeakUp logo" className="h-full w-auto object-contain" />
        </div>
      </Link>
      
      <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-200 bg-white/[0.03] border border-white/10 rounded-full px-2 py-1">
        {currentUser ? (
          <>
            <Link to="/dashboard" className="px-4 py-2 rounded-full hover:bg-white/5 hover:text-white transition">Dashboard</Link>
            <Link to="/practice" className="px-4 py-2 rounded-full hover:bg-white/5 hover:text-white transition">Practice</Link>
            <Link to="/exercises" className="px-4 py-2 rounded-full hover:bg-white/5 hover:text-white transition">Exercises</Link>
            <Link to="/forum" className="px-4 py-2 rounded-full hover:bg-white/5 hover:text-white transition">Forum</Link>
          </>
        ) : null}
      </nav>

      <div className="flex items-center gap-4">
        <Link
          to={currentUser ? "/profile" : "/login"}
          className="w-11 h-11 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-white/10 transition cursor-pointer text-slate-200"
          aria-label={currentUser ? "Open profile" : "Log in"}
        >
          <User className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );

}
