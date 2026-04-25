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
