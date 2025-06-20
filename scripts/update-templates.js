#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, '../server/templates');

// Define difficulty levels for each CEFR level
const levelDifficulties = {
  'a1': 1,
  'a2': 2,
  'b1': 3,
  'b2': 4,
  'c1': 5,
  'c2': 5
};

// Define categories for different lesson types
const categories = [
  'basic_phrases',
  'questions',
  'family',
  'colors',
  'numbers',
  'food',
  'weather',
  'transportation',
  'work',
  'school',
  'hobbies',
  'travel',
  'shopping',
  'health',
  'time',
  'directions',
  'emotions',
  'abilities',
  'preferences',
  'daily_routine'
];

async function updateTemplateFile(filename) {
  const filePath = path.join(templatesDir, filename);
  const level = filename.replace('.json', '');
  
  try {
    // Read the original file
    const content = await fs.readFile(filePath, 'utf8');
    const lessons = JSON.parse(content);
    
    // Update each lesson with difficulty and category
    const updatedLessons = lessons.map((lesson, index) => {
      // Assign category based on lesson index (cycling through categories)
      const categoryIndex = index % categories.length;
      const category = categories[categoryIndex];
      
      return {
        ...lesson,
        difficulty: levelDifficulties[level],
        category: category
      };
    });
    
    // Write the updated file
    await fs.writeFile(filePath, JSON.stringify(updatedLessons, null, 2));
    console.log(`✅ Updated ${filename} with ${updatedLessons.length} lessons`);
    
  } catch (error) {
    console.error(`❌ Error updating ${filename}:`, error.message);
  }
}

async function updateAllTemplates() {
  try {
    const files = await fs.readdir(templatesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} template files to update...`);
    
    for (const file of jsonFiles) {
      await updateTemplateFile(file);
    }
    
    console.log('🎉 All template files updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating templates:', error);
  }
}

// Run the update
updateAllTemplates(); 