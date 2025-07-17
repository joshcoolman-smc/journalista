// Simple debug logger for GitHub sync issues
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'debug.log');

// Clear previous logs
fs.writeFileSync(logFile, `=== Debug Session Started: ${new Date().toISOString()} ===\n`);

// Override console methods to also write to file
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function writeToLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  const logEntry = `[${timestamp}] ${level}: ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
}

console.log = function(...args) {
  writeToLog('LOG', ...args);
  originalLog.apply(console, args);
};

console.error = function(...args) {
  writeToLog('ERROR', ...args);
  originalError.apply(console, args);
};

console.warn = function(...args) {
  writeToLog('WARN', ...args);
  originalWarn.apply(console, args);
};

console.log('Debug logging initialized - writing to debug.log');