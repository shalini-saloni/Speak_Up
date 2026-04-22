import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Heart, Share2, Search, Pin, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForumFeed() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Trending');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/forum/posts');
        if (ignore) return;
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (ignore) return;
        setError(err?.response?.data?.error || 'Failed to load forum');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const pinned = useMemo(() => posts.find((p) => p.isPinned) || null, [posts]);
  const normalPosts = useMemo(() => posts.filter((p) => !p.isPinned), [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = normalPosts;
    if (activeTab === 'New') list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (activeTab === 'Trending') list = [...list].sort((a, b) => Number(b.upvotes || 0) - Number(a.upvotes || 0));
    if (activeTab === 'Challenges') list = list.filter((p) => (p.tags || []).some((t) => String(t).toLowerCase().includes('challenge')));
    if (activeTab === 'Wins') list = list.filter((p) => (p.tags || []).some((t) => String(t).toLowerCase().includes('win')));
    if (activeTab === 'Questions') list = list.filter((p) => (p.tags || []).some((t) => String(t).toLowerCase().includes('question')));
    if (!q) return list;
    return list.filter((p) => (p.title || '').toLowerCase().includes(q) || (p.body || '').toLowerCase().includes(q));
  }, [activeTab, normalPosts, query]);

  const handleCreate = async () => {
    setSubmitting(true);
    setError('');
    try {
      const tags = activeTab === 'Wins' ? ['Win'] : activeTab === 'Questions' ? ['Question'] : [];
      const { data } = await api.post('/forum/posts', { title: newTitle, body: newBody, tags });
      setPosts((prev) => [data, ...prev]);
      setNewTitle('');
      setNewBody('');
      setShowComposer(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Community Forum</h1>
            <p className="text-slate-400 text-lg">Connect, share experiences, and learn from fellow speakers.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (currentUser ? setShowComposer(true) : window.location.assign('/login'))}
            className="bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-2xl font-bold transition shadow-xl shadow-primary/20 whitespace-nowrap flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Discussion
          </motion.button>
        </div>


        {!currentUser && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-200">
            <span className="font-bold text-white">Read the community for free.</span>{' '}
            <span className="text-slate-400">Log in to create posts and comment.</span>
            <div className="mt-3">
              <Link to="/login" className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white text-background font-bold hover:bg-slate-200 transition">
                Log in
              </Link>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showComposer && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-8 border border-primary/20 bg-primary/5"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-xl font-bold text-white">Share your thoughts</div>
                <button onClick={() => setShowComposer(false)} className="text-slate-500 hover:text-white transition">Cancel</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition"
                  placeholder="What's on your mind?"
                />
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full min-h-[160px] bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition resize-none"
                  placeholder="Go into detail..."
                />
                <div className="flex justify-end pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    disabled={submitting || !newTitle.trim() || !newBody.trim()}
                    className={`px-10 py-4 rounded-2xl font-bold transition shadow-xl ${submitting || !newTitle.trim() || !newBody.trim() ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-primary text-white shadow-primary/20'}`}
                  >
                    {submitting ? 'Posting...' : 'Post Discussion'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        {/* Search and Filters */}
        <div className="glass-card flex flex-col md:flex-row gap-6 justify-between items-center p-6 border border-white/5">
           <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {['Trending', 'New', 'Challenges', 'Wins', 'Questions'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  {tab}
                </button>
              ))}
           </div>
           
           <div className="relative w-full md:w-80">
             <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               type="text" 
               placeholder="Search discussions..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
               className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-slate-500"
             />
           </div>
        </div>


        {/* Feed */}
        <div className="space-y-6">
           
           {/* Pinned Post */}
           {pinned && (
           <Link to={`/forum/${pinned.id || pinned._id}`} className="block relative overflow-hidden bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 hover:bg-primary/10 transition group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-3 mb-4">
                 <Pin className="w-4 h-4 text-primary fill-current" />
                 <span className="text-xs font-bold text-primary uppercase">Pinned by Admin</span>
              </div>
              <div className="flex items-start gap-4 z-10 relative">
                 <div className="w-10 h-10 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary font-bold">
                   {String(pinned?.User?.name || 'A').slice(0, 1).toUpperCase()}
                 </div>
                 <div className="flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition">{pinned.title}</h3>
                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">{pinned.body}</p>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                       <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {pinned.upvotes}</span>
                       <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> </span>
                       <span>{new Date(pinned.createdAt).toLocaleString()}</span>
                       <div className="flex gap-2">
                         {(pinned.tags || []).map(tag => (
                           <span key={tag} className="bg-white/10 text-xs px-2 py-1 rounded-md">{tag}</span>
                         ))}
                       </div>
                    </div>
                 </div>
              </div>
           </Link>
           )}

           {/* Normal Posts */}
           <AnimatePresence mode="popLayout">
             {(loading ? Array.from({ length: 3 }) : filtered).map((post, idx) => (
               loading ? (
                 <div key={idx} className="glass-card p-8 animate-pulse h-48">
                   <div className="flex gap-4">
                     <div className="w-12 h-12 rounded-full bg-white/5" />
                     <div className="flex-grow space-y-3">
                       <div className="h-5 w-1/3 bg-white/5 rounded" />
                       <div className="h-4 w-full bg-white/5 rounded" />
                       <div className="h-4 w-4/5 bg-white/5 rounded" />
                     </div>
                   </div>
                 </div>
               ) : (
                <motion.div
                  layout
                  key={post.id || post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link 
                    to={`/forum/${post.id || post._id}`} 
                    className="block glass-card glass-panel-hover p-8 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start gap-5 relative z-10">
                      <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-primary font-bold shadow-inner">
                        {String(post?.User?.name || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-white text-lg">{post?.User?.name || 'User'}</span>
                            <span className="text-xs font-medium text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors leading-tight">{post.title}</h3>
                        <p className="text-slate-400 leading-relaxed mb-6 line-clamp-2 text-lg">{post.body}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
                              <span className="flex items-center gap-2 hover:text-red-400 transition-colors"><Heart className="w-5 h-5" /> {post.upvotes}</span>
                              <span className="flex items-center gap-2 hover:text-primary transition-colors"><MessageSquare className="w-5 h-5" /></span>
                              <span className="flex items-center gap-2 hover:text-blue-400 transition-colors"><Share2 className="w-5 h-5" /></span>
                          </div>
                          <div className="flex gap-2">
                            {(post.tags || []).map(tag => (
                              <span key={tag} className="bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-slate-400">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
               )
             ))}
           </AnimatePresence>

           
        </div>

      </div>
    </div>
  );
}
