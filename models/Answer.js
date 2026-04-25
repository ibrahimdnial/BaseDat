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

