#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json to get current version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// Read service worker file
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Update the cache version
const versionRegex = /const CACHE_VERSION = '([^']+)';/;
const newVersion = `const CACHE_VERSION = '${currentVersion}';`;

if (versionRegex.test(swContent)) {
  swContent = swContent.replace(versionRegex, newVersion);
  fs.writeFileSync(swPath, swContent);
  console.log(`✅ Updated service worker cache version to ${currentVersion}`);
} else {
  console.error('❌ Could not find CACHE_VERSION in service worker');
  process.exit(1);
}

// Also update the precache list with new revision
const precacheRegex = /workbox\.precaching\.precacheAndRoute\(\[([\s\S]*?)\]\);/;
const precacheMatch = swContent.match(precacheRegex);

if (precacheMatch) {
  const precacheContent = precacheMatch[1];
  const updatedPrecache = precacheContent.replace(
    /revision: '[^']+'/g,
    `revision: '${currentVersion}'`
  );
  
  swContent = swContent.replace(precacheRegex, 
    `workbox.precaching.precacheAndRoute([${updatedPrecache}]);`
  );
  
  fs.writeFileSync(swPath, swContent);
  console.log(`✅ Updated precache revisions to ${currentVersion}`);
}

console.log('🎉 Cache version update complete!'); 