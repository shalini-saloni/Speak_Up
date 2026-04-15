import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import { Flame, Star, Activity, User, LogOut, Award, Pencil } from 'lucide-react';
import { api } from '../lib/api';

export default function Profile() {
  const { currentUser, logout, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [stats, setStats] = useState({ sessionsDone: 0, exercisesDone: 0 });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoadingSessions(true);
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
    if (currentUser) load();
    return () => { ignore = true; };
  }, [currentUser]);

  const last7Scores = useMemo(() => {
    const arr = sessions.slice(0, 7).reverse();
    return arr.map((s) => Number(s?.metrics?.clarityScore || 0));
  }, [sessions]);

  if (!currentUser) return <div className="p-8 text-center pt-24 min-h-screen">Please login.</div>;

  const joined = currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '';
  const rank = currentUser.xp >= 2000 ? 'Advanced' : currentUser.xp >= 800 ? 'Intermediate' : 'Beginner';

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200 relative overflow-hidden">
      <div className="absolute -top-52 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/15 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[620px] h-[620px] bg-accent/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="max-w-5xl w-full mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="glass-panel p-8 relative overflow-hidden flex flex-col lg:flex-row items-center lg:items-start gap-8">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
           
           <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-primary/60 overflow-hidden shadow-2xl relative z-10 bg-black flex items-center justify-center text-slate-500">
                 {avatarPreview || currentUser.avatarUrl ? (
                   <img src={avatarPreview || currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                 ) : currentUser.avatarSvg ? (
                   <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: currentUser.avatarSvg }} />
                 ) : (
                   <User className="w-16 h-16" />
                 )}
              </div>
              <label
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary hover:bg-primary-light text-background rounded-full flex items-center justify-center shadow-lg shadow-primary/25 transition z-20 cursor-pointer"
                title="Upload profile photo"
              >
                <Pencil className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    if (file.size > 1_500_000) {
                      setAvatarError('Image too large. Please upload an image under 1.5MB.');
                      return;
                    }
                    setAvatarError('');
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const dataUrl = String(reader.result || '');
                        setAvatarPreview(dataUrl);
                        await api.patch('/me', { avatarUrl: dataUrl });
                        await refreshMe();
                        setAvatarPreview('');
                      } catch (err) {
                        setAvatarPreview('');
                        setAvatarError(err?.response?.data?.error || 'Failed to upload image');
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
           </div>
           
           <div className="flex-grow flex flex-col items-center sm:items-start gap-4 z-10 text-center sm:text-left">
              <div>
                 <h1 className="text-4xl font-bold text-white tracking-tight">{currentUser.name}</h1>
                 <div className="text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                   <span className="text-sm">@{String(currentUser.email || '').split('@')[0] || 'user'}</span>
                   <span className="text-sm">User Rank: <span className="text-primary font-bold">{rank}</span></span>
                   {joined ? <span className="text-sm">Joined: {joined}</span> : null}
                 </div>
              </div>
              {avatarError && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                  {avatarError}
                </div>
              )}
           </div>
           
           <div className="flex flex-col items-stretch gap-3 z-10 w-full lg:w-auto lg:min-w-[440px]">
             <div className="grid grid-cols-3 gap-4">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                 <div className="text-xs text-slate-400 font-bold uppercase">Total XP</div>
                 <div className="text-2xl font-bold text-white mt-2 flex items-center justify-center gap-2"><Award className="w-5 h-5 text-primary" /> {currentUser.xp}</div>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                 <div className="text-xs text-slate-400 font-bold uppercase">Sessions Done</div>
                 <div className="text-2xl font-bold text-white mt-2">{stats.sessionsDone ?? sessions.length}</div>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                 <div className="text-xs text-slate-400 font-bold uppercase">Exercises</div>
                 <div className="text-2xl font-bold text-white mt-2">{stats.exercisesDone ?? 0}</div>
               </div>
             </div>
             <div className="flex justify-end">
               <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition text-sm font-bold">
                 <LogOut className="w-4 h-4" /> Sign Out
               </button>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

           {/* Progress Chart (real) */}
           <div className="glass-panel p-6 flex flex-col">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                 <Activity className="w-5 h-5 text-primary" /> Speech Score Progress
              </h3>
              <div className="flex-grow flex items-end justify-between gap-2 px-2 pb-6 border-b border-white/10 pt-10">
                 {(loadingSessions ? [0,0,0,0,0,0,0] : (last7Scores.length ? last7Scores : [0,0,0,0,0,0,0])).map((h, i) => (
                    <div key={i} className="w-full relative group">
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                         Score: {h}%
                       </div>
                       <div className="bg-gradient-to-t from-primary/50 to-accent w-full rounded-t-sm transition-all duration-1000 ease-out hover:brightness-125" style={{ height: `${h}%` }}></div>
                       <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">W{i+1}</span>
                    </div>
                 ))}
              </div>
              <p className="text-sm text-slate-400 mt-6 text-center">
                This chart is built from your last saved sessions.
              </p>
           </div>

           <div className="glass-panel p-6">
             <h3 className="font-bold text-white mb-2">Recent Activity</h3>
             <p className="text-sm text-slate-400">
               Your latest sessions appear here (real data).
             </p>
             <div className="mt-5 space-y-3">
               {(loadingSessions ? [] : sessions.slice(0, 3)).map((s) => (
                 <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                   <div>
                     <div className="text-white font-bold text-sm">{s.topic || 'Practice session'}</div>
                     <div className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</div>
                   </div>
                   <div className="text-primary font-bold">{Number(s?.metrics?.clarityScore || 0)}%</div>
                 </div>
               ))}
               {!loadingSessions && sessions.length === 0 && (
                 <div className="text-sm text-slate-400 bg-white/5 border border-white/10 rounded-xl p-4">
                   No sessions yet. Complete a Practice session to see activity.
                 </div>
               )}
             </div>
           </div>
           
        </div>

      </div>
    </div>
  );
}
