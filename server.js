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
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/word', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'word.html'));
});

app.get('/excel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'excel.html'));
});

app.get('/powerpoint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'powerpoint.html'));
});

// Start HTTPS server
https.createServer(options, app).listen(PORT, () => {
  console.log(`OfficeNinja running at https://localhost:${PORT}`);
  console.log('Note: Accept the self-signed certificate warning in your browser');
});
