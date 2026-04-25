// models/User.js
// Replaces models/StudentAuth.js - handles both guru and siswa

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({

  // ─── IDENTITAS ───────────────────────────────────────────────
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    select: false
  },

  // ─── ROLE ─────────────────────────────────────────────────────
  role: {
    type: String,
    enum: ['guru', 'siswa'],
    required: true,
    default: 'siswa'
  },

  // ─── DATA SISWA (hanya diisi jika role === 'siswa') ───────────
  className: {
    type: String,
    default: null
  },
  groupNumber: {
    type: Number,
    min: 1,
    max: 6,
    default: null
  },

  // ─── STATUS ───────────────────────────────────────────────────
  isActive: {
    type: Boolean,
    default: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: null
  },

  // ─── SESSION ──────────────────────────────────────────────────
  sessionToken: {
    type: String,
    default: null,
    select: false
  },
  tokenExpiresAt: {
    type: Date,
    default: null,
    select: false
  }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

userSchema.methods.generateSessionToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.sessionToken = token;
  this.tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return token;
};

module.exports = mongoose.model('User', userSchema);
