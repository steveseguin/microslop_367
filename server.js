const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3443;

// SSL certificates
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'suite', 'dist')));

// SPA Fallback Route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'suite', 'dist', 'index.html'));
});

// Start HTTPS server
https.createServer(options, app).listen(PORT, () => {
  console.log(`OfficeNinja Modern running at https://localhost:${PORT}`);
  console.log('Note: Accept the self-signed certificate warning in your browser');
});