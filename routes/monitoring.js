// routes/monitoring.js
// Guru lihat jawaban semua siswa per screen/pertanyaan

const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const User = require('../models/User');
const { verifyToken, guruOnly } = require('./auth');

// ─────────────────────────────────────────────────────────────
// GET /api/monitoring/pertemuan/:p
// Semua jawaban siswa di satu pertemuan (ringkasan per siswa)
// ─────────────────────────────────────────────────────────────
router.get('/pertemuan/:p', verifyToken, guruOnly, async (req, res) => {
  try {
    const pertemuan = parseInt(req.params.p);
    const siswaList = await User.find({ role: 'siswa' })
      .select('userId fullName className groupNumber lastLoginAt');

    const result = await Promise.all(siswaList.map(async (siswa) => {
      const answers = await Answer.find({ studentId: siswa.userId, pertemuan })
        .select('screenType screenName score isCorrect timestamp lastModified answerContent');
      return {
        siswa: {
          userId: siswa.userId,
          fullName: siswa.fullName,
          className: siswa.className,
          groupNumber: siswa.groupNumber,
          lastLoginAt: siswa.lastLoginAt
        },
        jumlahJawaban: answers.length,
        screenSelesai: [...new Set(answers.map(a => a.screenType))],
        answers
      };
    }));

    res.status(200).json({ success: true, pertemuan, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/monitoring/siswa/:userId
// Semua jawaban satu siswa (semua pertemuan, semua screen)
// ─────────────────────────────────────────────────────────────
router.get('/siswa/:userId', verifyToken, guruOnly, async (req, res) => {
  try {
    const siswa = await User.findOne({ userId: req.params.userId, role: 'siswa' })
      .select('userId fullName className groupNumber lastLoginAt');
    if (!siswa) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });

    const answers = await Answer.find({ studentId: req.params.userId })
      .sort({ pertemuan: 1, timestamp: 1 });

    const grouped = {};
    answers.forEach(a => {
      const key = `P${a.pertemuan}_${a.screenType}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });

    res.status(200).json({
      success: true,
      siswa,
      totalJawaban: answers.length,
      groupedAnswers: grouped,
      answers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/monitoring/screen/:pertemuan/:screenType
// Semua jawaban semua siswa di satu screen
// e.g. GET /api/monitoring/screen/1/pemantik
// ─────────────────────────────────────────────────────────────
router.get('/screen/:pertemuan/:screenType', verifyToken, guruOnly, async (req, res) => {
  try {
    const { pertemuan, screenType } = req.params;
    const answers = await Answer.find({
      pertemuan: parseInt(pertemuan),
      screenType
    }).sort({ groupNumber: 1, timestamp: 1 });

    // Gabung dengan data siswa
    const enriched = await Promise.all(answers.map(async (ans) => {
      const siswa = await User.findOne({ userId: ans.studentId })
        .select('fullName className groupNumber');
      return { ...ans.toObject(), siswaInfo: siswa };
    }));

    res.status(200).json({
      success: true,
      pertemuan: parseInt(pertemuan),
      screenType,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/monitoring/kelompok/:groupNumber
// Semua jawaban dari satu kelompok
// ─────────────────────────────────────────────────────────────
router.get('/kelompok/:groupNumber', verifyToken, guruOnly, async (req, res) => {
  try {
    const groupNumber = parseInt(req.params.groupNumber);
    const siswaList = await User.find({ role: 'siswa', groupNumber })
      .select('userId fullName className groupNumber');

    const result = await Promise.all(siswaList.map(async (siswa) => {
      const answers = await Answer.find({ studentId: siswa.userId })
        .sort({ pertemuan: 1, screenType: 1 });
      return { siswa, answers };
    }));

    res.status(200).json({ success: true, groupNumber, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/monitoring/ringkasan
// Dashboard ringkasan: berapa siswa sudah jawab tiap screen
// ─────────────────────────────────────────────────────────────
router.get('/ringkasan', verifyToken, guruOnly, async (req, res) => {
  try {
    const { groupNumber } = req.query; // Menangkap filter kelompok dari Flutter
    
    // 1. Filter Total Siswa (Semua atau Per Kelompok)
    let userQuery = { role: 'siswa' };
    if (groupNumber) userQuery.groupNumber = parseInt(groupNumber);
    const totalSiswa = await User.countDocuments(userQuery);

    // Daftar semua screen
    const screens = [
      // ─── PERTEMUAN 1 (13 Materi) ───
      { pertemuan: 1, screenType: 'pemantik' },
      { pertemuan: 1, screenType: 'hipotesis' },
      { pertemuan: 1, screenType: 'hipotesis_refleksi' },
      { pertemuan: 1, screenType: 'penyelidikan' },
      ...Array.from({ length: 13 }, (_, i) => ({ pertemuan: 1, screenType: `material_mtrials_menelaah_p1_${i + 1}` })),
      { pertemuan: 1, screenType: 'latihan' },
      { pertemuan: 1, screenType: 'interpretasi' },
      { pertemuan: 1, screenType: 'kesimpulan' },
      
      // ─── PERTEMUAN 2 (11 Materi) ───
      { pertemuan: 2, screenType: 'pemantik' },
      { pertemuan: 2, screenType: 'hipotesis' },
      { pertemuan: 2, screenType: 'hipotesis_refleksi' },
      { pertemuan: 2, screenType: 'penyelidikan' },
      // Perhatikan tambahan "_p2_" di sini
      ...Array.from({ length: 11 }, (_, i) => ({ pertemuan: 2, screenType: `material_mtrials_menelaah_p2_${i + 1}` })),
      { pertemuan: 2, screenType: 'latihan' },
      { pertemuan: 2, screenType: 'interpretasi' },
      { pertemuan: 2, screenType: 'kesimpulan' },

      // ─── PERTEMUAN 3 (10 Materi) ───
      { pertemuan: 3, screenType: 'pemantik' },
      { pertemuan: 3, screenType: 'hipotesis' },
      { pertemuan: 3, screenType: 'hipotesis_refleksi' },
      { pertemuan: 3, screenType: 'penyelidikan' },
      // Perhatikan tambahan "_p3_" di sini
      ...Array.from({ length: 10 }, (_, i) => ({ pertemuan: 3, screenType: `material_mtrials_menelaah_p3_${i + 1}` })),
      { pertemuan: 3, screenType: 'latihan' },
      { pertemuan: 3, screenType: 'interpretasi' },
      { pertemuan: 3, screenType: 'kesimpulan' },
    ];

    // 2. Filter Jawaban Siswa
    const ringkasan = await Promise.all(screens.map(async (s) => {
      let ansQuery = { pertemuan: s.pertemuan, screenType: s.screenType };
      if (groupNumber) ansQuery.groupNumber = parseInt(groupNumber);

      const uniqueStudents = await Answer.distinct('studentId', ansQuery);
      return {
        ...s,
        sudahMenjawab: uniqueStudents.length,
        belumMenjawab: totalSiswa - uniqueStudents.length,
        persentase: totalSiswa > 0 ? Math.round((uniqueStudents.length / totalSiswa) * 100) : 0
      };
    }));

    res.status(200).json({ success: true, ringkasan, totalSiswa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/monitoring/export
// Mengambil seluruh data siswa dan jawaban untuk di-export
// ─────────────────────────────────────────────────────────────
router.get('/export', verifyToken, guruOnly, async (req, res) => {
  try {
    // Ambil data siswa dan urutkan berdasarkan kelompok
    const students = await User.find({ role: 'siswa' }).sort({ groupNumber: 1, fullName: 1 }).lean();
    const answers = await Answer.find().lean();

    const exportData = [];

    for (const student of students) {
      const studentAnswers = answers.filter(a => a.studentId === student.userId);

      // Jika siswa belum mengerjakan apa-apa
      if (studentAnswers.length === 0) {
        exportData.push({
          NISN: student.userId,
          Nama: student.fullName,
          Kelas: student.className || '-',
          Kelompok: student.groupNumber || '-',
          Pertemuan: '-',
          ScreenType: 'Belum Mengerjakan',
          Jawaban: '-',
          Skor: '-',
          Tanggal: '-'
        });
        continue;
      }

      // Gabungkan data untuk setiap jawaban siswa
      for (const ans of studentAnswers) {
        exportData.push({
          NISN: student.userId,
          Nama: student.fullName,
          Kelas: student.className || '-',
          Kelompok: student.groupNumber || '-',
          Pertemuan: ans.pertemuan,
          ScreenType: ans.screenType,
          Jawaban: ans.answerContent, // Akan di-format rapi di sisi Flutter
          Skor: ans.score ?? '-',
          Tanggal: ans.timestamp || '-'
        });
      }
    }

    res.status(200).json({ success: true, data: exportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
