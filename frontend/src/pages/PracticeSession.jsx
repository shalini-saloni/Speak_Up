import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/authContext';
import { Mic, Square, RotateCcw, Activity, CheckCircle } from 'lucide-react';
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
        if (!ignore) setTopics(Array.isArray(data) ? data : []);
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
      let full = transcriptRef.current.trim();

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
        setError('No transcript captured. Please allow microphone access and try again (Chrome works best).');
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
  };

  const metrics = feedback?.metrics || {};
  const tips = Array.isArray(feedback?.tips) ? feedback.tips : [];
  const clarityScore = Number(metrics.clarityScore || 0);
  const clarityDashOffset = 175 - Math.round((Math.max(0, Math.min(100, clarityScore)) / 100) * 175);

  if (!currentUser) return <div className="p-8 text-center text-white pt-24 min-h-screen">Please login.</div>;

  return (
    <div className="w-full flex-grow flex flex-col p-6 md:p-12 text-slate-200 relative overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-accent/20 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-primary/15 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Practice Session</h1>
          <p className="text-slate-300">Pick a topic, answer 3 prompts by speaking, then get feedback at the end.</p>
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
          <div className="glass-panel p-10 md:p-12 border border-white/5">
            <div className="text-center">
              <div className="text-xs tracking-[0.25em] text-primary-light font-semibold">PICK A TOPIC TO SPEAK ON</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">Choose your theme</h2>
              <p className="text-slate-300 mt-2">You’ll answer 3 spoken prompts. Feedback is generated at the end.</p>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => beginTopic(t.id)}
                  className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition"
                >
                  <div className="text-lg font-bold text-white">{t.label}</div>
                  <div className="text-sm text-slate-400 mt-1">Speaking prompts • 3 rounds</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'qa' && (
          <div className="glass-panel p-10 md:p-12 border border-white/5">
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-400 uppercase tracking-wide">
                Topic: <span className="text-slate-200 font-semibold">{selectedTopic}</span> • Prompt {turnCount + 1}/3
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">{coachQuestion}</div>
              <div className="text-sm text-slate-400">Speak your answer, then press “Stop & Next”.</div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-8">
              {recordingState === 'idle' ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-surface border border-white/10 flex items-center justify-center text-slate-500 shadow-inner">
                    <Mic className="w-10 h-10" />
                  </div>
                  <button
                    onClick={startAnswer}
                    className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-full font-bold text-lg transition flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
                    Start Speaking
                  </button>
                </>
              ) : (
                <>
                  <div className="text-5xl font-mono font-bold text-white tracking-widest">{formatTime(timer)}</div>
                  <div className="flex items-center gap-1 h-12">
                    {waveHeights.map((h, i) => (
                      <div key={i} className="w-1.5 bg-red-500 rounded-full" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="w-full max-w-3xl bg-black/20 border border-white/10 rounded-2xl p-4">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Live transcript</div>
                    <div className="text-slate-200 text-sm leading-relaxed min-h-[48px]">
                      {(transcript || partial) ? (
                        <>
                          <span>{transcript}</span>
                          {partial && <span className="text-slate-400"> {partial}</span>}
                        </>
                      ) : (
                        <span className="text-slate-500">Start speaking…</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={stopAndNext}
                    className="bg-surface hover:bg-white/10 border border-white/10 text-white px-10 py-4 rounded-full font-bold transition flex items-center gap-2"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    Stop & Next
                  </button>
                </>
              )}

              <button onClick={resetAll} className="text-sm text-slate-400 hover:text-white transition">
                Restart & choose another topic
              </button>

              {turnCount >= 3 && recordingState === 'idle' && (
                <button
                  onClick={finishConversation}
                  className="bg-primary hover:bg-primary-light text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-primary/20"
                >
                  Generate feedback
                </button>
              )}
            </div>
          </div>
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
