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

// ─────────────────────────────────────────────────────────────

// models/Answer.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: 'Student'
  },
  pertemuan: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  screenType: {
    type: String,
    enum: ['pemantik', 'hipotesis', 'latihan', 'interpretasi', 'kesimpulan'],
    required: true
  },
  groupNumber: {
    type: Number,
    min: 1,
    max: 6
  },
  screenName: {
    type: String,
    required: true
  },
  questionId: {
    type: String
  },
  answerContent: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  reflectionText: String,
  dragAnswers: {
    zoneA: [Number],
    zoneB: [Number]
  },
  argumentText: {
    dataA: String,
    dataB: String
  },
  premisList: [{
    id: String,
    type: String,
    text: String
  }],
  interpretationTree: mongoose.Schema.Types.Mixed,
  conclusionText: String,
  score: Number,
  isCorrect: Boolean,
  timestamp: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

// Index untuk query cepat
answerSchema.index({ studentId: 1, pertemuan: 1, screenType: 1 });
answerSchema.index({ studentId: 1, groupNumber: 1 });

module.exports = mongoose.model('Answer', answerSchema);

// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────

// models/QuestionBank.js
const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  pertemuan: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  groupNumber: {
    type: Number,
    min: 1,
    max: 6,
    required: true
  },
  questionType: {
    type: String,
    enum: ['umum', 'khusus'],
    required: true
  },
  topic: String,
  question: {
    type: String,
    required: true
  },
  elaboration: String,
  dataA: String,
  dataB: String,
  typeA: String,
  typeB: String,
  dragItems: [String],
  correctA: [Number],
  correctB: [Number],
  explanations: [String],
  color: String,
  icon: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuestionBank', questionBankSchema);
