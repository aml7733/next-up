// Lightweight logger with selective suppression of expected negative-path errors in tests.
// Use logger.errorExpected for errors that are part of intentionally tested failure flows.
// Regular logger.error always prints (even in tests) so unexpected issues are visible.

const isTest = process.env.NODE_ENV === 'test';

function fmt(level: string, args: any[]) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level}]`, ...args];
}

export const logger = {
  info: (...args: any[]) => console.log(...fmt('INFO', args)),
  warn: (...args: any[]) => console.warn(...fmt('WARN', args)),
  // Always emit
  error: (...args: any[]) => console.error(...fmt('ERROR', args)),
  // Swallow in tests only (expected negative path)
  errorExpected: (...args: any[]) => {
    if (isTest) return;
    console.error(...fmt('ERROR', args));
  },
};

export default logger;
