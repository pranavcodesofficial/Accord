const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const decisionRoutes = require('./routes/decisions');
const healthRoutes = require('./routes/health');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/health', healthRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;