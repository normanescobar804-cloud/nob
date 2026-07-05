const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);
const sessionSecret = process.env.SESSION_SECRET || 'cambiar-esta-clave';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(express.static(path.join(__dirname)));

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  // Create default admin if not exists
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (err) return console.error(err);
    if (!row) {
      const defaultPassword = 'admin123';
      bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) return console.error(err);
        db.run('INSERT INTO users (username, password) VALUES (?,?)', ['admin', hash], (err) => {
          if (err) console.error(err);
          else console.log('Usuario admin creado con contraseña por defecto: admin123 (cámbiala)');
        });
      });
    }
  });
});

// API: recibir solicitudes
app.post('/api/requests', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Campos faltantes' });
  const stmt = db.prepare('INSERT INTO requests (name,email,subject,message) VALUES (?,?,?,?)');
  stmt.run(name, email, subject, message, function (err) {
    if (err) return res.status(500).json({ error: 'Error guardando la solicitud' });
    res.json({ ok: true, id: this.lastID });
  });
  stmt.finalize();
});

// Admin auth
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Credenciales faltantes' });
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Error en BD' });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    bcrypt.compare(password, user.password, (err, same) => {
      if (err) return res.status(500).json({ error: 'Error en autenticación' });
      if (!same) return res.status(401).json({ error: 'Credenciales inválidas' });
      req.session.authenticated = true;
      res.json({ ok: true });
    });
  });
});

// Middleware de protección
function ensureAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'no autorizado' });
}

// Obtener solicitudes (admin)
app.get('/api/admin/requests', ensureAuth, (req, res) => {
  db.all('SELECT * FROM requests ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error leyendo solicitudes' });
    res.json({ ok: true, requests: rows });
  });
});

// Actualizar estado
app.post('/api/admin/requests/:id/status', ensureAuth, (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  db.run('UPDATE requests SET status = ? WHERE id = ?', [status, id], function (err) {
    if (err) return res.status(500).json({ error: 'Error actualizando' });
    res.json({ ok: true });
  });
});

// Health check for deploy platforms
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'norman-digital-solutions' });
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
