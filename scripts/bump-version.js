#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the service worker file
const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Extract current version
const versionMatch = swContent.match(/const CACHE_VERSION = '([^']+)'/);
if (!versionMatch) {
  console.error('Could not find CACHE_VERSION in service worker');
  process.exit(1);
}

const currentVersion = versionMatch[1];
console.log(`Current version: ${currentVersion}`);

// Parse version (assuming format v1.2.3)
const versionParts = currentVersion.substring(1).split('.').map(Number);
versionParts[2]++; // Increment patch version

const newVersion = `v${versionParts.join('.')}`;
console.log(`New version: ${newVersion}`);

// Replace version in service worker
swContent = swContent.replace(
  /const CACHE_VERSION = '[^']+'/,
  `const CACHE_VERSION = '${newVersion}'`
);

// Write back to file
fs.writeFileSync(swPath, swContent);
console.log(`✅ Updated service worker version to ${newVersion}`);

// Also update package.json version if it exists
const packagePath = path.join(__dirname, '../package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = newVersion.substring(1); // Remove 'v' prefix
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated package.json version to ${packageJson.version}`);
} 