// routes/students.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Progress = require('../models/Progress');

// POST: Register siswa baru
router.post('/register', async (req, res) => {
  try {
    const { studentId, name, email, className, groupNumber } = req.body;

    // Validasi
    if (!studentId || !name || !className || !groupNumber) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    // Check sudah ada atau belum
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(409).json({ message: 'Student sudah terdaftar' });
    }

    // Create student
    const student = new Student({
      studentId,
      name,
      email,
      class: className,
      groupNumber
    });
    await student.save();

    // Create progress record
    const progress = new Progress({ studentId });
    await progress.save();

    res.status(201).json({
      success: true,
      message: 'Student berhasil terdaftar',
      data: student
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering student', error: error.message });
  }
});

// GET: Ambil data siswa
router.get('/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });

    if (!student) {
      return res.status(404).json({ message: 'Student tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
});

// PUT: Update data siswa
router.put('/:studentId', async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.studentId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student tidak ditemukan' });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated',
      data: student
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
});

// GET: Ambil semua siswa dari group tertentu
router.get('/group/:groupNumber', async (req, res) => {
  try {
    const students = await Student.find({ groupNumber: req.params.groupNumber });

    res.status(200).json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────

