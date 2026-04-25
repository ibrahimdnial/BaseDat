// models/Progress.js
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: 'Student',
    unique: true
  },
  pertemuan: [{
    number: Number,
    cptp_completed: Boolean,
    pemantik_completed: Boolean,
    hipotesis_completed: Boolean,
    penyelidikan_completed: Boolean,
    material_completed: Boolean,
    latihan_completed: Boolean,
    interpretasi_khusus_completed: Boolean,
    interpretasi_completed: Boolean,
    kesimpulan_completed: Boolean,
    completionDate: Date
  }],
  latestPertemuan: {
    type: Number,
    default: 1
  },
  latestScreen: String,
  overallProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastAccessDate: {
    type: Date,
    default: Date.now
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Progress', progressSchema);

