// routes/auth.js  (v2 - replace your existing routes/auth.js)
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token tidak ada' });
  const user = await User.findOne({
    sessionToken: token,
    tokenExpiresAt: { $gt: new Date() }
  }).select('+sessionToken');
  if (!user) return res.status(401).json({ success: false, message: 'Token tidak valid' });
  req.user = user;
  next();
};

const guruOnly = (req, res, next) => {
  if (req.user.role !== 'guru') {
    return res.status(403).json({ success: false, message: 'Akses hanya untuk guru' });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'userId dan password wajib diisi' });
    }
    const user = await User.findOne({ userId: userId.trim(), isActive: true }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'ID atau password salah' });
    }
    const token = user.generateSessionToken();
    user.lastLoginAt = new Date();
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        userId: user.userId,
        fullName: user.fullName,
        role: user.role,
        className: user.className,
        groupNumber: user.groupNumber,
        mustChangePassword: user.mustChangePassword,
        sessionToken: token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/guru/setup
// Buat akun guru pertama kali (sekali pakai, nonaktif setelah ada 1 guru)
// ─────────────────────────────────────────────────────────────
// Pastikan argumennya lengkap: (req, res, next)
// Hapus 'next' dari argumen fungsi
router.post('/guru/setup', async (req, res) => { 
  try {
    const { userId, fullName, password } = req.body;

    // Cek apakah sudah ada guru (keamanan dasar)
    const existingGuru = await User.findOne({ role: 'guru' });
    if (existingGuru) {
      return res.status(400).json({ 
        success: false, 
        message: "Akun guru sudah ada di database." 
      });
    }

    // Buat objek user baru
    const newGuru = new User({
      userId,
      fullName,
      password, // Ini akan otomatis di-hash jika schema User.js kamu sudah benar
      role: 'guru'
    });

    await newGuru.save();

    // Langsung kirim respon sukses
    return res.status(201).json({ 
      success: true, 
      message: "Akun guru berhasil dibuat! Silakan login di aplikasi." 
    });

  } catch (error) {
    // JANGAN panggil next(error), langsung kirim res.status
    console.error("Error Setup Guru:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
// ─────────────────────────────────────────────────────────────
// POST /api/auth/guru/buat-siswa - Buat satu akun siswa
// ─────────────────────────────────────────────────────────────
router.post('/guru/buat-siswa', verifyToken, guruOnly, async (req, res) => {
  try {
    const { userId, fullName, className, groupNumber, password } = req.body;
    if (!userId || !fullName || !className || !groupNumber) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }
    const existing = await User.findOne({ userId });
    if (existing) {
      return res.status(409).json({ success: false, message: `ID ${userId} sudah terdaftar` });
    }
    const pwd = password || userId;
    const siswa = new User({
      userId, fullName, role: 'siswa', className,
      groupNumber, password: pwd, mustChangePassword: false
    });
    await siswa.save();
    res.status(201).json({
      success: true,
      message: `Akun ${fullName} berhasil dibuat`,
      data: { userId: siswa.userId, fullName: siswa.fullName, groupNumber: siswa.groupNumber, defaultPassword: pwd }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/guru/buat-siswa-bulk
// Guru buat banyak akun sekaligus
// Body: { siswaList: [{ userId, fullName, className, groupNumber }] }
// ─────────────────────────────────────────────────────────────
router.post('/guru/buat-siswa-bulk', verifyToken, guruOnly, async (req, res) => {
  try {
    const { siswaList } = req.body;
    if (!Array.isArray(siswaList) || siswaList.length === 0) {
      return res.status(400).json({ success: false, message: 'siswaList tidak valid' });
    }
    const berhasil = [];
    const gagal = [];
    for (const s of siswaList) {
      try {
        const existing = await User.findOne({ userId: s.userId });
        if (existing) { gagal.push({ userId: s.userId, reason: 'Sudah terdaftar' }); continue; }
        const siswa = new User({
          userId: s.userId, fullName: s.fullName, role: 'siswa',
          className: s.className, groupNumber: s.groupNumber,
          password: s.userId, mustChangePassword: false
        });
        await siswa.save();
        berhasil.push({ userId: s.userId, fullName: s.fullName, password: s.userId });
      } catch (e) {
        gagal.push({ userId: s.userId, reason: e.message });
      }
    }
    res.status(201).json({
      success: true,
      message: `${berhasil.length} akun berhasil, ${gagal.length} gagal`,
      data: { berhasil, gagal }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/guru/daftar-siswa
// ─────────────────────────────────────────────────────────────
router.get('/guru/daftar-siswa', verifyToken, guruOnly, async (req, res) => {
  try {
    const siswaList = await User.find({ role: 'siswa' })
      .select('userId fullName className groupNumber lastLoginAt isActive')
      .sort({ groupNumber: 1, fullName: 1 });
    res.status(200).json({ success: true, data: siswaList, count: siswaList.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/profile
// ─────────────────────────────────────────────────────────────
router.get('/profile', verifyToken, async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      userId: req.user.userId,
      fullName: req.user.fullName,
      role: req.user.role,
      className: req.user.className,
      groupNumber: req.user.groupNumber,
      lastLoginAt: req.user.lastLoginAt
    }
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
router.post('/logout', verifyToken, async (req, res) => {
  req.user.sessionToken = null;
  req.user.tokenExpiresAt = null;
  await req.user.save();
  res.status(200).json({ success: true, message: 'Logout berhasil' });
});

// ─────────────────────────────────────────────────────────────
// PUT /api/auth/ganti-password
// ─────────────────────────────────────────────────────────────
router.put('/ganti-password', verifyToken, async (req, res) => {
  try {
    const { passwordBaru } = req.body;
    if (!passwordBaru || passwordBaru.length < 4) {
      return res.status(400).json({ success: false, message: 'Password minimal 4 karakter' });
    }
    const user = await User.findOne({ userId: req.user.userId }).select('+password');
    user.password = passwordBaru;
    user.mustChangePassword = false;
    await user.save();
    res.status(200).json({ success: true, message: 'Password berhasil diganti' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/auth/guru/siswa/:userId
// Menghapus akun siswa beserta seluruh jawaban & progressnya
// ─────────────────────────────────────────────────────────────
router.delete('/guru/siswa/:userId', verifyToken, guruOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 1. Hapus akun dari tabel Users
    const user = await User.findOneAndDelete({ userId: userId, role: 'siswa' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    // 2. Hapus semua jawaban siswa tersebut dari tabel Answers
    const Answer = require('../models/Answer');
    await Answer.deleteMany({ studentId: userId });

    // 3. Hapus progress siswa dari tabel Progress
    const Progress = require('../models/Progress');
    await Progress.findOneAndDelete({ studentId: userId });

    res.status(200).json({ 
      success: true, 
      message: `Akun dan seluruh data jawaban ${user.fullName} berhasil dihapus permanen.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { router, verifyToken, guruOnly };
