const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ────────────────────────────────────────────────────
// Person 1 routes
app.use('/api/vehicles',    require('./routes/vehicles'));
app.use('/api/drivers',     require('./routes/drivers'));
app.use('/api/fuel',        require('./routes/fuel'));
app.use('/api/maintenance', require('./routes/maintenance'));

// Person 2 routes
app.use('/api/routes',    require('./routes/routes'));
app.use('/api/trips',     require('./routes/trips'));
app.use('/api/incidents', require('./routes/incidents'));

// Person 3 routes (Analytics, Reports, AI/ML)
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/schema',      require('./routes/schema'));

// ─── Health Check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'RoadRunner API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 RoadRunner API running on http://localhost:${PORT}`);
});

module.exports = app;
