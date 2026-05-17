# Phase 6: Advanced Messaging Features - Implementation Plan

## Overview
Implement core messaging and message action features for PulseChat. Focus on text formatting, message actions (reply, forward, delete, edit, reactions), and delivery status.

## Priority Features (User Selected: Core + Message Actions)

### Core Text & Formatting
✅ Plain text messages (UTF-8, up to 65,536 chars)
✅ Rich text formatting (*bold*, _italic_, ~strikethrough~, ```monospace```)
✅ Bullet lists support

### Core Message Actions  
✅ Reply to message (quote inline, tap to original)
✅ Forward messages (up to 5 chats)
✅ Delete for me (immediate removal)
✅ Delete for everyone (within 60 hours, shows placeholder)
✅ Edit message (within 15 minutes, shows "Edited" tag)
✅ React with emoji (6 quick reactions + picker)

### Core Delivery & Status
✅ Message receipts (sent/delivered/read status)
✅ Typing indicator
✅ Online / last seen status
✅ Read receipts toggle (blue ticks on/off)

## Implementation Strategy

### Phase 6A: Database Models (1 day)
**Task**: Update Message model, create Reaction model

New Fields for Message:
- replyTo: ObjectId (link to original message)
- forwardedFrom: String (shows message was forwarded)
- deletedAt: Date (soft delete)
- editedAt: Date (tracks edits)
- status: String (sent/delivered/read)
- deliveredAt: Date (delivery timestamp)
- readAt: Date (read timestamp)
- formattedContent: String (HTML from markdown)
- plainText: String (original markdown)

New Reaction Model:
- userId: ObjectId
- messageId: ObjectId
- emoji: String
- createdAt: Date

### Phase 6B: Backend APIs (2 days)
**Task**: Implement all message action endpoints

Message Action Endpoints:
- POST /api/messages/format - Convert markdown to HTML
- POST /api/messages/:id/reply - Reply to message
- POST /api/messages/:id/forward - Forward to chats
- PUT /api/messages/:id - Edit message
- DELETE /api/messages/:id - Delete for me
- POST /api/messages/:id/delete-all - Delete for everyone
- POST /api/messages/:id/reactions - Add reaction
- DELETE /api/messages/:id/reactions/:emoji - Remove reaction
- POST /api/messages/mark-as-read - Mark messages as read

Socket.io Events:
- message:typing (user typing)
- message:status (sent/delivered/read)
- message:reaction (emoji added/removed)
- message:edited (message updated)
- message:deleted (message deleted)

### Phase 6C: Frontend Components (2 days)
**Task**: Build all UI components

New Components:
- MessageFormatter.jsx - Display formatted text
- RichTextEditor.jsx - Compose with markdown
- ReactionPicker.jsx - Emoji selector
- ForwardModal.jsx - Select chats to forward
- ReplyPreview.jsx - Show quoted message
- MessageActions.jsx - Context menu
- TypingIndicator.jsx - Show "typing…"
- StatusIndicators.jsx - Show delivery ticks

Modified Components:
- Message.jsx - Add formatting, actions, status
- Chat.jsx - Add typing, reactions
- MessageList.jsx - Add reply scroll-to

### Phase 6D: Real-time Sync (1 day)
**Task**: Socket.io integration for live updates

Features:
- Real-time typing indicator
- Live delivery status updates
- Instant reaction updates
- Live edit/delete broadcasts
- Optimistic UI updates
- Error rollback

## Files to Create

### Backend (6 files)
- server/models/Reaction.js - Reaction schema
- server/controllers/messageController.js - Action handlers
- server/utils/messageFormatter.js - Markdown converter
- server/utils/messageValidator.js - Validation logic
- server/routes/messageRoutes.js (update) - New endpoints
- server/models/Message.js (update) - New fields

### Frontend (8 files)
- pulsechat-client/src/components/MessageFormatter.jsx
- pulsechat-client/src/components/RichTextEditor.jsx
- pulsechat-client/src/components/ReactionPicker.jsx
- pulsechat-client/src/components/ForwardModal.jsx
- pulsechat-client/src/components/ReplyPreview.jsx
- pulsechat-client/src/components/MessageActions.jsx
- pulsechat-client/src/components/TypingIndicator.jsx
- pulsechat-client/src/components/StatusIndicators.jsx

### Tests (3 files)
- server/messageController.test.js
- server/messageFormatter.test.js
- server/messageValidator.test.js

## Success Criteria
- ✅ Text formatting (bold, italic, strikethrough, monospace, lists)
- ✅ Reply to message with jump-to-original
- ✅ Forward to multiple chats (max 5)
- ✅ Delete for me (immediate)
- ✅ Delete for everyone (within 60 hours)
- ✅ Edit message (within 15 minutes)
- ✅ React with emoji (6 quick + picker)
- ✅ Delivery status (sent/delivered/read)
- ✅ Typing indicator real-time
- ✅ Online status + last seen
- ✅ >70% test coverage
- ✅ <100ms response time

## Dependencies to Install
```bash
# Backend
npm install markdown-it sanitize-html

# Frontend
npm install emoji-picker-react markdown-to-jsx
```

## Timeline
- **Phase 6A**: 1 day
- **Phase 6B**: 2 days  
- **Phase 6C**: 2 days
- **Phase 6D**: 1 day
- **Total**: 6 days

## Status: READY FOR IMPLEMENTATION 🚀
