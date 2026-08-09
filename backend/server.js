const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { initializeWhatsApp, logoutWhatsApp } = require('./controllers/whatsappClient');
const { tunnelmole } = require('tunnelmole');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
const whatsappRoutes = require('./routes/whatsapp');
const rulesRoutes = require('./routes/rules');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const tablesRoutes = require('./routes/tables');

app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tables', tablesRoutes);

// Serve index.html for root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Catch-all middleware for frontend pages (must be after API routes)
// This serves HTML files or falls back to index.html
app.use((req, res, next) => {
  // Skip API routes and favicon
  if (req.path.startsWith('/api') || req.path === '/favicon.ico') {
    return next();
  }

  const filePath = path.join(__dirname, '..', req.path);
  
  // Check if the file exists and is a file
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }

  // Try adding .html extension
  const htmlPath = filePath + '.html';
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }

  // Try index.html in the directory
  const indexPath = path.join(filePath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // Fallback to root index.html
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const server = app.listen(PORT, async () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`========================================\n`);
  console.log(`📍 Local URL:  http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health\n`);

  // Start tunnelmole to generate a public shareable link (more stable than localtunnel)
  (async () => {
    try {
      const url = await tunnelmole({ port: PORT });
      console.log(`\n🌍 Public URL: ${url}`);
      console.log(`(Share this link to access the dashboard from anywhere)\n`);
    } catch (err) {
      console.error('Error starting tunnelmole:', err.message);
    }
  })();

  // Initialize WhatsApp client after server is ready
  setTimeout(() => {
    initializeWhatsApp();
  }, 1000);


});

// Graceful shutdown - close WhatsApp client before exit
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  try {
    await logoutWhatsApp();
  } catch (e) {
    console.error('Error during WhatsApp logout:', e.message);
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
