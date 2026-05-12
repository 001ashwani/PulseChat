# PulseChat Security Guide

## Overview
This document outlines security best practices for PulseChat.

## Authentication & Authorization

### Password Security
- Passwords require minimum 8 characters
- Must contain: uppercase, lowercase, numbers, and special characters (!@#$%^&*)
- Passwords are hashed using bcryptjs with 12 salt rounds
- Never store or log passwords

### JWT Tokens
- Access tokens expire after 7 days
- Store tokens securely in localStorage or httpOnly cookies
- Always validate token signature on the backend
- Implement refresh token rotation for enhanced security

### Rate Limiting
- **Login attempts**: 5 per 15 minutes per IP
- **Registration**: 3 per hour per IP
- **General API**: 100 requests per 15 minutes per IP
- **Messages**: 1000 per hour per IP

## Transport Security

### HTTPS/TLS
**Production Requirement**: Always use HTTPS
- Obtain SSL/TLS certificate from Let's Encrypt or your provider
- Configure reverse proxy (nginx/Apache) with SSL
- Set HSTS header to enforce HTTPS

### CORS
- Only allow requests from trusted client URLs
- Set in `CLIENT_URL` environment variable
- Credentials required for cross-origin requests

## Input Validation & Sanitization

### Email Validation
- Valid email format required
- Normalized to lowercase
- Uniqueness enforced at database level

### Name Field
- Minimum 2 characters
- Maximum 50 characters
- Trimmed of whitespace
- No special character restrictions (allows international characters)

### Message Content
- Minimum 1 character
- Maximum 5000 characters
- Trimmed of whitespace
- HTML content sanitized to prevent XSS attacks

## Database Security

### MongoDB Best Practices
- Use MongoDB Atlas with IP whitelisting
- Enable authentication with strong passwords
- Use network access controls
- Enable encryption at rest (Atlas feature)
- Regular backups (daily recommended)
- Monitor unusual connection patterns

### Indexes
Indexes created for performance:
- `User.email` - Unique index for lookups
- `User.isOnline` + `User.lastSeen` - For presence queries
- `Message.conversationId` - For message retrieval
- `Conversation.participants` - For user's conversations

## Security Headers

### Implemented Headers
All responses include security headers via Helmet.js:

- **X-Content-Type-Options**: nosniff (prevents MIME type sniffing)
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-XSS-Protection**: 1; mode=block (XSS protection)
- **Content-Security-Policy**: Restricts resource loading
- **Strict-Transport-Security**: Enforces HTTPS
- **Referrer-Policy**: Controls referrer information

## Logging & Monitoring

### What to Log
✅ Authentication attempts (successful and failed)
✅ Authorization failures
✅ Rate limit violations
✅ API errors
✅ Database connection issues
✅ Security events

### What NOT to Log
❌ Passwords
❌ JWT tokens
❌ Personal information
❌ Sensitive data

### Log Levels
- **ERROR**: Critical failures (database down, unhandled exceptions)
- **WARN**: Suspicious activity (failed logins, rate limits)
- **INFO**: Normal operations (user registration, login)
- **DEBUG**: Detailed information (use only in development)

## Deployment Checklist

### Before Going Live

- [ ] Generate strong JWT_SECRET (minimum 32 characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] Setup MongoDB Atlas:
  - [ ] Create cluster
  - [ ] Enable authentication
  - [ ] Whitelist production IPs
  - [ ] Enable encryption at rest
  - [ ] Configure backups

- [ ] Configure HTTPS:
  - [ ] Obtain SSL certificate
  - [ ] Configure reverse proxy (nginx/Apache)
  - [ ] Set HSTS header
  - [ ] Redirect HTTP to HTTPS

- [ ] Environment Variables:
  - [ ] NODE_ENV=production
  - [ ] Unique JWT_SECRET
  - [ ] Production MongoDB URI
  - [ ] Production CLIENT_URL
  - [ ] Secure log storage

- [ ] Security Testing:
  - [ ] Test rate limiting
  - [ ] Verify HTTPS enforcement
  - [ ] Test CORS restrictions
  - [ ] Verify security headers
  - [ ] Test password validation
  - [ ] Test input sanitization

- [ ] Monitoring Setup:
  - [ ] Configure error tracking (Sentry)
  - [ ] Setup log aggregation
  - [ ] Configure alerts
  - [ ] Monitor disk space
  - [ ] Monitor memory usage
  - [ ] Monitor database connections

- [ ] Backup Strategy:
  - [ ] Enable automated database backups
  - [ ] Test backup restoration
  - [ ] Document recovery procedure
  - [ ] Store backups securely

## Incident Response

### Security Incident Procedure

1. **Detect**: Monitor logs and alerts
2. **Isolate**: Temporarily disable affected features if necessary
3. **Investigate**: Review logs and collect evidence
4. **Remediate**: Apply fixes and patches
5. **Communicate**: Notify affected users if applicable
6. **Prevent**: Implement changes to prevent recurrence

## Regular Security Tasks

- [ ] Weekly: Review error logs for anomalies
- [ ] Weekly: Check rate limit violations
- [ ] Monthly: Audit database access logs
- [ ] Monthly: Review and update security policies
- [ ] Quarterly: Penetration testing
- [ ] Quarterly: Dependency security audit
- [ ] Annually: Security training for team

## Dependencies & Vulnerabilities

Run regular audits:
```bash
npm audit
npm audit fix
```

Keep dependencies updated:
```bash
npm outdated
npm update
```

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Guide](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
