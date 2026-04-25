// models/StudentAuth.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentAuthSchema = new mongoose.Schema({
  // Identitas Unik
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: 'NISN atau nomor identitas siswa'
  },
  
  // Data Pribadi
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email tidak valid']
  },
  phone: {
    type: String,
    sparse: true
  },
  
  // Informasi Sekolah
  school: {
    type: String,
    default: 'SMK Negeri 1 Cimahi',
    required: true
  },
  className: {
    type: String,
    required: true,
    description: 'Contoh: XI SIJA, XI RPL, dll'
  },
  groupNumber: {
    type: Number,
    min: 1,
    max: 6,
    required: true,
    description: 'Kelompok pembelajaran (1-6)'
  },
  
  // Keamanan - Password
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // Jangan include password saat query normal
    description: 'Password sudah di-hash dengan bcrypt'
  },
  
  // Status Akun
  isActive: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  // Token & Session
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

// ─────────────────────────────────────────────────────────────
// HASH PASSWORD SEBELUM SIMPAN
// ─────────────────────────────────────────────────────────────
studentAuthSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────
// METHOD: VERIFY PASSWORD
// ─────────────────────────────────────────────────────────────
studentAuthSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─────────────────────────────────────────────────────────────
// METHOD: GENERATE SESSION TOKEN
// ─────────────────────────────────────────────────────────────
studentAuthSchema.methods.generateSessionToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari
  
  this.sessionToken = token;
  this.tokenExpiresAt = expiresAt;
  
  return token;
};

module.exports = mongoose.model('StudentAuth', studentAuthSchema);
