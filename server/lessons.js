import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEVEL_ORDER = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

// Load lessons from template file
export async function loadLessons(level) {
  try {
    const templatePath = path.join(__dirname, 'templates', `${level}.json`);
    const data = await fs.readFile(templatePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading lessons for level ${level}:`, error);
    return [];
  }
}

// Get a random lesson that hasn't been completed
export async function getRandomLesson(level, completedLessonIds) {
  const lessons = await loadLessons(level);
  const remaining = lessons.filter(lesson => !completedLessonIds.includes(lesson.id));
  
  if (remaining.length === 0) {
    return null; // All lessons completed for this level
  }
  
  return remaining[Math.floor(Math.random() * remaining.length)];
}

// Count total lessons for a level
export async function countTotalLessons(level) {
  const lessons = await loadLessons(level);
  return lessons.length;
}

// Get lesson by ID
export async function getLessonById(level, lessonId) {
  const lessons = await loadLessons(level);
  return lessons.find(lesson => lesson.id === lessonId);
}

// Get next level in progression
export function getNextLevel(currentLevel) {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel.toLowerCase());
  if (currentIndex === -1 || currentIndex >= LEVEL_ORDER.length - 1) {
    return null; // No next level
  }
  return LEVEL_ORDER[currentIndex + 1];
}

// Get previous level
export function getPreviousLevel(currentLevel) {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel.toLowerCase());
  if (currentIndex <= 0) {
    return null; // No previous level
  }
  return LEVEL_ORDER[currentIndex - 1];
}

// Validate level
export function isValidLevel(level) {
  return LEVEL_ORDER.includes(level.toLowerCase());
}

// Get all available levels
export function getAvailableLevels() {
  return LEVEL_ORDER;
}

// Get lesson statistics
export async function getLessonStats(level) {
  const lessons = await loadLessons(level);
  const categories = {};
  
  lessons.forEach(lesson => {
    if (!categories[lesson.category]) {
      categories[lesson.category] = 0;
    }
    categories[lesson.category]++;
  });
  
  return {
    total: lessons.length,
    categories,
    difficulties: {
      1: lessons.filter(l => l.difficulty === 1).length,
      2: lessons.filter(l => l.difficulty === 2).length,
      3: lessons.filter(l => l.difficulty === 3).length,
      4: lessons.filter(l => l.difficulty === 4).length,
      5: lessons.filter(l => l.difficulty === 5).length
    }
  };
} 