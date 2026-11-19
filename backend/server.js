const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
const JWT_SECRET = 'lumora_super_secret_key_123';
const DB_FILE = path.join(__dirname, 'data.json');
// --- DATABASE SETUP (File-Based) ---
let db = { users: [], transactions: [] };
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading database file.");
  }
}
function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
// --- AUTH MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}
// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    db.users.push(newUser);
    saveDb();

    const token = jwt.sign({ id: newUser.id, name: newUser.name }, JWT_SECRET);
    res.json({ token, name: newUser.name });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'User not found.' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password.' });

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);
    res.json({ token, name: user.name });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- CRUD ROUTES ---
app.get('/api/transactions', authenticateToken, (req, res) => {
  res.json(db.transactions.filter(t => t.userId === req.user.id));
});

app.post('/api/transactions', authenticateToken, (req, res) => {
  try {
    const { merchant, amount, category, status } = req.body;
    if (!merchant || !amount || !category || !status) return res.status(400).json({ error: 'Missing fields.' });
    if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount.' });

    const newTx = {
      id: Date.now(), userId: req.user.id, merchant: merchant.trim(), amount: parseFloat(amount), category, status,
      date: new Date().toISOString().split('T')[0]
    };

    db.transactions.unshift(newTx);
    saveDb();
    res.json(newTx);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create.' });
  }
});

app.put('/api/transactions/:id', authenticateToken, (req, res) => {
  const idx = db.transactions.findIndex(t => t.id == req.params.id && t.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });

  db.transactions[idx] = { ...db.transactions[idx], ...req.body };
  saveDb();
  res.json(db.transactions[idx]);
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  db.transactions = db.transactions.filter(t => !(t.id == req.params.id && t.userId === req.user.id));
  saveDb();
  res.json({ success: true });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Lumora Backend running on http://localhost:${PORT}`);
});