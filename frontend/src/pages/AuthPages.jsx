import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Mic, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-grow flex items-center justify-center p-6 bg-background relative overflow-hidden min-h-screen">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-md w-full glass-panel p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Mic className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-slate-400 text-sm">Sign in to continue your speaking journey.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white mt-1 focus:outline-none focus:border-primary transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white mt-1 focus:outline-none focus:border-primary transition"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="bg-primary hover:bg-primary-light text-white w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/20">
             {submitting ? 'Signing in…' : 'Sign In'} <LogIn className="w-4 h-4" />
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        
        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/onboarding');
    } catch (err) {
      setError(err?.response?.data?.error || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-grow flex items-center justify-center p-6 bg-background relative overflow-hidden min-h-screen">
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-md w-full glass-panel p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <UserPlus className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create an account</h2>
          <p className="text-slate-400 text-sm">Join SpeakUp and conquer glossophobia.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white mt-1 focus:outline-none focus:border-primary transition"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white mt-1 focus:outline-none focus:border-primary transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white mt-1 focus:outline-none focus:border-primary transition"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="bg-primary hover:bg-primary-light text-white w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/20">
             {submitting ? 'Creating…' : 'Create Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        
        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
