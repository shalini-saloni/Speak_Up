import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mic, Play, ChevronRight, TrendingUp, Users, CheckCircle, Award, ThumbsUp, MessageSquare } from 'lucide-react';

export default function LandingPage() {
  const Motion = motion;
  return (
    <div className="w-full flex-grow flex flex-col overflow-x-hidden relative bg-background text-slate-200">
      {/* Hero */}
      <main
        className="relative isolate min-h-screen flex flex-col items-center justify-start px-6 pt-20 md:pt-24 pb-10 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/hero3.png')",
          backgroundSize: 'cover',
          backgroundPosition: '100% 50%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Readability overlays */}
        <div className="absolute inset-0 bg-black/20 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-10" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/15 rounded-full blur-[140px] z-10 pointer-events-none" />

        <div className="w-full max-w-7xl relative z-20">
          <div className="max-w-3xl flex flex-col items-start gap-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-medium text-primary-light">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Conquer Your Fear of Public Speaking
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] text-white">
              <span className="block sm:whitespace-nowrap">World’s fastest way to</span>
              <span className="block"><span className="gradient-text">Speak</span> confidently</span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-xl leading-relaxed">
              AI-powered practice sessions, guided confidence drills, and a supportive community to help you overcome public speaking anxiety—step by step.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <Link
                to="/onboarding"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-background px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(249,115,22,0.35)] hover:shadow-[0_0_40px_rgba(249,115,22,0.55)] hover:-translate-y-1"
              >
                Take the Fear Quiz
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-8 py-4 rounded-full font-bold text-lg transition backdrop-blur"
              >
                <Play className="w-5 h-5" />
                See it in action
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-10 w-full max-w-lg">
              {[
                { k: '200+', v: 'Confidence wins' },
                { k: '4M+', v: 'Practice minutes' },
                { k: '4.8★', v: 'User rating' },
              ].map((s) => (
                <div key={s.k} className="glass-panel px-4 py-3">
                  <div className="text-2xl font-extrabold text-white leading-none">{s.k}</div>
                  <div className="text-xs text-slate-200/70 mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Trusted / story */}
      <section id="about" className="w-full py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-slate-300 mb-10">
            <div className="text-sm tracking-[0.25em] text-primary-light font-semibold">TRUSTED WORLDWIDE</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { k: '200+', v: 'Countries worldwide' },
              { k: '4M+', v: 'Practice minutes' },
              { k: '4.8★', v: 'Average rating' },
            ].map((s) => (
              <div key={s.k} className="glass-panel p-6 text-center">
                <div className="text-4xl font-extrabold text-white">{s.k}</div>
                <div className="text-sm text-slate-400 mt-2">{s.v}</div>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto text-center text-slate-300 leading-relaxed">
            For many people, public speaking confidence is a hidden social currency. Coaching can be expensive, and passive content doesn’t build real skill.
            With SpeakUp, you get a personal practice system: speak more, get feedback faster, and improve with daily drills and community accountability.
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="programs" className="w-full py-24 px-6 md:px-12 bg-surface/50 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm tracking-[0.25em] text-primary-light font-semibold mb-3">AI POWERED</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Practice enables you to speak more than ever</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 flex flex-col gap-4 group hover:border-primary/50 transition duration-300">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-2">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Filler words & pace</h3>
              <p className="text-slate-400">
                See filler word counts (“um”, “uh”, “like”) and estimated pacing (words per minute) so you can speak more clearly.
              </p>
            </div>
            
            <div className="glass-panel p-8 flex flex-col gap-4 group hover:border-accent/50 transition duration-300">
              <div className="w-12 h-12 bg-accent/20 text-accent rounded-xl flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Clarity & structure</h3>
              <p className="text-slate-400">
                Get a clarity/structure score plus focused guidance on making your message easier to follow.
              </p>
            </div>
            
            <div className="glass-panel p-8 flex flex-col gap-4 group hover:border-green-500/50 transition duration-300">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">3 actionable tips</h3>
              <p className="text-slate-400">
                Every session ends with a short list of concrete fixes you can apply immediately in your next recording.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-background font-bold hover:bg-slate-200 transition"
            >
              Start practicing
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href="/#exercises"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition font-semibold text-slate-200"
            >
              Explore exercises
            </a>
          </div>
        </div>
      </section>

      {/* Guided Exercises & Community */}
      <section id="exercises" className="w-full py-24 px-6 md:px-12 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl md:text-5xl font-bold">Guided Exercises & Calming Drills</h2>
            <p className="text-lg text-slate-400">
              Anxiety starts before you speak. Build confidence with breathing, vocal warm-ups, visualization, body language drills, and tongue twisters—organized by difficulty.
            </p>
            <ul className="space-y-4 mt-4">
              {['Breathing timers (box breathing & more)', 'Vocal warm-ups, tongue twisters, and posture cues', 'Daily recommendations based on your onboarding level'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link
                to="/exercises"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold transition"
              >
                Browse the library
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          <div id="community" className="glass-panel p-8 flex flex-col gap-6 bg-slate-900/80 scroll-mt-24">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
               <Users className="w-6 h-6 text-accent" />
               Community Forum
            </h3>
            <p className="text-slate-400">
               Share wins, ask questions, and join accountability challenges. You’re not doing this alone.
            </p>
            <div className="bg-surface rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-sm">Weekly Challenge Pinned</span>
                    <span className="text-xs text-primary px-2 py-1 bg-primary/10 rounded">Admin</span>
                </div>
                <p className="text-sm text-slate-300">“Record a 30-second introduction of yourself and share your biggest win this week.”</p>
                <div className="mt-3 flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> 124 Upvotes</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 45 Replies</span>
                </div>
            </div>
            <Link
              to="/forum"
              className="mt-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm font-semibold border border-white/10 text-center"
            >
              Explore the forum
            </Link>
          </div>
          
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="w-full py-24 px-6 md:px-12 bg-surface/50 border-y border-white/5 scroll-mt-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm tracking-[0.25em] text-primary-light font-semibold mb-3">TESTIMONIALS</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What our users say about us</h2>
            <p className="text-slate-400 text-lg">
              Confidence grows when you practice consistently and get feedback you can act on.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                q: '“The fear quiz helped me pick a realistic starting point. I finally stuck to a daily routine.”',
                a: 'Beginner → 14-day streak',
              },
              {
                q: '“Seeing my filler words drop session by session was motivating. The tips were specific.”',
                a: 'Practice Sessions',
              },
              {
                q: '“Posting in the forum made it feel normal to be nervous. Weekly challenges kept me accountable.”',
                a: 'Community',
              },
            ].map((t) => (
              <div key={t.q} className="glass-panel p-7">
                <div className="text-slate-200 leading-relaxed">{t.q}</div>
                <div className="text-xs text-slate-400 mt-4 font-semibold">{t.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA like reference */}
      <section id="contact" className="w-full py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="glass-panel p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[680px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Let’s get your personalized journey started</h2>
              <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
                Why wait for a speaking partner? It takes just 10 minutes a day to build calm, clarity, and confidence.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/signup"
                  className="bg-white text-background px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-200 transition shadow-[0_0_20px_rgba(255,255,255,0.35)]"
                >
                  Let’s begin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gamification footer CTA */}
      <section className="w-full py-20 px-6 bg-gradient-to-t from-primary/20 to-transparent text-center border-t border-white/5 relative overflow-hidden">
         <div className="max-w-3xl mx-auto flex flex-col items-center gap-8 relative z-10">
            <Award className="w-16 h-16 text-yellow-400 mb-2" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">Gamify Your Progress</h2>
            <p className="text-lg text-slate-400">
              Earn XP points per activity. Maintain a daily practice streak, unlock achievement badges, and level up your speaking confidence step by step.
            </p>
            <Link
              to="/signup"
              className="bg-white text-background px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-200 transition shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] mt-4"
            >
              Start your speaking journey
            </Link>
         </div>
      </section>
      
    </div>
  );
}
