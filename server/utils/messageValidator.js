// Message validation utilities

/**
 * Validate if a message can be edited
 * Edit window: 15 minutes after creation
 */
export const canEditMessage = (message, userId) => {
  // Must be the sender
  if (message.senderId.toString() !== userId.toString()) {
    return { allowed: false, reason: 'Can only edit your own messages' };
  }

  // Cannot edit deleted messages
  if (message.deletedForEveryone || message.deletedAt) {
    return { allowed: false, reason: 'Cannot edit deleted messages' };
  }

  // Check 15-minute window
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (message.createdAt < fifteenMinutesAgo) {
    return { allowed: false, reason: 'Edit window closed (15 minutes)' };
  }

  return { allowed: true };
};

/**
 * Validate if a message can be deleted for everyone
 * Delete window: 60 hours after creation
 */
export const canDeleteForEveryone = (message, userId) => {
  // Must be the sender
  if (message.senderId.toString() !== userId.toString()) {
    return { allowed: false, reason: 'Can only delete your own messages' };
  }

  // Already deleted
  if (message.deletedForEveryone) {
    return { allowed: false, reason: 'Message already deleted for everyone' };
  }

  // Check 60-hour window
  const sixtyHoursAgo = new Date(Date.now() - 60 * 60 * 60 * 1000);
  if (message.createdAt < sixtyHoursAgo) {
    return { allowed: false, reason: 'Delete window closed (60 hours)' };
  }

  return { allowed: true };
};

/**
 * Validate if a message can be deleted for user
 * Can always delete for self
 */
export const canDeleteForSelf = (message, userId) => {
  // Check if already deleted for user
  if (message.deletedFor.some(id => id.toString() === userId.toString())) {
    return { allowed: false, reason: 'Already deleted for you' };
  }

  return { allowed: true };
};

/**
 * Validate if a user can react to a message
 */
export const canReactToMessage = (message, userId) => {
  // Cannot react to deleted messages
  if (message.deletedForEveryone || message.deletedAt) {
    return { allowed: false, reason: 'Cannot react to deleted messages' };
  }

  return { allowed: true };
};

/**
 * Validate if a message can be replied to
 */
export const canReplyToMessage = (message, userId) => {
  // Cannot reply to deleted messages
  if (message.deletedForEveryone || message.deletedAt) {
    return { allowed: false, reason: 'Cannot reply to deleted messages' };
  }

  return { allowed: true };
};

/**
 * Validate if a message can be forwarded
 */
export const canForwardMessage = (message, userId) => {
  // Cannot forward deleted messages
  if (message.deletedForEveryone || message.deletedAt) {
    return { allowed: false, reason: 'Cannot forward deleted messages' };
  }

  return { allowed: true };
};

/**
 * Validate emoji
 * Check if it's a valid emoji and not spam
 */
export const validateEmoji = (emoji) => {
  if (!emoji || typeof emoji !== 'string') {
    return { valid: false, reason: 'Invalid emoji' };
  }

  // Basic emoji validation (1-4 chars for most emojis)
  if (emoji.length > 4) {
    return { valid: false, reason: 'Invalid emoji format' };
  }

  // Check if it's actually an emoji (has emoji properties)
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;
  if (!emojiRegex.test(emoji)) {
    return { valid: false, reason: 'Not a valid emoji' };
  }

  return { valid: true };
};

/**
 * Validate forward targets
 */
export const validateForwardTargets = (targetConversationIds) => {
  if (!Array.isArray(targetConversationIds)) {
    return { valid: false, reason: 'Targets must be an array' };
  }

  if (targetConversationIds.length === 0) {
    return { valid: false, reason: 'At least one target required' };
  }

  if (targetConversationIds.length > 5) {
    return { valid: false, reason: 'Maximum 5 targets allowed' };
  }

  return { valid: true };
};

/**
 * Get message action permissions for a user
 */
export const getMessagePermissions = (message, userId, isGroupChat = false) => {
  const isSender = message.senderId.toString() === userId.toString();
  const isGroupAdmin = isGroupChat; // simplified - would need actual admin check

  return {
    canEdit: isSender && !message.deletedForEveryone,
    canDeleteForSelf: !message.deletedFor.some(id => id.toString() === userId.toString()),
    canDeleteForEveryone: isSender && !message.deletedForEveryone,
    canReact: !message.deletedForEveryone,
    canReply: !message.deletedForEveryone,
    canForward: !message.deletedForEveryone,
    canPin: isGroupAdmin, // only admin can pin in groups
    canStar: true, // anyone can star
    canCopy: true, // anyone can copy
  };
};

export default {
  canEditMessage,
  canDeleteForEveryone,
  canDeleteForSelf,
  canReactToMessage,
  canReplyToMessage,
  canForwardMessage,
  validateEmoji,
  validateForwardTargets,
  getMessagePermissions,
};
