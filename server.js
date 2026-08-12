require('dotenv').config();
const express = require('express');
const cors = require('cors');
const consultationRoutes = require('./src/routes/consultationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('===================================');
console.log('Starting Consultation Server...');
console.log('===================================');
console.log('Environment Variables:');
console.log('PORT:', PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_RECIPIENT:', process.env.EMAIL_RECIPIENT);
console.log('BACKEND_URL:', process.env.BACKEND_URL);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
console.log('===================================\n');

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://b-spoke.com.au',
  'https://www.b-spoke.com.au',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log('CORS enabled for origins:', allowedOrigins);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('Body parser middleware configured\n');

// Routes
app.use('/api', consultationRoutes);
console.log('Consultation routes registered at /api');

// Root route
app.get('/', (req, res) => {
  console.log('GET / - Root endpoint accessed');
  res.json({
    message: 'Consultation Booking Server is running',
    endpoint: {
      bookConsultation: 'POST /api/book-consultation'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  console.log('GET /health - Health check accessed');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n===================================');
  console.log(`✓ Server is running on port ${PORT}`);
  console.log(`✓ Server URL: http://localhost:${PORT}`);
  console.log('===================================');
  console.log('\nAvailable Endpoints:');
  console.log(`- GET  http://localhost:${PORT}/`);
  console.log(`- GET  http://localhost:${PORT}/health`);
  console.log(`- POST http://localhost:${PORT}/api/book-consultation`);
  console.log('===================================\n');
  console.log('Server is ready to handle requests!');
  console.log('Press Ctrl+C to stop the server\n');
});
