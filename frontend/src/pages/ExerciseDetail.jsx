import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Square, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ExerciseDetail() {
  const Motion = motion;
  const { id } = useParams();
  const { currentUser, refreshMe } = useAuth();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('Inhale'); // Inhale, Hold, Exhale, Hold
  const [timeLeft, setTimeLeft] = useState(4); // 4-4-4-4 box breathing
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/exercises/${id}`);
        if (ignore) return;
        setExercise(data);
      } catch (err) {
        if (ignore) return;
        setError(err?.response?.data?.error || 'Failed to load exercise');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [id]);

  const isBreathing = (exercise?.category || '').toLowerCase() === 'breathing';
  const durationSeconds = Math.max(1, Number(exercise?.durationMinutes || 1) * 60);

  useEffect(() => {
    let interval;
    if (isActive && !sessionCompleted && isBreathing) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Cycle phase
            setPhase(p => {
              if (p === 'Inhale') return 'Hold (Full)';
              if (p === 'Hold (Full)') return 'Exhale';
              if (p === 'Exhale') return 'Hold (Empty)';
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, sessionCompleted, isBreathing]);

  useEffect(() => {
    let interval;
    if (isActive && !sessionCompleted && !isBreathing) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setSessionCompleted(true);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, sessionCompleted, isBreathing]);

  useEffect(() => {
    if (!isBreathing) {
      setPhase('Ready');
      setTimeLeft(durationSeconds);
    }
  }, [isBreathing, durationSeconds]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const completeExercise = async () => {
    if (!currentUser || markingDone) {
      setIsActive(false);
      setSessionCompleted(true);
      return;
    }
    setMarkingDone(true);
    setError('');
    try {
      await api.post(`/exercises/${id}/complete`);
      await refreshMe();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to mark completed');
    } finally {
      setMarkingDone(false);
    }
    setIsActive(false);
    setSessionCompleted(true);
  };

  const getScale = () => {
    if (!isBreathing) return 1;
    if (phase === 'Inhale') return 1.5;
    if (phase === 'Hold (Full)') return 1.5;
    if (phase === 'Exhale') return 1;
    if (phase === 'Hold (Empty)') return 1;
    return 1;
  };

  const title = exercise?.title || 'Exercise';
  const description = exercise?.description || 'Follow the steps to build confidence.';
  const steps = useMemo(() => (Array.isArray(exercise?.steps) ? exercise.steps : []), [exercise]);
  const timeFmt = useMemo(() => {
    const m = Math.floor((timeLeft || 0) / 60);
    const s = String((timeLeft || 0) % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, [timeLeft]);

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200">
      <div className="max-w-3xl w-full mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        
        <div className="w-full mb-8">
          <Link to="/exercises" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm transition">
             <ChevronLeft className="w-4 h-4" /> Back to Library
          </Link>
        </div>

        {error && (
          <div className="w-full mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!sessionCompleted ? (
          <div className="glass-panel w-full p-8 md:p-12 flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{loading ? 'Loading…' : title}</h1>
            <p className="text-slate-400 mb-10">{description}</p>

            {isBreathing ? (
            <div className="relative w-64 h-64 flex items-center justify-center mb-12">
               {/* Animated Background Blob */}
               <Motion.div 
                 className="absolute inset-0 bg-primary/20 rounded-full blur-[30px]"
                 animate={{ scale: getScale() }}
                 transition={{ duration: 4, ease: "linear" }}
               />
               
               {/* Main Animated Circle */}
               <Motion.div 
                 className={`absolute inset-0 rounded-full border-4 flex items-center justify-center ${isActive ? 'border-primary bg-primary/10' : 'border-slate-700 bg-surface'}`}
                 animate={{ scale: getScale() }}
                 transition={{ duration: 4, ease: "linear" }}
               >
               </Motion.div>
               
               {/* Central Text */}
               <div className="z-10 flex flex-col items-center pt-2">
                 {isActive ? (
                   <>
                     <span className="text-2xl font-bold text-white uppercase tracking-wider">{phase}</span>
                     <span className="text-4xl font-mono text-primary font-bold mt-2">{timeLeft}</span>
                   </>
                 ) : (
                   <span className="text-slate-400 font-medium">Ready</span>
                 )}
               </div>
            </div>
            ) : (
              <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl p-5 mb-10 text-left">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Exercise</div>
                <div className="text-white font-bold mt-2">Follow the steps below</div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="text-sm text-slate-400">Duration: {exercise?.durationMinutes} min</div>
                  <div className="text-sm">
                    <span className="text-slate-400">Countdown:</span>{' '}
                    <span className="text-primary font-bold tabular-nums">{timeFmt}</span>
                  </div>
                </div>
              </div>
            )}

            {!loading && steps.length > 0 && (
              <div className="w-full max-w-xl text-left mb-10">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Steps</div>
                <ol className="space-y-2 text-sm text-slate-300">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-300 flex-shrink-0">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={handleToggle}
                className="bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-full font-bold transition flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.35)]"
              >
                {isActive ? <><Square className="w-5 h-5 fill-current" /> {isBreathing ? 'Pause' : 'Stop'}</> : <><Play className="w-5 h-5 fill-current" /> Start</>}
              </button>
              {isActive && (
                <button 
                  onClick={completeExercise}
                  className="bg-surface hover:bg-white/10 px-6 py-4 border border-white/10 rounded-full font-bold transition"
                >
                  {markingDone ? 'Saving...' : 'Finish'}
                </button>
              )}
            </div>

            {currentUser ? (
              <button
                onClick={async () => {
                  try {
                    await api.post(`/exercises/${id}/complete`);
                    await refreshMe();
                  } catch (e) {
                    setError(e?.response?.data?.error || 'Failed to mark completed');
                  }
                }}
                className="mt-6 bg-white/10 hover:bg-white/15 border border-white/10 text-white px-8 py-4 rounded-full font-bold transition"
              >
                Mark as completed (+XP)
              </button>
            ) : (
              <div className="mt-6 text-sm text-slate-400">
                <Link className="text-primary hover:underline" to="/login">Log in</Link> to track completion and earn XP.
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel w-full p-8 md:p-12 flex flex-col items-center text-center animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">Well Done!</h2>
             <p className="text-slate-400 max-w-md mb-8">
              Nice work. Your completion has been saved to your profile.
             </p>
             <Link to="/exercises" className="bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-full font-bold transition">
               Back to Library
             </Link>
          </div>
        )}

      </div>
    </div>
  );
}
