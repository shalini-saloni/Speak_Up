import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wind, Activity, Mic2, Heart, Clock, Search, Filter, Play } from 'lucide-react';
import { api } from '../lib/api';

export default function ExerciseLibrary() {
  const { currentUser } = useAuth();

  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('level');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoryMeta = useMemo(() => ({
    Breathing: { 
      icon: Wind, 
      color: 'text-primary bg-primary/20',
      bg: '/assets/exercises/breathing.png',
      gradient: 'from-teal-500/20 to-transparent'
    },
    'Vocal Warm-ups': { 
      icon: Mic2, 
      color: 'text-accent bg-accent/20',
      bg: '/assets/exercises/vocal.png',
      gradient: 'from-purple-500/20 to-transparent'
    },
    'Body Language': { 
      icon: Activity, 
      color: 'text-primary bg-primary/20',
      bg: null,
      gradient: 'from-blue-500/20 to-transparent'
    },
    Visualization: { 
      icon: Heart, 
      color: 'text-accent bg-accent/20',
      bg: null,
      gradient: 'from-pink-500/20 to-transparent'
    },
    Delivery: {
      icon: Mic2,
      color: 'text-primary bg-primary/20',
      bg: null,
      gradient: 'from-orange-500/20 to-transparent'
    },
    Storytelling: {
      icon: Play,
      color: 'text-accent bg-accent/20',
      bg: null,
      gradient: 'from-indigo-500/20 to-transparent'
    }
  }), []);

  const exerciseImageMap = {
    'Box Breathing': '/assets/exercises/box-breathing.webp',
    'Tongue Twister Warm-up': '/assets/exercises/tongue-twister.webp',
    'Confidence Posture Drill': '/assets/exercises/posture-drill.webp',
    'Pause & Punchline': '/assets/exercises/pause-punchline.jpg',
    'Story in 3 Sentences': '/assets/exercises/telling-story.webp',
    'Audience Scan Drill': '/assets/exercises/audience-scan-drill.webp'
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/exercises');
        if (ignore) return;
        setExercises(Array.isArray(data) ? data : []);
      } catch (err) {
        if (ignore) return;
        setError(err?.response?.data?.error || 'Failed to load exercises');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const categories = ['All', ...Array.from(new Set(exercises.map((e) => e.category)))];
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = category === 'All' ? exercises : exercises.filter((e) => e.category === category);
    if (q) {
      list = list.filter((e) =>
        String(e.title || '').toLowerCase().includes(q) ||
        String(e.description || '').toLowerCase().includes(q)
      );
    }
    const rank = { Easy: 0, Medium: 1, Hard: 2 };
    if (sortBy === 'duration') {
      return [...list].sort((a, b) => Number(a.durationMinutes || 0) - Number(b.durationMinutes || 0));
    }
    return [...list].sort((a, b) => (rank[a.difficulty] ?? 99) - (rank[b.difficulty] ?? 99));
  }, [category, exercises, query, sortBy]);

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200 relative overflow-hidden">
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-accent/15 rounded-full blur-[130px] -z-10 pointer-events-none" />
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Exercise Library</h1>
          <p className="text-slate-300">Guided techniques to calm your nerves and warm up your voice.</p>
          {!currentUser && (
            <div className="mt-4 text-sm text-slate-400">
              Browsing is free. <Link className="text-primary hover:underline" to="/login">Log in</Link> to track completion and earn XP.
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {categories.map((cat, idx) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all border ${cat === category ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <div className="glass-card p-4 flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative flex-grow">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search techniques..."
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-500 hidden md:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/40 border border-white/5 rounded-2xl px-6 py-3 text-white focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
            >
              <option value="level">Difficulty</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>


        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <AnimatePresence mode="popLayout">
            {(loading ? Array.from({ length: 6 }) : visible).map((ex, idx) => {
              if (loading) {
                return (
                  <div key={idx} className="glass-card p-8 animate-pulse h-64">
                    <div className="h-12 w-12 rounded-2xl bg-white/5" />
                    <div className="h-6 w-2/3 bg-white/5 rounded mt-8" />
                    <div className="h-4 w-1/2 bg-white/5 rounded mt-4" />
                  </div>
                );
              }

              const meta = categoryMeta[ex.category] || { icon: Activity, color: 'text-slate-200 bg-white/10', gradient: 'from-white/5 to-transparent' };
              const Icon = meta.icon;
              return (
                <motion.div
                  layout
                  key={ex.id || ex._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link 
                    to={`/exercises/${ex.id || ex._id}`} 
                    className="glass-card glass-panel-hover p-10 flex flex-col justify-between group min-h-[400px] relative overflow-hidden"
                  >
                    {/* Background Artwork */}
                    <div className="absolute inset-0 z-0">
                      {(exerciseImageMap[ex.title] || meta.bg) ? (
                        <img 
                          src={exerciseImageMap[ex.title] || meta.bg} 
                          alt="" 
                          className="w-full h-full object-cover opacity-[0.45] group-hover:opacity-[0.6] group-hover:scale-110 transition-all duration-700" 
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${meta.gradient} opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                    </div>

                    <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-end items-start">
                      <span className={`text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-xl ${
                        ex.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        ex.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {ex.difficulty}
                      </span>
                    </div>
                    
                    <div className="relative z-10 p-2">
                      <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 group-hover:text-primary transition-colors duration-300">{ex.title}</h3>
                      <div className="flex items-center gap-5 text-sm font-medium text-slate-500">
                        <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> {ex.category}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {ex.durationMinutes}m</span>
                      </div>
                    </div>

                    <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                         <Play className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
