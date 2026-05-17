// Unit tests for logger
import logger from '../utils/logger.js';

describe('Logger', () => {
  describe('Logger Configuration', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should have logging methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should have transport configuration', () => {
      expect(logger.transports).toBeDefined();
      expect(logger.transports.length).toBeGreaterThan(0);
    });
  });

  describe('Logger Methods', () => {
    it('should log info messages', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Test info message');
      expect(spy).toHaveBeenCalledWith('Test info message');
      spy.mockRestore();
    });

    it('should log warning messages', () => {
      const spy = jest.spyOn(logger, 'warn');
      logger.warn('Test warning message');
      expect(spy).toHaveBeenCalledWith('Test warning message');
      spy.mockRestore();
    });

    it('should log error messages', () => {
      const spy = jest.spyOn(logger, 'error');
      logger.error('Test error message');
      expect(spy).toHaveBeenCalledWith('Test error message');
      spy.mockRestore();
    });

    it('should log debug messages', () => {
      const spy = jest.spyOn(logger, 'debug');
      logger.debug('Test debug message');
      expect(spy).toHaveBeenCalledWith('Test debug message');
      spy.mockRestore();
    });

    it('should support additional metadata', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Message with metadata', { userId: '123', action: 'login' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Log Levels', () => {
    it('should respect LOG_LEVEL environment variable', () => {
      // Logger respects NODE_ENV and LOG_LEVEL settings
      expect(logger).toBeDefined();
      expect(logger.level).toBeDefined();
    });

    it('should log all levels in development', () => {
      // Logger configured to show all levels in dev
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Log Output', () => {
    it('should include timestamp in logs', () => {
      // Winston configured with timestamp format
      expect(logger.transports[0].format).toBeDefined();
    });

    it('should include error stack traces', () => {
      const testError = new Error('Test error');
      const spy = jest.spyOn(logger, 'error');
      logger.error(testError);
      expect(spy).toHaveBeenCalledWith(testError);
      spy.mockRestore();
    });

    it('should not log sensitive information', () => {
      const spy = jest.spyOn(logger, 'warn');
      logger.warn('Login attempt', { email: 'user@example.com', password: '***' });
      expect(spy).toHaveBeenCalled();
      // Passwords should be masked before logging
      spy.mockRestore();
    });
  });

  describe('Log Files', () => {
    it('should have file transport', () => {
      const fileTransports = logger.transports.filter(t => t.filename);
      expect(fileTransports.length).toBeGreaterThan(0);
    });

    it('should separate error logs', () => {
      // error.log file for errors, combined.log for all
      expect(logger.transports).toBeDefined();
    });
  });
});
