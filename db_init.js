const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const initSql = `
-- Drop existing tables to establish the new unified schema cleanly
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS violations CASCADE;
DROP TABLE IF EXISTS boundaries CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS learning_groups CASCADE;

-- Unified Users Table (Students & Teachers/Admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student', -- 'student' or 'admin'
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    profile_pic_url TEXT,
    
    -- Moderation columns
    is_flagged BOOLEAN DEFAULT false,
    violation_count INTEGER DEFAULT 0,
    cooldown_until TIMESTAMP,
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Groups Table
CREATE TABLE learning_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moderation Boundaries (Rules) Table
CREATE TABLE boundaries (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'generic' or 'topic'
    group_id INTEGER REFERENCES learning_groups(id) ON DELETE CASCADE NULL,
    rule_description TEXT NOT NULL
);

-- Messages Table 
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES learning_groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Violations Table
CREATE TABLE violations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES learning_groups(id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed learning group
INSERT INTO learning_groups (name, description) VALUES 
('Full Stack Java', 'A group for learning full stack Java development.');

-- Seed Boundaries
INSERT INTO boundaries (type, group_id, rule_description) VALUES
('generic', NULL, 'No toxic behavior, hate speech, or harassment.'),
('generic', NULL, 'No spamming or repetitive irrelevant messages.'),
('topic', 1, 'Messages should be related to Java, Web Development, or SQL. General conversation is allowed.');

`;

async function initDB() {
    try {
        console.log('Connecting to database...');
        // Run schema updates
        await pool.query(initSql);
        console.log('Database tables initialized.');

        // Seed a default admin/teacher user
        const adminHash = await bcrypt.hash('admin123', 10);
        await pool.query(
            `INSERT INTO users (username, password, role, name, department, profile_pic_url) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             ON CONFLICT (username) DO NOTHING`,
            ['admin', adminHash, 'admin', 'System Administrator', 'IT', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin']
        );
        console.log('Admin user seeded (admin / admin123).');

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await pool.end();
    }
}

initDB();
