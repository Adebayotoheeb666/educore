const LOG_LEVEL = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const isDevelopment = process.env.NODE_ENV === 'development';

const getTimestamp = () => new Date().toISOString();

const formatLog = (level, message, data = {}) => {
  return {
    timestamp: getTimestamp(),
    level,
    message,
    ...data
  };
};

const clientLogger = {
  error: (message, error = null, context = {}) => {
    const logData = formatLog(LOG_LEVEL.ERROR, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined
      } : undefined
    });
    
    console.error(`[${logData.timestamp}] ERROR:`, message, logData);
    
    if (isDevelopment) {
      console.error(error);
    }
  },

  warn: (message, context = {}) => {
    const logData = formatLog(LOG_LEVEL.WARN, message, context);
    console.warn(`[${logData.timestamp}] WARN:`, message, logData);
  },

  info: (message, context = {}) => {
    const logData = formatLog(LOG_LEVEL.INFO, message, context);
    if (isDevelopment) {
      console.log(`[${logData.timestamp}] INFO:`, message, logData);
    }
  },

  debug: (message, context = {}) => {
    if (isDevelopment) {
      const logData = formatLog(LOG_LEVEL.DEBUG, message, context);
      console.debug(`[${logData.timestamp}] DEBUG:`, message, logData);
    }
  },

  apiCall: (method, url, status, duration) => {
    const logData = formatLog(LOG_LEVEL.INFO, `${method} ${url}`, {
      status,
      durationMs: duration,
      timestamp: getTimestamp()
    });
    
    if (isDevelopment) {
      console.log(`[API] ${method} ${url} - ${status}ms`);
    }
  }
};

export default clientLogger;
