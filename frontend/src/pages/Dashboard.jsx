import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Activity, Flame, Award, Mic, TrendingUp, Calendar, ChevronRight, BarChart3, Clock } from 'lucide-react';
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
        console.log('[Dashboard] Fetching sessions...');
        const { data } = await api.get('/practice-sessions');
        if (ignore) return;
        console.log(`[Dashboard] Received ${data.length} sessions`);
        setSessions(Array.isArray(data) ? data : []);
        
        console.log('[Dashboard] Fetching stats...');
        const { data: s } = await api.get('/me/stats');
        console.log('[Dashboard] Received stats:', s);
        if (!ignore) setStats(s);
      } catch (err) {
        console.error('[Dashboard] Fetch failed:', err);
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
  const resolvedSessionsDone = Math.max(Number(stats?.sessionsDone || 0), sessionsCount);
  const resolvedExercisesDone = Math.max(Number(stats?.exercisesDone || 0), Number(currentUser?.exercisesDone || 0));
  const getClarityScore = (session) => Number(session?.metrics?.clarityScore || 0);
  const clarityAvg = useMemo(() => {
    const last10 = sessions.slice(0, 10);
    if (last10.length === 0) return 0;
    const sum = last10.reduce((acc, s) => acc + getClarityScore(s), 0);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Hello, {currentUser.name.split(' ')[0]}!</h1>
            <p className="text-slate-400 text-lg">Your journey to confident speaking continues today.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to="/practice" className="bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-2xl font-bold transition flex items-center gap-2 shadow-xl shadow-primary/20 group">
              <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
              New Practice Session
            </Link>
          </motion.div>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Daily Streak', value: `${currentUser.streak} Days`, icon: Flame, color: 'text-orange-400', sub: 'Activity rank' },
            { label: 'Total XP', value: currentUser.xp, icon: Award, color: 'text-amber-400', progress: Math.min(100, (currentUser.xp % 100) || 10) },
            { label: 'Sessions', value: resolvedSessionsDone, icon: BarChart3, color: 'text-blue-400', sub: 'Across all topics' },
            { label: 'Exercises', value: resolvedExercisesDone, icon: Activity, color: 'text-green-400', sub: 'Skills mastered' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">{stat.label}</span>
                  <div className={`w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                {stat.progress ? (
                   <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${stat.progress}%` }}
                       className="h-full bg-amber-400" 
                      />
                   </div>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">{stat.sub}</span>
                )}
              </motion.div>
            );
          })}
        </div>


        {/* Single-page compact content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="glass-card p-8">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white">Speech Clarity Trend</h3>
                  <p className="text-sm text-slate-500 mt-1">Track your progress over the last 10 sessions.</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
                  <span className="text-xs font-bold text-primary uppercase">Average: </span>
                  <span className="text-lg font-bold text-white">{clarityAvg}%</span>
                </div>
              </div>
              {sessions.length === 0 ? (
                <div className="h-48 w-full rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <BarChart3 className="w-8 h-8 opacity-20" />
                  <p className="text-sm font-medium">Complete your first session to see analytics</p>
                </div>
              ) : (
                <div className="h-48 w-full">
                  {/* ... chart rendering same as before but inside better card ... */}
                  {(() => {
                    const data = sessions.slice(0, 10).reverse().map((s) => getClarityScore(s));
                    const w = 800;
                    const h = 200;
                    const pad = 20;
                    const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
                    const minV = 0;
                    const maxV = 100;
                    const toY = (v) => pad + (h - pad * 2) * (1 - (v - minV) / (maxV - minV));
                    const pts = data.map((v, i) => `${pad + i * stepX},${toY(v)}`).join(' ');
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(249,115,22,0.2)" />
                            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
                          </linearGradient>
                        </defs>
                        <path d={`M ${pad},${h} ${pts} L ${pad + (data.length - 1) * stepX},${h} Z`} fill="url(#areaGrad)" />
                        <motion.polyline 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          points={pts} 
                          fill="none" 
                          stroke="#f97316" 
                          strokeWidth="4" 
                          strokeLinejoin="round" 
                          strokeLinecap="round" 
                        />
                        {data.map((v, i) => (
                          <motion.circle 
                            key={i} 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8 + i * 0.05 }}
                            cx={pad + i * stepX} cy={toY(v)} r="6" fill="#f97316" stroke="#0f172a" strokeWidth="2" 
                          />
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
          </motion.div>

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

           {/* Recent Sessions */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-6">Recent History</h3>
              {loadingSessions && (
                <div className="flex flex-col gap-4">
                   {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
                </div>
              )}
              {!loadingSessions && recent.length === 0 && (
                <div className="text-sm text-slate-500 bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
                  You haven't practiced yet. <Link to="/practice" className="text-primary font-bold hover:underline">Start today!</Link>
                </div>
              )}
              <div className="space-y-4">
                {!loadingSessions && recent.map((sess) => {
                  const score = getClarityScore(sess);
                  return (
                    <motion.div 
                      whileHover={{ x: 5 }}
                      key={sess.id} 
                      className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                            <BarChart3 className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-white font-bold">{sess.topic || 'General Practice'}</div>
                            <div className="text-xs text-secondary-text text-slate-500">{new Date(sess.createdAt).toLocaleDateString()}</div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-primary font-black">{score}%</div>
                        <div className="text-[10px] text-slate-600 uppercase font-black">Clarity</div>
                      </div>
                    </motion.div>
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
