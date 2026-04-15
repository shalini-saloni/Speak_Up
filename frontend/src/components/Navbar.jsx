import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/authContext';

export default function Navbar() {
  const { currentUser } = useAuth();
  return (
    <header className="w-full py-5 px-7 md:px-14 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl bg-background/65 border-b border-white/10">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
          <Mic className="text-white w-6 h-6" />
        </div>
        <span className="text-3xl font-display font-bold tracking-tight text-white">SpeakUp</span>
      </Link>
      
      <nav className="hidden md:flex items-center gap-2 text-base font-medium text-slate-200 bg-white/5 border border-white/10 rounded-full px-2 py-1">
        {!currentUser ? (
          <>
            <a href="/#testimonials" className="px-4 py-2 rounded-full hover:bg-white/10 transition">Testimonials</a>
            <a href="/#programs" className="px-4 py-2 rounded-full hover:bg-white/10 transition">Programs</a>
            <a href="/#about" className="px-4 py-2 rounded-full hover:bg-white/10 transition">About</a>
            <a href="/#contact" className="px-4 py-2 rounded-full hover:bg-white/10 transition">Contact</a>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="px-4 py-2 rounded-full hover:bg-white/10 transition">Dashboard</Link>
            <Link to="/practice" className="px-4 py-2 rounded-full hover:bg-white/10 transition">Practice</Link>
            <Link to="/exercises" className="px-4 py-2 rounded-full hover:bg-white/10 transition">Exercises</Link>
            <Link to="/forum" className="px-4 py-2 rounded-full hover:bg-white/10 transition">Forum</Link>
          </>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {!currentUser && (
          <Link
            to="/signup"
            className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-background px-5 py-3 rounded-full font-semibold transition shadow-[0_0_22px_rgba(249,115,22,0.35)]"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        <Link
          to={currentUser ? "/profile" : "/login"}
          className="w-12 h-12 rounded-full border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer text-slate-200"
          aria-label={currentUser ? "Open profile" : "Log in"}
        >
          <User className="w-6 h-6" />
        </Link>
      </div>
    </header>
  );
}
