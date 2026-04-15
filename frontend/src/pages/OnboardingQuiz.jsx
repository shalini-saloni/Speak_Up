import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

export default function OnboardingQuiz() {
  const [step, setStep] = useState(0);
  const [fearLevel, setFearLevel] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.patch('/me', {
        fearLevel:
          fearLevel === 'severe' ? 'beginner' :
          fearLevel === 'moderate' ? 'intermediate' :
          'advanced',
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-grow flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl w-full glass-panel p-8 md:p-12 z-10">
        {step === 0 && (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center text-primary mb-2 shadow-lg shadow-primary/20">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Welcome to SpeakUp</h1>
              <p className="text-lg text-slate-400">
                To personalize your daily exercise plan and AI coaching, we need to understand your current comfort level with public speaking.
              </p>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="bg-white text-background hover:bg-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 mt-4"
            >
              Start Quick Quiz <ChevronRight className="w-5 h-5" />
            </button>
            {!currentUser && (
              <p className="text-sm text-center text-slate-500">
                 Already have an account? <a href="/login" className="text-primary hover:underline">Log in</a>
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-500">
             <button onClick={() => setStep(0)} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm self-start mb-4">
                <ChevronLeft className="w-4 h-4" /> Back
             </button>
             <h2 className="text-3xl font-bold text-white leading-tight">How do you usually feel when asked to speak in front of a group?</h2>
             
             <div className="flex flex-col gap-4 mt-4">
               {[
                 { id: 'severe', label: 'Terrified', desc: 'I avoid it at all costs. My voice shakes.' },
                 { id: 'moderate', label: 'Nervous', desc: 'I do it if I have to, but I rush through it.' },
                 { id: 'mild', label: 'Okay, but could improve', desc: 'I use too many filler words and lack structure.' }
               ].map(opt => (
                 <label 
                   key={opt.id} 
                   className={`flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition ${fearLevel === opt.id ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface hover:bg-white/5 hover:border-white/20'}`}
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${fearLevel === opt.id ? 'border-primary' : 'border-slate-500'}`}>
                        {fearLevel === opt.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                     </div>
                     <span className="text-lg font-bold text-white">{opt.label}</span>
                   </div>
                   <span className="text-slate-400 text-sm mt-2 ml-10">{opt.desc}</span>
                   <input type="radio" name="fear" value={opt.id} className="hidden" onChange={() => setFearLevel(opt.id)} checked={fearLevel === opt.id} />
                 </label>
               ))}
             </div>

             <button 
               onClick={handleComplete}
               disabled={!fearLevel}
              className={`mt-6 px-8 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 ${fearLevel ? 'bg-primary text-background shadow-[0_0_20px_rgba(249,115,22,0.35)]' : 'bg-surface text-slate-500 cursor-not-allowed'}`}
             >
               {submitting ? 'Saving…' : 'Complete Registration'} <Check className="w-5 h-5" />
             </button>

             {error && (
               <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                 {error}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
