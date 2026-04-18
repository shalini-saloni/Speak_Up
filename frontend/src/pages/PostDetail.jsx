import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function PostDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/forum/posts/${id}`);
        if (ignore) return;
        setPost(data.post);
        setComments(Array.isArray(data.comments) ? data.comments : []);
      } catch (err) {
        if (ignore) return;
        setError(err?.response?.data?.error || 'Failed to load post');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [id]);

  const submitComment = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post(`/forum/posts/${id}/comments`, { body });
      setComments((prev) => [...prev, data]);
      setBody('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        <div>
          <Link to="/forum" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm transition">
            <ChevronLeft className="w-4 h-4" /> Back to Forum
          </Link>
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="glass-panel p-6 md:p-8">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-6 w-2/3 bg-white/10 rounded" />
              <div className="h-4 w-full bg-white/10 rounded mt-4" />
              <div className="h-4 w-5/6 bg-white/10 rounded mt-2" />
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-400">
                {post?.User?.name || 'User'} • {post?.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">{post?.title}</h1>
              <p className="text-slate-300 mt-4 leading-relaxed whitespace-pre-wrap">{post?.body}</p>
              <div className="flex gap-2 mt-5">
                {(post?.tags || []).map((t) => (
                  <span key={t} className="bg-surface border border-white/10 text-xs px-2 py-1 rounded-md text-slate-200">{t}</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="glass-panel p-6 md:p-8">
          <div className="font-bold text-white mb-4">Comments</div>
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-xs text-slate-400">
                  {c?.User?.name || 'User'} • {c?.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                </div>
                <div className="text-slate-200 mt-2 whitespace-pre-wrap">{c.body}</div>
              </div>
            ))}
            {(!loading && comments.length === 0) && (
              <div className="text-sm text-slate-400">No comments yet. Be the first to reply.</div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-grow bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition"
              placeholder="Write a reply…"
            />
            <button
              onClick={submitComment}
              disabled={!currentUser || submitting || !body.trim()}
              className={`px-5 py-3 rounded-xl font-bold transition flex items-center gap-2 ${submitting || !body.trim() ? 'bg-surface text-slate-500 cursor-not-allowed' : 'bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20'}`}
            >
              Send <Send className="w-4 h-4" />
            </button>
          </div>
          {!currentUser && (
            <div className="mt-3 text-sm text-slate-400">
              <Link className="text-primary hover:underline" to="/login">Log in</Link> to reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
