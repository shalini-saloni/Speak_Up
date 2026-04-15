require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { sequelize, User } = require('./src/models');
const { router } = require('./src/routes');
const { seedIfEmpty } = require('./src/seed');

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (curl/postman) and same-origin requests
      if (!origin) return cb(null, true);

      const allow = [
        /^http:\/\/localhost:\d+$/i,
        /^http:\/\/127\.0\.0\.1:\d+$/i,
      ];

      if (process.env.CORS_ORIGIN) {
        const extra = process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
        if (extra.includes(origin)) return cb(null, true);
      }

      if (allow.some((re) => re.test(origin))) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
// Audio transcription uses base64 payloads; increase limit to avoid 413.
app.use(express.json({ limit: '25mb' })); // To parse JSON bodies

const PORT = process.env.PORT || 5001; // Vite runs on 5173, backend on 5001
app.use('/api', router);

// Start Server
async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Ensure there is at least one user for seeded pinned post ownership later
    const count = await User.count();
    if (count === 0 && process.env.SEED_DEMO_USER === 'true') {
      // Intentionally left blank: demo user is created via signup endpoint
    }

    await seedIfEmpty();

    const server = app.listen(PORT, () => {
      console.log(`Backend Server running on port ${PORT}`);
    });
    global.__SPEAKUP_SERVER__ = server;
  } catch (err) {
    console.error('Failed to start backend:', err);
    process.exit(1);
  }
}

start();

// Some environments aggressively tear down idle processes; this keeps the
// event loop alive while the HTTP server is running.
setInterval(() => {}, 60_000);
