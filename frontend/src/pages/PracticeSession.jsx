import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mic, Square, RotateCcw, Activity, CheckCircle, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { api } from '../lib/api';

export default function PracticeSession() {
  const { currentUser, refreshMe } = useAuth();

  const [stage, setStage] = useState('topics'); // topics | qa | analyzing | results
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [coachQuestion, setCoachQuestion] = useState('');
  const [turnCount, setTurnCount] = useState(0);

  const [recordingState, setRecordingState] = useState('idle'); // idle | recording
  const [timer, setTimer] = useState(0);
  const [waveHeights, setWaveHeights] = useState(() => Array.from({ length: 30 }, () => 20));
  const [transcript, setTranscript] = useState('');
  const [partial, setPartial] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  const canSpeechRec = useMemo(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    return Boolean(SR);
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    let interval;
    if (recordingState === 'recording') interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [recordingState]);

  useEffect(() => {
    let ignore = false;
    async function loadTopics() {
      try {
        const { data } = await api.get('/practice-topics');
        if (!ignore) {
          const parsed = Array.isArray(data) ? data : [];
          setTopics(parsed);
          setCurrentTopicIndex(0);
        }
      } catch {
        if (!ignore) setTopics([]);
      }
    }
    loadTopics();
    return () => { ignore = true; };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startSpeechRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText).trim());
      setPartial(interim.trim());
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch { /* ignore */ }
  };

  const stopSpeechRecognition = () => {
    try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setPartial('');
  };

  const beginTopic = async (topicId) => {
    setError('');
    setIsAdvancing(false);
    setSelectedTopic(topicId);
    const { data } = await api.post('/conversations', { topicId });
    setConversationId(data.conversationId);
    setCoachQuestion(data.question);
    setTurnCount(0);
    setStage('qa');
  };

  const startAnswer = async () => {
    setError('');
    setTimer(0);
    setWaveHeights(Array.from({ length: 30 }, () => Math.max(20, Math.floor(Math.random() * 100))));
    setTranscript('');
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      // timeslice ensures some dataavailable events before stop
      mr.start(250);
    } catch {
      // ignore
    }

    startSpeechRecognition();
    setRecordingState('recording');
  };

  const stopAndNext = async () => {
    setIsAdvancing(true);
    
    // Form final transcript text including any interim results
    const finalized = transcriptRef.current.trim();
    const interim = partial.trim();
    const fullText = (finalized + (interim ? " " + interim : "")).trim();
    
    stopSpeechRecognition();
    const mr = mediaRecorderRef.current;

    if (mr && mr.state !== 'inactive') {
      await new Promise((resolve) => {
        mr.addEventListener('stop', resolve, { once: true });
        try { mr.stop(); } catch { resolve(); }
      });
    }
    mediaRecorderRef.current = null;
    setRecordingState('idle');
    setError('');

    try {
      let full = fullText;

      // Audio transcription fallback
      if (!full) {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' });
          if (blob.size > 0) {
            // Prevent huge base64 JSON payloads (can trigger 413)
            if (blob.size > 4_000_000) {
              setError('Your answer audio is too large to upload. Please keep answers shorter (15–30s) and try again.');
              return;
            }
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
            const audioBase64 = btoa(binary);

            const { data: tx } = await api.post('/ai/transcribe', {
              audioBase64,
              mimeType: blob.type || 'audio/webm',
            });
            full = String(tx?.transcript || '').trim();
            if (full) {
              setTranscript(full);
              transcriptRef.current = full;
            }
          }
        }
      }

      if (!full) {
        setError('No speech detected. Please try speaking clearly into the microphone.');
        setIsAdvancing(false);
        return;
      }

      const { data: next } = await api.post(`/conversations/${conversationId}/turns`, {
        text: full,
        durationSeconds: timer || 1,
      });

      setCoachQuestion(next.question);
      setTurnCount(next.turnCount);
      setTranscript('');
      setPartial('');
      transcriptRef.current = '';
      chunksRef.current = [];

      if (next.turnCount >= 3) {
        await finishConversation();
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 503) {
        setError('Gemini is currently overloaded (503). Please wait 10–30 seconds and try again.');
      } else {
        setError(err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const finishConversation = async () => {
    if (!conversationId) return;
    setError('');
    setStage('analyzing');
    try {
      const { data: done } = await api.post(`/conversations/${conversationId}/finish`);
      setFeedback(done.feedback);
      setStage('results');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 503) {
        setError('Gemini is currently overloaded (503). Please wait 10–30 seconds and retry feedback.');
      } else {
        setError(err?.response?.data?.error || err?.message || 'Failed to generate feedback.');
      }
      setStage('qa');
    }
  };

  const resetAll = () => {
    setStage('topics');
    setTopics((t) => t);
    setSelectedTopic(null);
    setConversationId(null);
    setCoachQuestion('');
    setTurnCount(0);
    setRecordingState('idle');
    setTimer(0);
    setTranscript('');
    setPartial('');
    transcriptRef.current = '';
    chunksRef.current = [];
    setFeedback(null);
    setError('');
    setSaving(false);
    setSaved(false);
    setCurrentTopicIndex(0);
    setIsAdvancing(false);
  };

  const handleDragEnd = (event, info, topicId) => {
    if (info.offset.x < -100) {
      // Slide left to "discard" or move to next
      setCurrentTopicIndex((prev) => (prev + 1) % topics.length);
    } else if (info.offset.x > 100) {
      // Slide right to "discard" or move to previous
      setCurrentTopicIndex((prev) => (prev - 1 + topics.length) % topics.length);
    }
  };


  const metrics = feedback?.metrics || {};
  const tips = Array.isArray(feedback?.tips) ? feedback.tips : [];
  const clarityScore = Number(metrics.clarityScore || 0);
  const clarityDashOffset = 175 - Math.round((Math.max(0, Math.min(100, clarityScore)) / 100) * 175);
  const currentTopic = topics[currentTopicIndex] || null;

  if (!currentUser) return <div className="p-8 text-center text-white pt-24 min-h-screen">Please login.</div>;

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video 
          key="bg-video"
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover opacity-60 scale-105"
        >
          <source src="/assets/english_practice.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-950/20" />
      </div>

      <div className="max-w-5xl w-full mx-auto space-y-8 relative z-10">
        <div className="text-center">
          {!canSpeechRec && (
            <p className="text-sm text-slate-400 mt-2">
              Live speech-to-text may not work in this browser. Audio transcription fallback is enabled.
            </p>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {stage === 'topics' && (

          <div className="relative pt-8 pb-20">
            <div className="text-center mb-12">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold text-primary mt-4"
              >
                Choose a Topic
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 mt-4 max-w-lg mx-auto"
              >
                Swipe left to browse, or click "Practice Now" to begin your 3-prompt AI feedback session.
              </motion.p>
            </div>

            <div className="relative perspective-lg flex justify-center items-center h-[400px]">
              <AnimatePresence mode="popLayout">
                {topics.length > 0 && [0, 1, 2].map((i) => {
                  const idx = (currentTopicIndex + i) % topics.length;
                  const topic = topics[idx];
                  if (!topic) return null;
                  
                  const isTop = i === 0;

                  return (
                    <motion.div
                      key={topic.id}
                      style={{ 
                        zIndex: topics.length - i,
                        transformOrigin: "top center"
                      }}
                      drag={isTop ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(e, info) => isTop && handleDragEnd(e, info, topic.id)}
                      initial={{ scale: 0.8, y: 50, opacity: 0 }}
                      animate={{ 
                        scale: 1 - i * 0.06, 
                        y: i * 16, 
                        opacity: 1 - i * 0.4,
                        filter: i === 0 ? "blur(0px)" : `blur(${i * 1.5}px)`,
                        rotate: 0
                      }}
                      exit={{ x: -600, opacity: 0, rotate: -30, transition: { duration: 0.4 } }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className={`absolute w-full max-w-md glass-card p-10 flex flex-col justify-between h-[460px] cursor-grab active:cursor-grabbing ${isTop ? 'border-primary/40 shadow-2xl' : 'border-white/5 shadow-xl'}`}
                    >
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-6">
                           <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                             <Activity className="w-6 h-6" />
                           </div>
                           <span className="text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                             AI Guided
                           </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-4">{topic.label}</h3>
                        <p className="text-slate-400 text-lg leading-relaxed">
                          Master the art of {topic.label.toLowerCase()} with our advanced AI coach. Get real-time feedback on your clarity, tone, and confidence.
                        </p>
                      </div>
                      
                      <div className="mt-8 flex items-center justify-between">
                        <button
                          onClick={() => beginTopic(topic.id)}
                          className="flex-grow bg-primary hover:bg-primary-light text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          Practice Now
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            <div className="flex justify-center gap-4 mt-12">
               <button 
                 onClick={() => setCurrentTopicIndex((prev) => (prev - 1 + topics.length) % topics.length)}
                 className="p-4 rounded-full glass-panel hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                 <ChevronLeft className="w-6 h-6" />
               </button>
               <button 
                 onClick={() => setCurrentTopicIndex((prev) => (prev + 1) % topics.length)}
                 className="p-4 rounded-full glass-panel hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                 <ChevronRight className="w-6 h-6" />
               </button>
            </div>
          </div>
        )}

        {stage === 'qa' && (

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-10 md:p-12 border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="text-sm text-slate-400 font-medium uppercase tracking-widest">
                  Topic: <span className="text-white">{selectedTopic}</span> • Prompt {turnCount + 1}/3
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={turnCount + (isAdvancing ? '-adv' : '')}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-3xl md:text-4xl font-bold text-white leading-tight min-h-[120px]"
                >
                  {isAdvancing ? (
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-slate-400">Analyzing your response...</span>
                    </div>
                  ) : coachQuestion}
                </motion.div>
              </AnimatePresence>
              <div className="text-sm text-slate-500 italic">Press the record button and share your thoughts.</div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-10">
              {recordingState === 'idle' ? (
                <div className="flex flex-col items-center gap-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startAnswer}
                    disabled={isAdvancing}
                    className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_50px_rgba(249,115,22,0.4)] relative group overflow-hidden disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Mic className="w-12 h-12 relative z-10" />
                  </motion.button>
                  <div className="text-xl font-bold text-white tracking-wide">Record Answer</div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-8">
                  <div className="flex flex-col items-center">
                    <div className="text-6xl font-display font-black text-white tracking-widest mb-4">
                      {formatTime(timer)}
                    </div>
                    <div className="flex items-center gap-1.5 h-16 w-full max-w-sm justify-center">
                      {waveHeights.map((h, i) => (
                        <motion.div 
                          key={i} 
                          animate={{ height: [`${h}%`, `${Math.max(20, Math.min(100, h * (1 + Math.random() * 0.5)))}%`, `${h}%`] }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                          className="w-2 bg-primary rounded-full" 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-full max-w-3xl glass-card bg-black/40 p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-primary uppercase tracking-widest">
                       <Activity className="w-3 h-3" /> Real-time Analysis
                    </div>
                    <div className="text-slate-200 text-lg leading-relaxed min-h-[60px] font-medium">
                      {(transcript || partial) ? (
                        <>
                          <span>{transcript}</span>
                          {partial && <span className="text-slate-400"> {partial}</span>}
                        </>
                      ) : (
                        <motion.span 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-slate-500"
                        >
                          Listening to your voice...
                        </motion.span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopAndNext}
                      disabled={isAdvancing}
                      className="bg-white text-background px-12 py-5 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 shadow-xl disabled:opacity-60"
                    >
                      {isAdvancing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Square className="w-5 h-5 fill-current" />
                          Stop & Next
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              <button 
                onClick={resetAll} 
                className="text-sm font-medium text-slate-500 hover:text-white underline underline-offset-4 transition"
              >
                Quit Session
              </button>

              {turnCount >= 3 && recordingState === 'idle' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={finishConversation}
                  className="bg-primary hover:bg-primary-light text-white px-10 py-4 rounded-2xl font-bold transition shadow-2xl shadow-primary/30"
                >
                  Generate AI Feedback
                </motion.button>
              )}
            </div>
          </motion.div>
        )}


        {stage === 'analyzing' && (
          <div className="glass-panel p-12 flex flex-col items-center justify-center min-h-[280px] border border-white/5">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
            <h3 className="text-2xl font-bold text-white mt-6">Generating your feedback…</h3>
            <p className="text-slate-400 mt-2 text-center">We’re analyzing your full conversation.</p>
          </div>
        )}

        {stage === 'results' && (
          <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
            <div className="flex justify-between items-center bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
              <div>
                <h3 className="text-green-400 font-bold mb-1 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Feedback Ready
                </h3>
                <p className="text-sm text-slate-300">Scores and improvement points from the full conversation.</p>
              </div>
              <button onClick={resetAll} className="bg-surface hover:bg-white/10 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> New Topic
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6 flex flex-col items-center text-center gap-3 md:col-span-1">
                <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center text-2xl font-bold text-white relative">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-800" />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="28"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="4"
                      strokeDasharray="175"
                      strokeDashoffset={clarityDashOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  {clarityScore}
                </div>
                <h4 className="font-bold text-white">Clarity</h4>
                <p className="text-xs text-slate-400">0–100</p>
              </div>

              <div className="glass-panel p-6 flex flex-col items-center text-center gap-3 md:col-span-1">
                <div className="w-16 h-16 rounded-full border-4 border-yellow-500 flex items-center justify-center text-2xl font-bold text-white">
                  {metrics.wpm || 0}
                </div>
                <h4 className="font-bold text-white">WPM</h4>
                <p className="text-xs text-slate-400">Pace</p>
              </div>

              <div className="glass-panel p-6 flex flex-col items-center text-center gap-3 md:col-span-1">
                <div className="w-16 h-16 rounded-full border-4 border-orange-500 flex items-center justify-center text-2xl font-bold text-white">
                  {metrics.fillerWordsCount ?? 0}
                </div>
                <h4 className="font-bold text-white">Fillers</h4>
                <p className="text-xs text-slate-400">Count</p>
              </div>

              <div className="glass-panel p-6 flex flex-col items-center text-center gap-3 md:col-span-1">
                <div className="w-16 h-16 rounded-full border-4 border-accent flex items-center justify-center text-2xl font-bold text-white">
                  {metrics.confidenceScore ?? 0}
                </div>
                <h4 className="font-bold text-white">Confidence</h4>
                <p className="text-xs text-slate-400">0–100</p>
              </div>
            </div>

            <div className="glass-panel p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Improvement points
              </h3>
              <ul className="space-y-4">
                {tips.map((t, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                    <div className="text-slate-200">{t}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6">
              <div>
                <div className="font-bold text-white">Save complete</div>
                <div className="text-sm text-slate-400">Your conversation + feedback is stored. XP/streak updated automatically.</div>
              </div>
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    await refreshMe();
                    setSaved(true);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || saved}
                className={`px-6 py-3 rounded-xl font-bold transition ${saving || saved ? 'bg-surface text-slate-500 cursor-not-allowed' : 'bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20'}`}
              >
                {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
