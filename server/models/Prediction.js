const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weight: { type: Number, required: true },
  calories: { type: Number, required: true },
  maintenance: { type: Number, required: true },
  protein: { type: Number, required: true },
  workoutDays: { type: Number, required: true },
  targetWeight: { type: Number, required: true },
  fatLossPerWeek: { type: Number, required: true },
  weeksToTarget: { type: Number, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);
