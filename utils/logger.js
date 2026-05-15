const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const logToFile = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const logFile = path.join(LOG_DIR, `${level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`);
  const logEntry = JSON.stringify({ timestamp, level, message, ...meta }, null, 2);
  fs.appendFileSync(logFile, logEntry + '\n\n');
};

const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${getTimestamp()}: ${message}`, meta);
    logToFile('INFO', message, meta);
  },
  
  error: (message, error = null, meta = {}) => {
    const errorDetails = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : {};
    console.error(`[ERROR] ${getTimestamp()}: ${message}`, { ...meta, ...errorDetails });
    logToFile('ERROR', message, { ...meta, ...errorDetails });
  },
  
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${getTimestamp()}: ${message}`, meta);
    logToFile('WARN', message, meta);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[DEBUG] ${getTimestamp()}: ${message}`, meta);
      logToFile('DEBUG', message, meta);
    }
  },
};

module.exports = logger;
