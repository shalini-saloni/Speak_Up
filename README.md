# SpeakUp

SpeakUp is a premium, AI-powered platform designed to help individuals overcome public speaking anxiety and build lasting confidence. Through interactive practice sessions, guided drills, and community support, SpeakUp provides a structured path from stage fright to stage presence.

## Features

- **AI-Guided Practice**: Real-time speech-to-text sessions with personalized feedback on clarity, pacing, and filler word usage (powered by Google Gemini).
- **Cinematic Exercise Library**: A rich collection of breathing techniques, vocal warm-ups, and body language drills, each featuring high-quality visual artwork and immersive interactions.
- **Immersive Experience**: Modern, glassmorphism UI with cinematic video backgrounds and smooth Framer Motion animations.
- **Progress Tracking**: A personal dashboard with a practice heat-map, streak tracking, and XP-based gamification to keep you motivated.
- **Community Forum**: A space to share wins, participate in weekly challenges, and find accountability partners.

## Tech Stack

### Frontend
- **React 19** with **Vite**
- **Tailwind CSS** for premium styling
- **Framer Motion** for fluid animations
- **Lucide React** for professional iconography

### Backend
- **Node.js** & **Express**
- **Sequelize ORM** with **SQLite** for reliable data persistence
- **Google GenAI (Gemini)** for intelligent speech analysis

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Speak_Up
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   # Add your GEMINI_API_KEY and JWT_SECRET to .env
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## Recent Enhancements
- **Robust Data Saving**: Implemented a fail-safe backend mechanism that ensures practice sessions are always persisted, even if AI analysis fails.
- **Visual Overhaul**: Expanded the Exercise Library with a 2-column cinematic layout and personalized backgrounds for every technique.
- **Cinematic Practice**: Added high-definition video backgrounds to the practice stage for a more focused and professional atmosphere.
- **Branding Consistency**: Standardized primary color usage (Orange) and logo aesthetics across the entire platform.

---
*Built for anyone who has a story to tell but is looking for the confidence to say it.*