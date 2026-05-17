// Tests for message formatter utilities

import { formatMarkdown, validateMessage, getPlainTextPreview, hasFormatting, stripMarkdown } from '../utils/messageFormatter.js';

describe('Message Formatter', () => {
  describe('formatMarkdown', () => {
    it('should convert *bold* to <strong>', () => {
      const result = formatMarkdown('*bold text*');
      expect(result).toContain('<strong>bold text</strong>');
    });

    it('should convert _italic_ to <em>', () => {
      const result = formatMarkdown('_italic text_');
      expect(result).toContain('<em>italic text</em>');
    });

    it('should convert ~strikethrough~ to <del>', () => {
      const result = formatMarkdown('~strikethrough~');
      expect(result).toContain('<del>strikethrough</del>');
    });

    it('should convert ```monospace``` to <code>', () => {
      const result = formatMarkdown('```const x = 1```');
      expect(result).toContain('<code>const x = 1</code>');
    });

    it('should handle multiple formatting styles', () => {
      const result = formatMarkdown('*bold* _italic_ ~strike~');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<del>strike</del>');
    });

    it('should escape HTML characters for XSS prevention', () => {
      const result = formatMarkdown('<script>alert("xss")</script>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should handle line breaks', () => {
      const result = formatMarkdown('line1\nline2');
      expect(result).toContain('<br />');
    });

    it('should convert bullet lists', () => {
      const result = formatMarkdown('- item1\n- item2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatMarkdown(null)).toBe('');
      expect(formatMarkdown(undefined)).toBe('');
    });
  });

  describe('validateMessage', () => {
    it('should reject empty messages', () => {
      const result = validateMessage('');
      expect(result.valid).toBe(false);
    });

    it('should reject whitespace-only messages', () => {
      const result = validateMessage('   ');
      expect(result.valid).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(validateMessage(null).valid).toBe(false);
      expect(validateMessage(undefined).valid).toBe(false);
    });

    it('should reject messages over 65,536 characters', () => {
      const longMessage = 'a'.repeat(65537);
      const result = validateMessage(longMessage);
      expect(result.valid).toBe(false);
    });

    it('should accept valid messages', () => {
      const result = validateMessage('Valid message');
      expect(result.valid).toBe(true);
    });

    it('should accept max length messages (65,536 chars)', () => {
      const maxMessage = 'a'.repeat(65536);
      const result = validateMessage(maxMessage);
      expect(result.valid).toBe(true);
    });
  });

  describe('getPlainTextPreview', () => {
    it('should remove formatting from preview', () => {
      const preview = getPlainTextPreview('*bold* _italic_ ~strike~');
      expect(preview).toBe('bold italic strike');
    });

    it('should truncate long messages', () => {
      const longText = 'a'.repeat(150);
      const preview = getPlainTextPreview(longText, 100);
      expect(preview.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(preview.endsWith('...')).toBe(true);
    });

    it('should collapse whitespace', () => {
      const preview = getPlainTextPreview('text   with    spaces');
      expect(preview).toBe('text with spaces');
    });

    it('should convert newlines to spaces', () => {
      const preview = getPlainTextPreview('line1\nline2');
      expect(preview).toContain('line1 line2');
    });

    it('should handle empty strings', () => {
      expect(getPlainTextPreview('')).toBe('');
      expect(getPlainTextPreview(null)).toBe('');
    });
  });

  describe('hasFormatting', () => {
    it('should detect bold formatting', () => {
      expect(hasFormatting('*bold*')).toBe(true);
    });

    it('should detect italic formatting', () => {
      expect(hasFormatting('_italic_')).toBe(true);
    });

    it('should detect strikethrough formatting', () => {
      expect(hasFormatting('~strike~')).toBe(true);
    });

    it('should detect code formatting', () => {
      expect(hasFormatting('```code```')).toBe(true);
    });

    it('should detect bullet list formatting', () => {
      expect(hasFormatting('- item')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(hasFormatting('plain text')).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(hasFormatting(null)).toBe(false);
      expect(hasFormatting(undefined)).toBe(false);
    });
  });

  describe('stripMarkdown', () => {
    it('should remove strong tags', () => {
      const result = stripMarkdown('<strong>bold</strong>');
      expect(result).toBe('bold');
    });

    it('should remove em tags', () => {
      const result = stripMarkdown('<em>italic</em>');
      expect(result).toBe('italic');
    });

    it('should remove del tags', () => {
      const result = stripMarkdown('<del>strike</del>');
      expect(result).toBe('strike');
    });

    it('should remove code tags', () => {
      const result = stripMarkdown('<code>code</code>');
      expect(result).toBe('code');
    });

    it('should convert br tags to newlines', () => {
      const result = stripMarkdown('line1<br />line2');
      expect(result).toContain('line1\nline2');
    });

    it('should handle mixed HTML', () => {
      const result = stripMarkdown('<strong>bold</strong> and <em>italic</em>');
      expect(result).toBe('bold and italic');
    });
  });
});
