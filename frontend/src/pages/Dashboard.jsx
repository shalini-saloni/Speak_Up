import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/authContext';
import { Activity, Flame, Award, Mic, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [stats, setStats] = useState({ sessionsDone: 0, exercisesDone: 0 });

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoadingSessions(true);
        if (!currentUser) return;
        const { data } = await api.get('/practice-sessions');
        if (ignore) return;
        setSessions(Array.isArray(data) ? data : []);
        const { data: s } = await api.get('/me/stats');
        if (!ignore) setStats(s);
      } catch {
        if (ignore) return;
        setSessions([]);
      } finally {
        if (!ignore) setLoadingSessions(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [currentUser]);

  const recent = useMemo(() => sessions.slice(0, 3), [sessions]);
  const sessionsCount = sessions.length;
  const clarityAvg = useMemo(() => {
    const last10 = sessions.slice(0, 10);
    if (last10.length === 0) return 0;
    const sum = last10.reduce((acc, s) => acc + Number(s?.metrics?.clarityScore || 0), 0);
    return Math.round(sum / last10.length);
  }, [sessions]);

  if (!currentUser) {
    return <div className="p-8 text-center text-white pt-24 min-h-screen">Please login to view dashboard.</div>;
  }

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200 relative overflow-hidden">
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/15 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[620px] h-[620px] bg-accent/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="max-w-7xl w-full mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
            <p className="text-slate-300 text-sm md:text-base">Ready to conquer your fear of public speaking today?</p>
          </div>
          <Link to="/practice" className="bg-primary hover:bg-primary-light text-background px-6 py-3 rounded-2xl font-bold transition flex items-center gap-2 shadow-lg shadow-primary/25">
            <Mic className="w-5 h-5" />
            New Practice Session
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-panel p-5 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 font-medium">Daily Streak</span>
              <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white">{currentUser.streak} Days</span>
            <span className="text-xs text-slate-400">Updated in real time from your activity.</span>
          </div>
          
          <div className="glass-panel p-5 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 font-medium">Total XP</span>
              <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white">{currentUser.xp}</span>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1">
               <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (currentUser.xp % 100) || 10)}%` }}></div>
            </div>
            <span className="text-xs text-slate-400">Earn XP from practice, exercises, and forum.</span>
          </div>

          <div className="glass-panel p-5 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 font-medium">Sessions Done</span>
              <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white">{stats.sessionsDone ?? sessionsCount}</span>
            <span className="text-xs text-slate-400">Total completed sessions.</span>
          </div>

          <div className="glass-panel p-5 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 font-medium">Exercises</span>
              <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white">{stats.exercisesDone ?? 0}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">Total exercises completed.</span>
          </div>
        </div>

        {/* Single-page compact content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-white">Speech Score Progress</h3>
                <div className="text-sm text-slate-400">Avg clarity: <span className="text-primary font-bold">{clarityAvg}%</span></div>
              </div>
              {sessions.length === 0 ? (
                <div className="h-32 w-full rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm text-slate-400">
                  Complete your first Practice session to see your progress chart.
                </div>
              ) : (
                <div className="h-32 w-full">
                  {(() => {
                    const data = sessions.slice(0, 7).reverse().map((s) => Number(s?.metrics?.clarityScore || 0));
                    const w = 600;
                    const h = 130;
                    const pad = 12;
                    const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
                    const minV = Math.max(0, Math.min(...data) - 10);
                    const maxV = Math.min(100, Math.max(...data) + 10);
                    const toY = (v) => pad + (h - pad * 2) * (1 - (v - minV) / Math.max(1, (maxV - minV)));
                    const pts = data.map((v, i) => `${pad + i * stepX},${toY(v)}`).join(' ');
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
                        <defs>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="rgba(249,115,22,0.55)" />
                            <stop offset="60%" stopColor="rgba(249,115,22,0.95)" />
                            <stop offset="100%" stopColor="rgba(245,158,11,0.95)" />
                          </linearGradient>
                        </defs>
                        <g opacity="0.45">
                          {[20, 50, 80, 110].map((yy) => (
                            <line key={yy} x1="0" y1={yy} x2={w} y2={yy} stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                          ))}
                        </g>
                        <polyline points={pts} fill="none" stroke="url(#lineGrad)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
                        {data.map((v, i) => (
                          <g key={i}>
                            <circle cx={pad + i * stepX} cy={toY(v)} r="6" fill="#f97316" />
                            <circle cx={pad + i * stepX} cy={toY(v)} r="14" fill="rgba(249,115,22,0.18)" />
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Recommended Exercise */}
            <div className="bg-gradient-to-r from-black to-surface rounded-2xl border border-white/10 p-6 flex flex-col md:flex-row items-center gap-5 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
               <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 z-10">
                 <Calendar className="w-8 h-8" />
               </div>
               <div className="flex-grow z-10">
                 <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Up Next for You</div>
                 <h3 className="text-2xl font-bold text-white mb-2">Box Breathing Exercise</h3>
                 <p className="text-slate-400 text-sm">Calm your nervous system before your scheduled presentation practice.</p>
               </div>
               <Link to="/exercises" className="z-10 mt-4 md:mt-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-white font-medium transition whitespace-nowrap">
                  Start Timer <ChevronRight className="w-4 h-4" />
               </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="glass-panel p-5">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                Your progress
              </h3>
              <div className="text-sm text-slate-300">
                Everything on this dashboard is driven from your saved sessions and profile stats (no mock numbers).
              </div>
              <div className="mt-4">
                <Link to="/forum" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-lg text-white font-semibold transition">
                  Go to community <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="text-lg font-bold text-white mb-3">Recent Practice Sessions</h3>
              {loadingSessions && <div className="text-sm text-slate-400">Loading…</div>}
              {!loadingSessions && recent.length === 0 && (
                <div className="text-sm text-slate-400 bg-white/5 border border-white/10 rounded-xl p-4">
                  No sessions yet. Start one from <Link to="/practice" className="text-primary hover:underline">Practice</Link>.
                </div>
              )}
              <div className="space-y-3">
                {!loadingSessions && recent.map((sess) => {
                  const score = Number(sess?.metrics?.clarityScore || 0);
                  return (
                    <div key={sess.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold text-sm">{sess.topic || 'Practice session'}</div>
                        <div className="text-xs text-slate-400">{new Date(sess.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-primary font-bold">{score}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
