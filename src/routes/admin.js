const express = require('express');
const router = express.Router();

module.exports = (pool, io) => {

    // ========================
    // DASHBOARD STATS
    // ========================

    router.get('/admin/stats', async (req, res) => {
        try {
            const [users, messages, violations, restricted, groups] = await Promise.all([
                pool.query('SELECT COUNT(*) FROM users'),
                pool.query('SELECT COUNT(*) FROM messages'),
                pool.query('SELECT COUNT(*) FROM violations'),
                pool.query('SELECT COUNT(*) FROM users WHERE is_banned = true OR cooldown_until > NOW() OR is_flagged = true'),
                pool.query('SELECT COUNT(*) FROM learning_groups'),
            ]);
            res.json({
                totalUsers: parseInt(users.rows[0].count),
                totalMessages: parseInt(messages.rows[0].count),
                totalViolations: parseInt(violations.rows[0].count),
                flaggedUsers: parseInt(restricted.rows[0].count),
                totalGroups: parseInt(groups.rows[0].count),
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ========================
    // RESTRICTED USERS (Flagged/Banned/Cooldowns)
    // ========================

    router.get('/admin/flagged-users', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT u.id, u.username, u.name, u.role, u.profile_pic_url, u.violation_count, u.is_flagged, u.is_banned, u.cooldown_until,
                       (SELECT v.reason FROM violations v WHERE v.user_id = u.id ORDER BY v.created_at DESC LIMIT 1) as last_reason,
                       (SELECT v.created_at FROM violations v WHERE v.user_id = u.id ORDER BY v.created_at DESC LIMIT 1) as last_violation_at
                FROM users u
                WHERE u.is_banned = true OR u.cooldown_until > NOW() OR u.is_flagged = true OR u.violation_count > 0
                ORDER BY u.violation_count DESC
            `);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Relieve user (Clear cooldowns, bans, flags, and resets info)
    router.post('/admin/relieve/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
            await pool.query('UPDATE users SET is_flagged = false, is_banned = false, cooldown_until = NULL, violation_count = 0 WHERE id = $1', [userId]);
            if (io) io.emit('adminUpdate', { type: 'userRelieved', userId: parseInt(userId) });
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Ban user Permanently
    router.post('/admin/ban/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
            await pool.query('UPDATE users SET is_banned = true, is_flagged = true WHERE id = $1', [userId]);
            if (io) io.emit('adminUpdate', { type: 'userBanned', userId: parseInt(userId) });
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ========================
    // VIOLATIONS LOG
    // ========================

    router.get('/admin/violations', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT v.*, u.username 
                FROM violations v 
                JOIN users u ON v.user_id = u.id 
                ORDER BY v.created_at DESC 
                LIMIT 50
            `);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ========================
    // GROUPS MANAGEMENT
    // ========================

    router.get('/groups', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM learning_groups ORDER BY id');
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    router.post('/groups', async (req, res) => {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Group name is required' });
        try {
            const result = await pool.query(
                'INSERT INTO learning_groups (name, description) VALUES ($1, $2) RETURNING *',
                [name, description || '']
            );
            if (io) io.emit('adminUpdate', { type: 'groupCreated', group: result.rows[0] });
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    router.delete('/groups/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM learning_groups WHERE id = $1', [id]);
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ========================
    // USERS MANAGEMENT
    // ========================

    router.get('/users', async (req, res) => {
        try {
            const result = await pool.query('SELECT id, username, name, role, is_flagged, violation_count, is_banned, cooldown_until FROM users ORDER BY id');
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // ========================
    // BOUNDARIES
    // ========================

    router.get('/boundaries', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT b.*, lg.name as group_name 
                FROM boundaries b 
                LEFT JOIN learning_groups lg ON b.group_id = lg.id
            `);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    router.post('/boundaries', async (req, res) => {
        const { type, group_id, rule_description } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO boundaries (type, group_id, rule_description) VALUES ($1, $2, $3) RETURNING *',
                [type, group_id || null, rule_description]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    router.delete('/boundaries/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM boundaries WHERE id = $1', [id]);
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};
