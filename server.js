const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const { evaluateMessage } = require('./src/aiService');
const adminRoutes = require('./src/routes/admin');
const authRoutes = require('./src/routes/auth'); // New auth routes

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes
// /api/auth houses login and signup (which also handles Drive uploads)
app.use('/api/auth', authRoutes(pool));
// /api houses all legacy admin functions mapping to the new role structure
app.use('/api', adminRoutes(pool, io));

// Open Chat APIs
app.get('/api/chat/messages/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const result = await pool.query(`
            SELECT m.id, m.content, m.created_at as "createdAt", u.username, u.profile_pic_url as "profilePicUrl", m.user_id as "userId", u.role
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.group_id = $1
            ORDER BY m.created_at ASC
            LIMIT 50
        `, [groupId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching messages' });
    }
});

// Socket.io Real-Time Chat & Moderation Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Authenticate user & join group
    socket.on('joinGroup', async ({ userId, groupId }) => {
        const roomId = String(groupId);
        socket.join(roomId);
        socket.userId = userId;
        console.log(`User ${userId} joined group ${roomId}`);

        // Check restriction status on join
        try {
            const userRes = await pool.query(
                'SELECT is_flagged, is_banned, cooldown_until FROM users WHERE id = $1',
                [userId]
            );
            if (userRes.rows.length > 0) {
                const u = userRes.rows[0];
                if (u.is_banned) {
                    socket.emit('userFlagged', { message: 'Your account is permanently locked by administration.' });
                } else if (u.is_flagged) {
                    socket.emit('userFlagged', { message: 'Your account has been flagged for violations. Please contact an admin.' });
                } else if (u.cooldown_until && new Date(u.cooldown_until) > new Date()) {
                    socket.emit('userFlagged', { message: `You are on cooldown until ${new Date(u.cooldown_until).toLocaleTimeString()}.` });
                }
            }
        } catch (err) {
            console.error('Error checking user status:', err);
        }
    });

    socket.on('sendMessage', async ({ userId, groupId, content, username }) => {
        const roomId = String(groupId);
        try {
            // 0. Check restriction before processing
            const userCheck = await pool.query(
                'SELECT is_flagged, is_banned, cooldown_until FROM users WHERE id = $1',
                [userId]
            );
            if (userCheck.rows.length > 0) {
                const u = userCheck.rows[0];
                if (u.is_banned) return socket.emit('userFlagged', { message: 'Your account is permanently locked by administration.' });
                if (u.is_flagged) return socket.emit('userFlagged', { message: 'Your account has been flagged for violations.' });
                if (u.cooldown_until && new Date(u.cooldown_until) > new Date()) {
                    return socket.emit('userFlagged', { message: `You are on cooldown until ${new Date(u.cooldown_until).toLocaleTimeString()}.` });
                }
            }

            // 1. Fetch Boundaries
            const boundariesQuery = await pool.query(
                'SELECT * FROM boundaries WHERE group_id = $1 OR type = \'generic\'',
                [groupId]
            );

            const genericRules = boundariesQuery.rows
                .filter(b => b.type === 'generic')
                .map(b => b.rule_description);

            const topicRules = boundariesQuery.rows
                .filter(b => b.type === 'topic')
                .map(b => b.rule_description);

            // 2. Evaluate with AI Moderation
            const aiResult = await evaluateMessage(content, genericRules, topicRules);

            if (aiResult.status === 'pass') {
                // 3a. Passed: Save & Broadcast to Group
                const insertMsg = await pool.query(
                    'INSERT INTO messages (user_id, group_id, content) VALUES ($1, $2, $3) RETURNING id, created_at',
                    [userId, groupId, content]
                );

                // Fetch real role before broadcasting
                const roleQuery = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
                const senderRole = roleQuery.rows[0]?.role || 'student';

                io.to(roomId).emit('newMessage', {
                    id: insertMsg.rows[0].id,
                    userId,
                    username,
                    groupId,
                    content,
                    createdAt: insertMsg.rows[0].created_at,
                    role: senderRole
                });

            } else {
                // 3b. Blocked
                if (aiResult.severity === 'high') {
                    // Record violation
                    await pool.query(
                        'INSERT INTO violations (user_id, group_id, message_content, reason) VALUES ($1, $2, $3, $4)',
                        [userId, groupId, content, aiResult.reason]
                    );

                    // Increment violation count
                    const updateRes = await pool.query(
                        'UPDATE users SET violation_count = violation_count + 1 WHERE id = $1 RETURNING violation_count',
                        [userId]
                    );
                    const vCount = updateRes.rows[0].violation_count;

                    let timeRemaining = "";
                    let isBanned = false;

                    // Escalating Cooldown Logic based on violation_count
                    // 1, 2, 3 are warnings. Cooldowns start at 4.
                    if (vCount === 4) {
                        await pool.query("UPDATE users SET cooldown_until = NOW() + INTERVAL '10 minutes' WHERE id = $1", [userId]);
                        timeRemaining = "10 minutes";
                    } else if (vCount === 5) {
                        await pool.query("UPDATE users SET cooldown_until = NOW() + INTERVAL '30 minutes' WHERE id = $1", [userId]);
                        timeRemaining = "30 minutes";
                    } else if (vCount === 6) {
                        await pool.query("UPDATE users SET cooldown_until = NOW() + INTERVAL '24 hours' WHERE id = $1", [userId]);
                        timeRemaining = "24 hours";
                    } else if (vCount >= 7) {
                        await pool.query("UPDATE users SET is_banned = true, is_flagged = true WHERE id = $1", [userId]);
                        isBanned = true;
                    }

                    // Notify admin dashboard
                    io.emit('adminUpdate', { type: 'userRestricted', userId, username, vCount });

                    if (isBanned) {
                        socket.emit('userFlagged', {
                            message: 'Due to repeated violations, your account has been permanently banned.'
                        });
                    } else {
                        const baseReason = `${aiResult.reason} (High Severity).`;
                        const penaltyMsg = timeRemaining
                            ? `You have been placed on a ${timeRemaining} cooldown.`
                            : `Warning: Violation ${vCount}/3. A 4th violation will trigger a cooldown.`;

                        socket.emit('messageBlocked', {
                            reason: `${baseReason} ${penaltyMsg}`,
                            violationCount: vCount,
                            severity: aiResult.severity
                        });

                        // Automatically lock their client side input ONLY if they have a cooldown
                        if (timeRemaining) {
                            socket.emit('userFlagged', {
                                message: `You are on cooldown for ${timeRemaining} due to a community guidelines violation.`
                            });
                        }
                    }
                } else {
                    // Low severity (just warn, no cooldown penalty yet)
                    socket.emit('messageBlocked', {
                        reason: aiResult.reason,
                        severity: aiResult.severity
                    });
                }
            }
        } catch (err) {
            console.error('Chat Error:', err);
            socket.emit('messageBlocked', {
                reason: 'Temporary system error. Try again.',
                severity: 'low'
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
