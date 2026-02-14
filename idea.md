# Project Idea — SpeakUp: Conquer Your Fear of Public Speaking

## Overview

**SpeakUp** is a full-stack web application designed to help people overcome glossophobia (fear of public speaking) through a structured, progressive approach. Users get access to AI-powered practice sessions with real-time feedback, a community forum for peer support, and guided breathing and relaxation exercises — all in one platform.

The backend is built with **Node.js + Express**, following clean layered architecture with OOP principles and design patterns. The frontend is built with **React.js**.

---

## Problem Statement

An estimated 75% of people experience some degree of public speaking anxiety. Existing resources are either too passive (watching videos) or too expensive (coaches/therapists). SpeakUp bridges this gap with an affordable, interactive, self-paced platform that combines AI feedback, structured exercises, and community accountability.

---

## Scope

Three core modules drive the platform:

1. **AI Practice Sessions** — Users record themselves giving a speech, and the AI analyzes their delivery and provides structured feedback.
2. **Guided Exercises** — A library of breathing techniques, warm-ups, and confidence drills organized by difficulty level.
3. **Community Forum** — A supportive peer forum where users share experiences, ask questions, celebrate wins, and join accountability groups.

---

## Key Features

### Authentication & User Profiles
- Email/password registration with JWT-based auth (access + refresh tokens)
- User onboarding quiz to assess current fear level (beginner / intermediate / advanced)
- Personal dashboard showing streak, completed sessions, forum activity, and progress score
- Avatar upload and profile bio

### AI Practice Sessions
- Users choose a session type: Free Speech, Structured Topic, or Timed Challenge
- Record audio/video directly in the browser (MediaRecorder API)
- AI analyzes the recording via Anthropic Claude API and returns:
  - Filler word count (um, uh, like…)
  - Estimated pace (words per minute)
  - Clarity and structure score
  - Confidence tone assessment
  - 3 specific, actionable improvement tips
- Session history stored per user with scores over time
- Progress graph showing improvement across sessions

### Guided Exercises
- Exercise library with categories: Breathing, Vocal Warm-ups, Visualization, Body Language, Tongue Twisters
- Each exercise has: title, description, duration, difficulty (Easy / Medium / Hard), and step-by-step instructions
- Built-in timer for timed exercises (e.g., box breathing with animated visual guide)
- Mark exercise as complete; completion tracked per user
- Recommended daily exercise plan auto-generated based on user's fear level from onboarding

### Community Forum
- Create posts with title, body, tags (e.g., "first speech", "anxiety tips", "wins")
- Nested replies / threaded comments
- Upvote posts and comments
- Weekly challenge posts pinned by Admin (e.g., "Record a 30-second intro of yourself")
- User badges earned by milestones (First Session, 7-Day Streak, 10 Forum Posts, etc.)

### Progress & Gamification
- Daily streak tracking (did at least one session or exercise today)
- XP points earned per activity; levels unlocked as XP grows
- Achievement badges displayed on profile
- Weekly progress email summary (via NodeMailer)

### Admin Panel
- Manage users (ban, verify, reset password)
- Pin / unpin weekly challenges
- Review and moderate flagged forum posts
- View platform analytics (DAU, sessions per day, top exercises)

---

## Backend Architecture

- **Pattern**: Controller → Service → Repository (layered)
- **OOP Principles**:
  - *Encapsulation*: All DB logic inside Repository classes; business logic inside Service classes
  - *Abstraction*: `BaseRepository<T>` abstracts CRUD; controllers never touch the ORM
  - *Inheritance*: `VideoSession` and `AudioSession` extend `PracticeSession`
  - *Polymorphism*: `ExerciseTimer` behaves differently per exercise type (breathing vs vocal)
- **Design Patterns**:
  - **Strategy** — AI feedback provider (Claude API today, swappable tomorrow)
  - **Observer** — Badge/achievement system; events trigger badge checks
  - **Factory** — Creates the correct `Exercise` subtype (BreathingExercise, VocalExercise, etc.)
  - **Repository** — Abstracts all DB queries from business logic
  - **Middleware Chain** — Auth guard, role guard, rate limiter, request validator

---

## Frontend 

- Built with **React.js**
- Pages: Landing, Onboarding Quiz, Dashboard, Practice Session, Exercise Library, Exercise Detail, Forum Feed, Post Detail, Profile, Admin Panel
- Responsive, mobile-first design
- Real-time audio/video recording via MediaRecorder API
- Animated breathing timer using CSS animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Sequelize ORM |
| AI Feedback | Anthropic Claude API |
| Auth | JWT (access + refresh tokens) |
| Frontend | React.js + Tailwind CSS |
| File Storage | Cloudinary (audio/video uploads) |
| Email | Nodemailer + SendGrid |
| API Style | RESTful |
| Testing | Jest + Supertest |