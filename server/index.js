require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

//GET
app.get('/', (req, res) => {
    res.send('Hello from the employee-connect server!');
});

app.get('/db-test', async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.send(result.rows[0]);
});

app.get('/me', requireAuth, async (req, res) => {
    const result = await pool.query(
        'SELECT id, username, full_name, role FROM users WHERE id = $1',
        [req.user.userId]
    );
    res.json(result.rows[0]);
});

//LISTEN
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//POST
app.post('/signup', async (req, res) => {
    const { username, password, fullName } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
        'INSERT INTO users (username, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, username, full_name, role',
        [username, passwordHash, fullName]
    );

    res.status(201).json(result.rows[0]);

});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const result = await pool.query(
        'SELECT * FROM users WHERE username = $1', 
        [username]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0]
    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
        return res.status(401).json({error: 'Invalid username or password'});
    }

    const token = jwt.sign(
        {userId: user.id, role: user.role},
        process.env.JWT_SECRET,
        {expiresIn: '8h'}
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,
    });

    res.json({id: user.id, username: user.username, fullName: user.full_name, role: user.role});

});

//FUNCTION
function requireAuth(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({error: 'No Token Provided'});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({error: 'Invalid or Expired Token'})
    }
}