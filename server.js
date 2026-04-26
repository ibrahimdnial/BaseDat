// server.js (final version)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/basedat_db';

// ─── 1. SERVERLESS CONNECTION CACHE (ANTI-DISCONNECT) ─────────
let isConnected = false;

const connectDB = async () => {
  // Jika sudah konek sebelumnya, gunakan koneksi yang ada
  if (isConnected) {
    return;
  }
  
  // Jika belum konek (atau server baru bangun), buat koneksi baru
  try {
    const db = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✓ MongoDB connected (Serverless mode)');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err);
  }
};

// ─── 2. DATABASE MIDDLEWARE ───────────────────────────────────
// Middleware ini memaksa Vercel memastikan MongoDB melek SEBELUM memproses API apapun
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
// ──────────────────────────────────────────────────────────────

// ─── ROUTES ───────────────────────────────────────────────────
const { router: authRouter } = require('./routes/auth');
app.use('/api/auth', authRouter);
app.use('/api/answers', require('./routes/answers'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/monitoring', require('./routes/monitoring'));

app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  BaseDat Backend Server Running        ║`);
  console.log(`║  Port: ${PORT}                              ║`);
  console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}          ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});

module.exports = app;
