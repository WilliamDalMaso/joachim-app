import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'listening_bot.db');

// Initialize database
export async function initDb() {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT,
      level TEXT,
      lesson_id TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_answer TEXT,
      accuracy_score REAL,
      PRIMARY KEY (user_id, lesson_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS finished_levels (
      user_id TEXT,
      level TEXT,
      finished_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, level)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      user_id TEXT,
      session_id TEXT,
      level TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      lessons_completed INTEGER DEFAULT 0,
      PRIMARY KEY (session_id)
    )
  `);

  await db.close();
  console.log('✅ Database initialized');
}

// Save or update user
export async function saveUser(userId, username = '') {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.run(`
    INSERT INTO users (user_id, username, last_seen)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      username = excluded.username,
      last_seen = CURRENT_TIMESTAMP
  `, [userId, username]);

  await db.close();
}

// Save lesson progress
export async function saveProgress(userId, level, lessonId, userAnswer = '', accuracyScore = null) {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.run(`
    INSERT OR REPLACE INTO progress (user_id, level, lesson_id, user_answer, accuracy_score, completed_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [userId, level, lessonId, userAnswer, accuracyScore]);

  await db.close();
}

// Get completed lessons for a user and level
export async function getDoneLessons(userId, level) {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  const rows = await db.all(`
    SELECT lesson_id FROM progress
    WHERE user_id = ? AND level = ?
  `, [userId, level]);

  await db.close();
  return rows.map(row => row.lesson_id);
}

// Mark level as finished
export async function markLevelFinished(userId, level) {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.run(`
    INSERT OR IGNORE INTO finished_levels (user_id, level)
    VALUES (?, ?)
  `, [userId, level]);

  await db.close();
}

// Check if level is finished
export async function levelIsFinished(userId, level) {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  const row = await db.get(`
    SELECT 1 FROM finished_levels
    WHERE user_id = ? AND level = ?
    LIMIT 1
  `, [userId, level]);

  await db.close();
  return row !== undefined;
}

// Get user progress summary
export async function getUserProgress(userId) {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  const progress = await db.all(`
    SELECT 
      level,
      COUNT(*) as completed_lessons,
      AVG(accuracy_score) as avg_accuracy
    FROM progress 
    WHERE user_id = ?
    GROUP BY level
  `, [userId]);

  const finishedLevels = await db.all(`
    SELECT level FROM finished_levels
    WHERE user_id = ?
  `, [userId]);

  await db.close();

  return {
    progress: progress.map(p => ({
      level: p.level,
      completedLessons: p.completed_lessons,
      avgAccuracy: p.avg_accuracy
    })),
    finishedLevels: finishedLevels.map(f => f.level)
  };
}

// Create or update user session
export async function saveUserSession(userId, sessionId, level) {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.run(`
    INSERT OR REPLACE INTO user_sessions (user_id, session_id, level, started_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `, [userId, sessionId, level]);

  await db.close();
}

// Update session with completion count
export async function updateSessionProgress(sessionId, lessonsCompleted) {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.run(`
    UPDATE user_sessions 
    SET lessons_completed = ?
    WHERE session_id = ?
  `, [lessonsCompleted, sessionId]);

  await db.close();
}

// End user session
export async function endUserSession(sessionId) {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.run(`
    UPDATE user_sessions 
    SET ended_at = CURRENT_TIMESTAMP
    WHERE session_id = ?
  `, [sessionId]);

  await db.close();
} 