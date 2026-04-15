import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/authContext';
import { Link } from 'react-router-dom';
import { Wind, Activity, Mic2, Heart, Clock } from 'lucide-react';
import { api } from '../lib/api';

export default function ExerciseLibrary() {
  const { currentUser } = useAuth();

  const [category, setCategory] = useState('All');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const iconForCategory = useMemo(() => ({
    Breathing: { icon: Wind, color: 'text-primary bg-primary/20' },
    'Vocal Warm-ups': { icon: Mic2, color: 'text-accent bg-accent/20' },
    'Body Language': { icon: Activity, color: 'text-primary bg-primary/20' },
    Visualization: { icon: Heart, color: 'text-accent bg-accent/20' },
  }), []);

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
  const visible = category === 'All' ? exercises : exercises.filter((e) => e.category === category);

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200 relative overflow-hidden">
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-accent/15 rounded-full blur-[130px] -z-10 pointer-events-none" />
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Exercise Library</h1>
          <p className="text-slate-300">Guided techniques to calm your nerves and warm up your voice.</p>
          {!currentUser && (
            <div className="mt-4 text-sm text-slate-400">
              Browsing is free. <Link className="text-primary hover:underline" to="/login">Log in</Link> to track completion and earn XP.
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition ${cat === category ? 'bg-primary text-white' : 'bg-surface text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(loading ? Array.from({ length: 6 }) : visible).map((ex, idx) => {
            if (loading) {
              return (
                <div key={idx} className="glass-panel p-6 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-white/10" />
                  <div className="h-5 w-2/3 bg-white/10 rounded mt-6" />
                  <div className="h-4 w-1/2 bg-white/10 rounded mt-3" />
                </div>
              );
            }

            const meta = iconForCategory[ex.category] || { icon: Activity, color: 'text-slate-200 bg-white/10' };
            const Icon = meta.icon;
            return (
              <Link to={`/exercises/${ex.id}`} key={ex.id} className="glass-panel p-6 flex flex-col gap-6 hover:bg-white/5 transition group cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    ex.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    ex.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {ex.difficulty}
                  </span>
                </div>
                
                <div className="z-10">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition">{ex.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                     <span>{ex.category}</span>
                     <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ex.durationMinutes} min</span>
                  </div>
                </div>

                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
