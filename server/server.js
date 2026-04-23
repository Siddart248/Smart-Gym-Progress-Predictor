require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const auth = require('./middleware/auth');
const Prediction = require('./models/Prediction');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "https://smart-gym-progress-predictor.onrender.com",
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ username, email, password });
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, username: user.username });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, username: user.username });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Explanation Engine Helper
const generateMessage = (deficit, protein, workoutDays) => {
  let messages = [];

  if (deficit <= 0) {
    messages.push("You are in calorie surplus. Fat gain is likely.");
  } else {
    messages.push("You are in fat loss mode.");
  }

  if (protein < 80) {
    messages.push("Protein is low — muscle gain will be slower.");
  }

  if (workoutDays < 3) {
    messages.push("Low workout frequency is slowing your progress.");
  } else if (workoutDays >= 5) {
    messages.push("Great consistency. Progress will be faster.");
  }

  if (deficit > 1000) {
    messages.push("Deficit too aggressive. Risk of muscle loss.");
  }

  return messages.join(" ");
};

// API Endpoint: POST /predict
app.post('/predict', auth, async (req, res) => {
  try {
    const { 
      weight, 
      calories, 
      maintenance, 
      protein, 
      workoutDays,
      targetWeight,
      extraProtein,
      extraWorkouts,
      calorieChange 
    } = req.body;

    // 1. Calculate Original Prediction
    const deficit = maintenance - calories;
    const fatLossPerWeek = (deficit * 7) / 7700;
    
    // Dynamic Weeks to Target calculation
    const weightDiff = weight - targetWeight;
    const weeksToTarget = (fatLossPerWeek > 0 && weightDiff > 0) ? (weightDiff / fatLossPerWeek) : 0;
    
    const message = generateMessage(deficit, protein, workoutDays);

    // 2. Save Original to MongoDB
    const newPrediction = new Prediction({
      user: req.user.id,
      weight,
      calories,
      maintenance,
      protein,
      workoutDays,
      targetWeight,
      fatLossPerWeek,
      weeksToTarget,
      message
    });
    await newPrediction.save();

    // 3. What-If Simulation (Optional)
    let simulatedResult = null;
    if (extraProtein !== undefined || extraWorkouts !== undefined || calorieChange !== undefined) {
      const simProtein = protein + (Number(extraProtein) || 0);
      const simWorkouts = workoutDays + (Number(extraWorkouts) || 0);
      const simCalories = calories + (Number(calorieChange) || 0);
      
      const simDeficit = maintenance - simCalories;
      const simFatLossPerWeek = (simDeficit * 7) / 7700;
      const simMessage = generateMessage(simDeficit, simProtein, simWorkouts);

      simulatedResult = {
        fatLossPerWeek: simFatLossPerWeek,
        message: simMessage
      };
    }

    // 4. Return JSON Response
    res.status(201).json({
      fatLossPerWeek,
      weeksToTarget,
      message,
      ...(simulatedResult && { simulatedResult })
    });

  } catch (error) {
    console.error('Error processing prediction:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
