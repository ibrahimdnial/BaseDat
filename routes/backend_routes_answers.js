// routes/answers.js
const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Progress = require('../models/Progress');

// ─────────────────────────────────────────────────────────────
// POST: Simpan jawaban baru
// ─────────────────────────────────────────────────────────────
router.post('/save', async (req, res) => {
  try {
    const {
      studentId,
      pertemuan,
      screenType,
      screenName,
      groupNumber,
      questionId,
      answerContent,
      dragAnswers,
      argumentText,
      premisList,
      interpretationTree,
      conclusionText,
      score,
      isCorrect
    } = req.body;

    // Validasi input
    if (!studentId || !pertemuan || !screenType || !answerContent) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    // Cari jawaban yang sudah ada untuk update atau buat baru
    const existingAnswer = await Answer.findOne({
      studentId,
      pertemuan,
      screenType,
      groupNumber,
      questionId
    });

    let answer;
    if (existingAnswer) {
      // Update jawaban yang sudah ada
      Object.assign(existingAnswer, {
        answerContent,
        dragAnswers,
        argumentText,
        premisList,
        interpretationTree,
        conclusionText,
        score,
        isCorrect,
        lastModified: new Date()
      });
      answer = await existingAnswer.save();
    } else {
      // Buat jawaban baru
      answer = new Answer({
        studentId,
        pertemuan,
        screenType,
        screenName,
        groupNumber,
        questionId,
        answerContent,
        dragAnswers,
        argumentText,
        premisList,
        interpretationTree,
        conclusionText,
        score,
        isCorrect,
        timestamp: new Date()
      });
      answer = await answer.save();
    }

    // Update progress
    await updateProgress(studentId, pertemuan, screenType);

    res.status(201).json({
      success: true,
      message: 'Jawaban berhasil disimpan',
      data: answer
    });
  } catch (error) {
    console.error('Error menyimpan jawaban:', error);
    res.status(500).json({ message: 'Gagal menyimpan jawaban', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET: Ambil jawaban berdasarkan student, pertemuan, screen
// ─────────────────────────────────────────────────────────────
router.get('/student/:studentId/pertemuan/:pertemuan/screen/:screenType', async (req, res) => {
  try {
    const { studentId, pertemuan, screenType } = req.params;

    const answers = await Answer.find({
      studentId,
      pertemuan: parseInt(pertemuan),
      screenType
    }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: answers,
      count: answers.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil jawaban', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET: Ambil jawaban spesifik berdasarkan ID
// ─────────────────────────────────────────────────────────────
router.get('/answer/:answerId', async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);

    if (!answer) {
      return res.status(404).json({ message: 'Jawaban tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: answer
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil jawaban', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET: Ambil jawaban berdasarkan group
// ─────────────────────────────────────────────────────────────
router.get('/student/:studentId/group/:groupNumber', async (req, res) => {
  try {
    const { studentId, groupNumber } = req.params;

    const answers = await Answer.find({
      studentId,
      groupNumber: parseInt(groupNumber)
    }).sort({ pertemuan: 1, timestamp: -1 });

    res.status(200).json({
      success: true,
      data: answers,
      count: answers.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil jawaban', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT: Update jawaban yang sudah ada
// ─────────────────────────────────────────────────────────────
router.put('/answer/:answerId', async (req, res) => {
  try {
    const answer = await Answer.findByIdAndUpdate(
      req.params.answerId,
      { ...req.body, lastModified: new Date() },
      { new: true, runValidators: true }
    );

    if (!answer) {
      return res.status(404).json({ message: 'Jawaban tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      message: 'Jawaban berhasil diperbarui',
      data: answer
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui jawaban', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE: Hapus jawaban
// ─────────────────────────────────────────────────────────────
router.delete('/answer/:answerId', async (req, res) => {
  try {
    const answer = await Answer.findByIdAndDelete(req.params.answerId);

    if (!answer) {
      return res.status(404).json({ message: 'Jawaban tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      message: 'Jawaban berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus jawaban', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Helper: Update progress saat jawaban disimpan
// ─────────────────────────────────────────────────────────────
async function updateProgress(studentId, pertemuan, screenType) {
  try {
    let progress = await Progress.findOne({ studentId });

    if (!progress) {
      progress = new Progress({ studentId });
    }

    // Update pertemuan progress
    let pertemuanData = progress.pertemuan.find(p => p.number === pertemuan);
    if (!pertemuanData) {
      pertemuanData = { number: pertemuan };
      progress.pertemuan.push(pertemuanData);
    }

    // Update field sesuai screen type
    const fieldMap = {
      'pemantik': 'pemantik_completed',
      'hipotesis': 'hipotesis_completed',
      'latihan': 'latihan_completed',
      'interpretasi': 'interpretasi_completed',
      'kesimpulan': 'kesimpulan_completed'
    };

    if (fieldMap[screenType]) {
      pertemuanData[fieldMap[screenType]] = true;
      pertemuanData.completionDate = new Date();
    }

    progress.latestPertemuan = pertemuan;
    progress.latestScreen = screenType;
    progress.lastAccessDate = new Date();

    // Hitung progress keseluruhan
    const totalScreens = progress.pertemuan.reduce((sum, p) => {
      const completed = Object.values(p).filter(v => v === true).length;
      return sum + completed;
    }, 0);
    progress.overallProgress = Math.round((totalScreens / (progress.pertemuan.length * 9)) * 100);

    await progress.save();
  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

module.exports = router;
