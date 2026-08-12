const fs = require('fs');
const path = require('path');

const targets = ['node_modules', '.next', 'dist'];

function cleanDir(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (targets.includes(entry.name)) {
          console.log(`Deleting: ${fullPath}`);
          try {
            fs.rmSync(fullPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
          } catch (e) {
            console.error(`Failed to delete ${fullPath}:`, e.message);
          }
        } else {
          // Don't traverse into targets we are already deleting, nor .git
          if (entry.name !== '.git') {
            cleanDir(fullPath);
          }
        }
      }
    }
  } catch (err) {
    // Ignore access errors on system folders
  }
}

console.log('Starting cleanup...');
cleanDir(__dirname);
console.log('Cleanup complete.');
