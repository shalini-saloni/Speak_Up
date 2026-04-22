require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./src/db');
const User = require('./models/User'); // Import Mongoose User model for initial checks if needed
const { router } = require('./src/routes');
const { seedIfEmpty } = require('./src/seed');

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const whitelist = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://speak-up-kappa.vercel.app'
      ];

      if (process.env.CORS_ORIGIN) {
        const extra = process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
        whitelist.push(...extra);
      }

      const isAllowed = whitelist.some(item => {
        if (item.includes('*')) {
          const pattern = new RegExp(`^${item.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`, 'i');
          return pattern.test(origin);
        }
        return item === origin;
      });

      if (isAllowed) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '25mb' }));

const PORT = process.env.PORT || 5001;
app.use('/api', router);

async function start() {
  try {
    await connectDB();

    const count = await User.countDocuments();
    if (count === 0 && process.env.SEED_DEMO_USER === 'true') {
      // Logic for demo user can be added here if needed
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

setInterval(() => { }, 60_000);
