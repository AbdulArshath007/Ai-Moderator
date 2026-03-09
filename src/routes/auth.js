const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { uploadFileToDrive } = require('../googleDrive');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory to pipe directly to Google Drive

module.exports = (pool) => {
    // Signup Route
    router.post('/signup', upload.single('profilePic'), async (req, res) => {
        try {
            const { username, password, name, role, department } = req.body;

            // Map 'teacher' from UI to 'admin' in DB
            const finalRole = role === 'teacher' ? 'admin' : 'student';

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            let profilePicUrl = null;
            if (req.file) {
                try {
                    profilePicUrl = await uploadFileToDrive(req.file);
                } catch (uploadObj) {
                    console.warn("Drive upload failed (quota likely exceeded). Using placeholder. Error: ", uploadObj.message);
                    profilePicUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
                }
            } else {
                profilePicUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
            }

            const result = await pool.query(
                `INSERT INTO users (username, password, role, name, department, profile_pic_url) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role, name, profile_pic_url`,
                [username, passwordHash, finalRole, name, finalRole === 'student' ? department : null, profilePicUrl]
            );

            res.status(201).json({ success: true, user: result.rows[0] });
        } catch (err) {
            console.error('Signup Error:', err);
            // Quick check for unique constraint violation
            if (err.code === '23505') {
                return res.status(400).json({ error: 'Username already taken.' });
            }
            res.status(500).json({ error: 'Failed to create account.' });
        }
    });

    // Login Route
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

            if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

            const user = result.rows[0];
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

            // Check if permanently banned
            if (user.is_banned) {
                return res.status(403).json({ error: 'Account is permanently banned by an administrator.' });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    profile_pic_url: user.profile_pic_url
                }
            });
        } catch (err) {
            console.error('Login Error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
