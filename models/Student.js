// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  school: {
    type: String,
    default: 'SMK Negeri 1 Cimahi'
  },
  class: {
    type: String,
    required: true
  },
  groupNumber: {
    type: Number,
    min: 1,
    max: 6,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);

