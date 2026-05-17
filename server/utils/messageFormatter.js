// Message formatting utilities - markdown to HTML conversion

/**
 * Markdown formatting patterns
 * *bold* -> <strong>bold</strong>
 * _italic_ -> <em>italic</em>
 * ~strikethrough~ -> <del>strikethrough</del>
 * ```monospace``` -> <code>monospace</code>
 * - bullet list -> <ul><li>...
 */

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// Format markdown text to HTML
export const formatMarkdown = (text) => {
  if (!text || typeof text !== 'string') return '';

  let html = escapeHtml(text);

  // Bold: *text* -> <strong>text</strong>
  html = html.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>');

  // Italic: _text_ -> <em>text</em>
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough: ~text~ -> <del>text</del>
  html = html.replace(/~([^~]+)~/g, '<del>$1</del>');

  // Monospace: ```text``` -> <code>text</code>
  html = html.replace(/```([^`]+)```/g, '<code>$1</code>');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  // Bullet list: lines starting with - become <ul><li>
  const lines = html.split('<br />');
  let inList = false;
  const processedLines = lines.map((line) => {
    if (line.trim().startsWith('-')) {
      if (!inList) {
        inList = true;
        return '<ul><li>' + line.replace(/^-\s*/, '') + '</li>';
      }
      return '<li>' + line.replace(/^-\s*/, '') + '</li>';
    }
    if (inList) {
      inList = false;
      return '</ul>' + line;
    }
    return line;
  });

  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('<br />');
};

// Validate message content
export const validateMessage = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content required' };
  }

  if (content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (content.length > 65536) {
    return { valid: false, error: 'Message too long (max 65,536 characters)' };
  }

  return { valid: true };
};

// Get plain text preview (for notifications, etc.)
export const getPlainTextPreview = (text, maxLength = 100) => {
  if (!text) return '';
  
  // Remove formatting
  let preview = text
    .replace(/\*([^\*]+)\*/g, '$1')     // *bold*
    .replace(/_([^_]+)_/g, '$1')         // _italic_
    .replace(/~([^~]+)~/g, '$1')         // ~strike~
    .replace(/```([^`]+)```/g, '$1')     // ```code```
    .replace(/\n/g, ' ')                 // newlines to spaces
    .replace(/\s+/g, ' ')                // collapse whitespace
    .trim();
  
  if (preview.length > maxLength) {
    return preview.substring(0, maxLength) + '...';
  }
  
  return preview;
};

// Check if text has formatting
export const hasFormatting = (text) => {
  if (!text) return false;
  return /(\*.*\*|_.*_|~.*~|```.*```|-\s)/.test(text);
};

// Convert markdown to plain text
export const stripMarkdown = (html) => {
  if (!html) return '';
  
  return html
    .replace(/<strong>([^<]+)<\/strong>/g, '$1')
    .replace(/<em>([^<]+)<\/em>/g, '$1')
    .replace(/<del>([^<]+)<\/del>/g, '$1')
    .replace(/<code>([^<]+)<\/code>/g, '$1')
    .replace(/<br \/>/g, '\n')
    .replace(/<\/?ul>/g, '')
    .replace(/<\/?li>/g, '\n')
    .trim();
};

export default {
  formatMarkdown,
  validateMessage,
  getPlainTextPreview,
  hasFormatting,
  stripMarkdown,
};
