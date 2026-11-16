const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs'); // Added File System to save data
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'lumora_super_secret_key_123';
const DB_FILE = path.join(__dirname, 'data.json');

// --- DATABASE SETUP (File-Based) ---
// This function reads data.json. If it doesn't exist, it creates it.
let db = { users: [], transactions: [] };
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading database file.");
  }
} else {
  // Seed initial data if database is empty
  db.transactions = [
    { id: 1, userId: 1, merchant: 'AWS Hosting', category: 'Infrastructure', date: '2025-10-24', amount: 124.50, status: 'paid' },
    { id: 2, userId: 1, merchant: 'Figma Pro', category: 'Software', date: '2025-10-23', amount: 15.00, status: 'paid' }
  ];
  saveDb();
}

// Helper function to save the database to the JSON file
function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- AUTHENTICATION MIDDLEWARE ---
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

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // 2. Hash Password & Save
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    db.users.push(newUser);
    saveDb(); // Persist to file!

    // 3. Generate Token
    const token = jwt.sign({ id: newUser.id, name: newUser.name }, JWT_SECRET);
    console.log(`✅ New user registered: ${email}`);
    res.json({ token, name: newUser.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error during registration.' });
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
    console.log(`🔑 User logged in: ${email}`);
    res.json({ token, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// ==========================================
// CRUD ROUTES (Protected)
// ==========================================

// READ: Get all transactions for the logged-in user
app.get('/api/transactions', authenticateToken, (req, res) => {
  const userTransactions = db.transactions.filter(t => t.userId === req.user.id);
  res.json(userTransactions);
});

// CREATE: Add a new transaction
app.post('/api/transactions', authenticateToken, (req, res) => {
  try {
    const { merchant, amount, category, status } = req.body;

    // Strict Validation
    if (!merchant || !amount || !category || !status) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    const newTx = { 
      id: Date.now(), 
      userId: req.user.id, 
      merchant: merchant.trim(), 
      amount: parseFloat(amount), 
      category, 
      status,
      date: new Date().toISOString().split('T')[0] 
    };
    
    db.transactions.unshift(newTx);
    saveDb(); // Persist to file!
    
    console.log(`💸 Transaction added for user ${req.user.id}: ${merchant}`);
    res.json(newTx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
});

// UPDATE: Edit an existing transaction
app.put('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    // Find the exact transaction and ensure it belongs to the logged-in user
    const idx = db.transactions.findIndex(t => t.id == req.params.id && t.userId === req.user.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }

    // Validate incoming data
    if (req.body.amount && (isNaN(req.body.amount) || req.body.amount <= 0)) {
       return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    // Update transaction
    db.transactions[idx] = { ...db.transactions[idx], ...req.body };
    saveDb(); // Persist to file!
    
    console.log(`✏️ Transaction updated: ID ${req.params.id}`);
    res.json(db.transactions[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

// DELETE: Remove a transaction
app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const initialLength = db.transactions.length;
    
    // Filter out the transaction ONLY if it matches the ID and the User ID
    db.transactions = db.transactions.filter(t => !(t.id == req.params.id && t.userId === req.user.id));
    
    if (db.transactions.length === initialLength) {
       return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }

    saveDb(); // Persist to file!
    console.log(`🗑️ Transaction deleted: ID ${req.params.id}`);
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Lumora Backend running on port ${PORT}`);
  console.log(`🌍 Network access enabled (for mobile testing)`);
  console.log(`=========================================`);
});