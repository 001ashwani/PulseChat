// Tests for message validator utilities

import {
  canEditMessage,
  canDeleteForEveryone,
  canDeleteForSelf,
  canReactToMessage,
  canReplyToMessage,
  canForwardMessage,
  validateEmoji,
  validateForwardTargets,
  getMessagePermissions,
} from '../utils/messageValidator.js';

describe('Message Validator', () => {
  const userId = 'user123';
  const otherUserId = 'user456';

  describe('canEditMessage', () => {
    it('should allow editing own message within 15 minutes', () => {
      const message = {
        senderId: userId,
        createdAt: new Date(),
        deletedForEveryone: false,
        deletedAt: null,
      };
      const result = canEditMessage(message, userId);
      expect(result.allowed).toBe(true);
    });

    it('should reject editing others messages', () => {
      const message = {
        senderId: otherUserId,
        createdAt: new Date(),
        deletedForEveryone: false,
      };
      const result = canEditMessage(message, userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('your own messages');
    });

    it('should reject editing after 15 minutes', () => {
      const sixteenMinutesAgo = new Date(Date.now() - 16 * 60 * 1000);
      const message = {
        senderId: userId,
        createdAt: sixteenMinutesAgo,
        deletedForEveryone: false,
      };
      const result = canEditMessage(message, userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Edit window closed');
    });

    it('should reject editing deleted messages', () => {
      const message = {
        senderId: userId,
        createdAt: new Date(),
        deletedForEveryone: true,
      };
      const result = canEditMessage(message, userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('deleted');
    });
  });

  describe('canDeleteForEveryone', () => {
    it('should allow deleting own message within 60 hours', () => {
      const message = {
        senderId: userId,
        createdAt: new Date(),
        deletedForEveryone: false,
      };
      const result = canDeleteForEveryone(message, userId);
      expect(result.allowed).toBe(true);
    });

    it('should reject deleting others messages', () => {
      const message = {
        senderId: otherUserId,
        createdAt: new Date(),
        deletedForEveryone: false,
      };
      const result = canDeleteForEveryone(message, userId);
      expect(result.allowed).toBe(false);
    });

    it('should reject deleting after 60 hours', () => {
      const sixtyOneHoursAgo = new Date(Date.now() - 61 * 60 * 60 * 1000);
      const message = {
        senderId: userId,
        createdAt: sixtyOneHoursAgo,
        deletedForEveryone: false,
      };
      const result = canDeleteForEveryone(message, userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Delete window closed');
    });

    it('should reject deleting already deleted messages', () => {
      const message = {
        senderId: userId,
        createdAt: new Date(),
        deletedForEveryone: true,
      };
      const result = canDeleteForEveryone(message, userId);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canDeleteForSelf', () => {
    it('should allow deleting for self', () => {
      const message = {
        deletedFor: [],
      };
      const result = canDeleteForSelf(message, userId);
      expect(result.allowed).toBe(true);
    });

    it('should reject if already deleted for user', () => {
      const message = {
        deletedFor: [userId],
      };
      const result = canDeleteForSelf(message, userId);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canReactToMessage', () => {
    it('should allow reacting to active messages', () => {
      const message = {
        deletedForEveryone: false,
        deletedAt: null,
      };
      const result = canReactToMessage(message, userId);
      expect(result.allowed).toBe(true);
    });

    it('should reject reacting to deleted messages', () => {
      const message = {
        deletedForEveryone: true,
      };
      const result = canReactToMessage(message, userId);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canReplyToMessage', () => {
    it('should allow replying to active messages', () => {
      const message = {
        deletedForEveryone: false,
        deletedAt: null,
      };
      const result = canReplyToMessage(message, userId);
      expect(result.allowed).toBe(true);
    });

    it('should reject replying to deleted messages', () => {
      const message = {
        deletedForEveryone: true,
      };
      const result = canReplyToMessage(message, userId);
      expect(result.allowed).toBe(false);
    });
  });

  describe('canForwardMessage', () => {
    it('should allow forwarding active messages', () => {
      const message = {
        deletedForEveryone: false,
        deletedAt: null,
      };
      const result = canForwardMessage(message, userId);
      expect(result.allowed).toBe(true);
    });

    it('should reject forwarding deleted messages', () => {
      const message = {
        deletedForEveryone: true,
      };
      const result = canForwardMessage(message, userId);
      expect(result.allowed).toBe(false);
    });
  });

  describe('validateEmoji', () => {
    it('should accept valid emojis', () => {
      expect(validateEmoji('👍').valid).toBe(true);
      expect(validateEmoji('❤️').valid).toBe(true);
      expect(validateEmoji('😀').valid).toBe(true);
    });

    it('should reject invalid emojis', () => {
      expect(validateEmoji('not-emoji').valid).toBe(false);
      expect(validateEmoji('').valid).toBe(false);
      expect(validateEmoji(null).valid).toBe(false);
    });

    it('should reject overly long emoji strings', () => {
      expect(validateEmoji('👍👍👍👍👍').valid).toBe(false);
    });
  });

  describe('validateForwardTargets', () => {
    it('should accept valid forward targets', () => {
      const result = validateForwardTargets(['conv1', 'conv2']);
      expect(result.valid).toBe(true);
    });

    it('should reject non-array targets', () => {
      const result = validateForwardTargets('conv1');
      expect(result.valid).toBe(false);
    });

    it('should reject empty target list', () => {
      const result = validateForwardTargets([]);
      expect(result.valid).toBe(false);
    });

    it('should reject more than 5 targets', () => {
      const result = validateForwardTargets(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Maximum 5');
    });

    it('should accept exactly 5 targets', () => {
      const result = validateForwardTargets(['c1', 'c2', 'c3', 'c4', 'c5']);
      expect(result.valid).toBe(true);
    });
  });

  describe('getMessagePermissions', () => {
    it('should grant full permissions to message sender', () => {
      const message = {
        senderId: userId,
        deletedForEveryone: false,
        deletedFor: [],
      };
      const perms = getMessagePermissions(message, userId, false);
      expect(perms.canEdit).toBe(true);
      expect(perms.canDeleteForEveryone).toBe(true);
      expect(perms.canDeleteForSelf).toBe(true);
      expect(perms.canReact).toBe(true);
    });

    it('should deny edit permission to non-sender', () => {
      const message = {
        senderId: otherUserId,
        deletedForEveryone: false,
        deletedFor: [],
      };
      const perms = getMessagePermissions(message, userId, false);
      expect(perms.canEdit).toBe(false);
      expect(perms.canDeleteForEveryone).toBe(false);
    });

    it('should deny all write permissions for deleted messages', () => {
      const message = {
        senderId: userId,
        deletedForEveryone: true,
        deletedFor: [],
      };
      const perms = getMessagePermissions(message, userId, false);
      expect(perms.canEdit).toBe(false);
      expect(perms.canReact).toBe(false);
      expect(perms.canReply).toBe(false);
    });

    it('should allow copy and star for all users', () => {
      const message = {
        senderId: otherUserId,
        deletedForEveryone: false,
        deletedFor: [],
      };
      const perms = getMessagePermissions(message, userId, false);
      expect(perms.canCopy).toBe(true);
      expect(perms.canStar).toBe(true);
    });
  });
});
