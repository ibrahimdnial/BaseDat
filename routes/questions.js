// routes/questions.js
const express = require('express');
const router = express.Router();
const QuestionBank = require('../models/QuestionBank');

// GET: Ambil semua questions
router.get('/', async (req, res) => {
  try {
    const questions = await QuestionBank.find();

    res.status(200).json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// GET: Ambil questions by pertemuan dan group
router.get('/pertemuan/:pertemuan/group/:groupNumber', async (req, res) => {
  try {
    const { pertemuan, groupNumber } = req.params;

    const questions = await QuestionBank.find({
      pertemuan: parseInt(pertemuan),
      groupNumber: parseInt(groupNumber)
    });

    res.status(200).json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// POST: Seed questions (untuk inisialisasi)
router.post('/seed', async (req, res) => {
  try {
    // Clear existing
    await QuestionBank.deleteMany({});

    // Insert all questions from latihan_1, latihan_2, latihan_3
    const questions = [
      // Pertemuan 1 - Tipe Data
      {
        pertemuan: 1,
        groupNumber: 1,
        questionType: 'khusus',
        topic: 'CHAR vs VARCHAR',
        question: 'Apakah kita dapat menyimpan data Nomor Induk Siswa Nasional (NISN) dan data Alamat Rumah menggunakan tipe data yang sama?',
        elaboration: 'Jelaskan pilihan tipe data yang paling tepat untuk masing-masing kolom tersebut dengan mempertimbangkan tujuan penggunaan, jangkauan (range), dan penyimpanan yang dibutuhkan antara tipe data CHAR dan VARCHAR!',
        dataA: 'NISN',
        dataB: 'Alamat Rumah',
        typeA: 'CHAR',
        typeB: 'VARCHAR',
        dragItems: ['NISN', 'Alamat Rumah', 'Kode Pos', 'Nama Kota', 'Singkatan Negara', 'Deskripsi Lokasi'],
        correctA: [0, 2, 4],
        correctB: [1, 3, 5],
        explanations: [
          'NISN selalu 10 digit — panjang tetap, CHAR lebih efisien karena tidak butuh overhead panjang.',
          'Alamat rumah panjangnya sangat bervariasi — VARCHAR hemat ruang karena menyesuaikan isi.',
          'Kode pos selalu 5 digit — panjang tetap, CHAR tepat tanpa overhead.',
          'Nama kota panjangnya bervariasi — VARCHAR lebih hemat memori.',
          'Singkatan negara selalu 2–3 huruf — panjang tetap, CHAR sesuai.',
          'Deskripsi lokasi bisa sangat panjang dan berbeda-beda — VARCHAR lebih tepat.'
        ],
        color: '#4A90D9',
        icon: 'badge_outlined'
      },
      // ... Tambahkan questions lainnya dari 5 group yang tersisa
    ];

    await QuestionBank.insertMany(questions);

    res.status(201).json({
      success: true,
      message: `${questions.length} questions berhasil diseed ke database`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding questions', error: error.message });
  }
});

module.exports = router;
