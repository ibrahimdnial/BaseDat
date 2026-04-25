// routes/progress.js
const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// GET: Ambil progress siswa
router.get('/student/:studentId', async (req, res) => {
  try {
    let progress = await Progress.findOne({ studentId: req.params.studentId });

    if (!progress) {
      progress = new Progress({ studentId: req.params.studentId });
      await progress.save();
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
});

// PUT: Update progress siswa
router.put('/student/:studentId', async (req, res) => {
  try {
    let progress = await Progress.findOneAndUpdate(
      { studentId: req.params.studentId },
      { ...req.body, lastAccessDate: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Progress updated',
      data: progress
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────

