/**
 * Production Log Cleanup Script
 * 
 * This script helps identify console.log statements that should be removed
 * before production deployment.
 * 
 * Usage: node scripts/cleanup-logs.js
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const dirsToScan = [
  'app',
  'components',
  'lib',
];

// File extensions to check
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to find (but NOT remove console.error and console.warn)
const logPatterns = [
  /console\.log\(/g,
  /console\.debug\(/g,
  /console\.info\(/g,
  /console\.table\(/g,
];

let totalFiles = 0;
let filesWithLogs = 0;
let totalLogs = 0;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDirectory(filePath);
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      totalFiles++;
      scanFile(filePath);
    }
  });
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let fileHasLogs = false;
  let logCount = 0;
  
  lines.forEach((line, index) => {
    logPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        if (!fileHasLogs) {
          console.log(`\n📄 ${filePath}`);
          fileHasLogs = true;
          filesWithLogs++;
        }
        console.log(`   Line ${index + 1}: ${line.trim()}`);
        logCount++;
        totalLogs++;
      }
    });
  });
}

console.log('🔍 Scanning for console.log statements...\n');
console.log('=' .repeat(60));

dirsToScan.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    scanDirectory(dirPath);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:');
console.log(`   Total files scanned: ${totalFiles}`);
console.log(`   Files with console.log: ${filesWithLogs}`);
console.log(`   Total console.log statements: ${totalLogs}`);

if (totalLogs > 0) {
  console.log('\n⚠️  Action Required:');
  console.log('   Review and remove debug console.log statements before production.');
  console.log('   Keep console.error and console.warn for error tracking.');
} else {
  console.log('\n✅ No console.log statements found!');
  console.log('   Code is clean for production.');
}

console.log('\n💡 Tip: Use search and replace in your IDE to remove them safely.');
console.log('   Search: console\\.log\\(');
console.log('   Review each match before removing.\n');
