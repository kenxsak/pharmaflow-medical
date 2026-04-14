require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const { authMiddleware, auditLog } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

// Database
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://pharmaflow_user:PharmaFlow@2024@localhost:5432/pharmaflow',
  max: 20,
  idleTimeoutMillis: 30000,
});

// Middleware
app.use(cors({ origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Prescription upload
const prescriptionUpload = multer({
  storage: multer.diskStorage({
    destination: './uploads/prescriptions/',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: e.message });
  }
});

// Prescription upload endpoint
app.post('/api/upload/prescription', authMiddleware, prescriptionUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/prescriptions/${req.file.filename}`, filename: req.file.filename });
});

// Mount routes
app.use('/api/auth', require('./routes/auth')(db));
app.use('/api/medicines', require('./routes/medicines')(db));
app.use('/api/billing', require('./routes/billing')(db));
app.use('/api/inventory', require('./routes/inventory')(db));
app.use('/api/compliance', require('./routes/compliance')(db));
app.use('/api/customers', require('./routes/customers')(db));
app.use('/api/reports', require('./routes/reports')(db));
app.use('/api/purchase', require('./routes/purchase')(db));
app.use('/api/stores', require('./routes/stores')(db));
app.use('/api/delivery', require('./routes/delivery')(db));

// Serve frontend static files in production
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PharmaFlow API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
