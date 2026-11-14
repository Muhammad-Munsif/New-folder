const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your frontend to talk to backend

const JWT_SECRET = 'lumora_super_secret_key_123';

// --- MOCK DATABASE ---
let users = [];
let transactions = [
    { id: 1, userId: 1, merchant: 'AWS Hosting', category: 'Infrastructure', date: '2025-10-24', amount: 124.50, status: 'paid' },
    { id: 2, userId: 1, merchant: 'Figma Pro', category: 'Software', date: '2025-10-23', amount: 15.00, status: 'paid' }
];

// --- AUTHENTICATION MIDDLEWARE ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, name: newUser.name }, JWT_SECRET);
    res.json({ token, name: newUser.name });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);
    res.json({ token, name: user.name });
});

// --- CRUD ROUTES (Protected) ---
app.get('/api/transactions', authenticateToken, (req, res) => {
    res.json(transactions.filter(t => t.userId === req.user.id));
});

app.post('/api/transactions', authenticateToken, (req, res) => {
    const newTx = {
        id: Date.now(),
        userId: req.user.id,
        ...req.body,
        date: new Date().toISOString().split('T')[0]
    };
    transactions.unshift(newTx);
    res.json(newTx);
});

app.put('/api/transactions/:id', authenticateToken, (req, res) => {
    const idx = transactions.findIndex(t => t.id == req.params.id && t.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    transactions[idx] = { ...transactions[idx], ...req.body };
    res.json(transactions[idx]);
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
    transactions = transactions.filter(t => !(t.id == req.params.id && t.userId === req.user.id));
    res.json({ success: true });
});

// Listen on 0.0.0.0 so local network devices (phones) can connect
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Lumora Backend running on http://localhost:${PORT}`);
    console.log(`📱 To test on mobile, use your computer's IP address (e.g. http://192.168.1.50:${PORT})`);
}); const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your frontend to talk to backend

const JWT_SECRET = 'lumora_super_secret_key_123';

// --- MOCK DATABASE ---
let users = [];
let transactions = [
    { id: 1, userId: 1, merchant: 'AWS Hosting', category: 'Infrastructure', date: '2025-10-24', amount: 124.50, status: 'paid' },
    { id: 2, userId: 1, merchant: 'Figma Pro', category: 'Software', date: '2025-10-23', amount: 15.00, status: 'paid' }
];

// --- AUTHENTICATION MIDDLEWARE ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, name: newUser.name }, JWT_SECRET);
    res.json({ token, name: newUser.name });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);
    res.json({ token, name: user.name });
});

// --- CRUD ROUTES (Protected) ---
app.get('/api/transactions', authenticateToken, (req, res) => {
    res.json(transactions.filter(t => t.userId === req.user.id));
});

app.post('/api/transactions', authenticateToken, (req, res) => {
    const newTx = {
        id: Date.now(),
        userId: req.user.id,
        ...req.body,
        date: new Date().toISOString().split('T')[0]
    };
    transactions.unshift(newTx);
    res.json(newTx);
});

app.put('/api/transactions/:id', authenticateToken, (req, res) => {
    const idx = transactions.findIndex(t => t.id == req.params.id && t.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    transactions[idx] = { ...transactions[idx], ...req.body };
    res.json(transactions[idx]);
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
    transactions = transactions.filter(t => !(t.id == req.params.id && t.userId === req.user.id));
    res.json({ success: true });
});

// Listen on 0.0.0.0 so local network devices (phones) can connect
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Lumora Backend running on http://localhost:${PORT}`);
    console.log(`📱 To test on mobile, use your computer's IP address (e.g. http://192.168.1.50:${PORT})`);
});