import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import { Login, Signup } from './pages/AuthPages';
import OnboardingQuiz from './pages/OnboardingQuiz';
import Dashboard from './pages/Dashboard';
import PracticeSession from './pages/PracticeSession';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ExerciseDetail from './pages/ExerciseDetail';
import ForumFeed from './pages/ForumFeed';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import { useAuth } from './context/AuthContext';

function RequireAuth({ children }) {
  const { currentUser, bootstrapped } = useAuth();
  if (!bootstrapped) {
    return <div className="min-h-screen bg-background text-slate-200 flex items-center justify-center">Loading...</div>;
  }
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { currentUser, bootstrapped } = useAuth();
  if (!bootstrapped) {
    return <div className="min-h-screen bg-background text-slate-200 flex items-center justify-center">Loading...</div>;
  }
  if (currentUser) return <Navigate to="/landing" replace />;
  return children;
}

function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col font-sans text-slate-200">
        {currentUser ? <Navbar /> : null}
        <Routes>
          <Route path="/" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

          <Route path="/landing" element={<RequireAuth><LandingPage /></RequireAuth>} />
          <Route path="/onboarding" element={<RequireAuth><OnboardingQuiz /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/practice" element={<RequireAuth><PracticeSession /></RequireAuth>} />
          <Route path="/exercises" element={<RequireAuth><ExerciseLibrary /></RequireAuth>} />
          <Route path="/exercises/:id" element={<RequireAuth><ExerciseDetail /></RequireAuth>} />
          <Route path="/forum" element={<RequireAuth><ForumFeed /></RequireAuth>} />
          <Route path="/forum/:id" element={<RequireAuth><PostDetail /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPanel /></RequireAuth>} />

          <Route path="*" element={<Navigate to={currentUser ? "/landing" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
