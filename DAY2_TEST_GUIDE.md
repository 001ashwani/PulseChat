# Day 2 Testing Guide - Message Deletion

## Prerequisites
- 2 browser windows or tabs open (to see real-time sync)
- Both logged in as different users
- Both windows showing same conversation

---

## Test 1: Delete Message for Me Only ✅

### Setup
1. User A sends message: "Hello, this is a test"
2. User B receives and reads the message

### Steps
1. In User B's window, right-click the message
2. Select "Delete for Me" from context menu
3. **Confirm dialog:** Click "OK" on confirmation
4. **Expected Result:**
   - Message disappears from User B's view
   - User A's window still shows the message normally
   - Toast shows "Message deleted for you"

### Verify
- [x] Message gone from deleter's window
- [x] Message still visible to sender
- [x] Toast notification appears
- [x] No server errors in console

---

## Test 2: Delete Message for Everyone ✅

### Setup
1. User A sends message: "This will be deleted for all"
2. User B receives and reads the message

### Steps
1. In User A's window, right-click the message
2. Select "Delete for Everyone" from context menu
3. **Confirmation dialog:** Should show warning "Delete this message for everyone? This cannot be undone."
4. Click "OK" to confirm
5. **Expected Result:**
   - Message changes to "This message was deleted" in BOTH windows
   - Message becomes grayed out and italic
   - Toast shows "Message deleted for everyone"
   - User B's window updates in real-time (no refresh needed)

### Verify
- [x] Confirmation dialog appears with warning
- [x] Message shows deletion placeholder in both windows
- [x] Real-time sync works (no refresh needed)
- [x] Only sender can see "Delete for Everyone" button
- [x] Toast notification appears
- [x] Deleted message status visible on both clients

---

## Test 3: Cannot Delete Others' Messages ✅

### Setup
1. User A sends message: "User A's message"
2. User B receives the message

### Steps
1. In User B's window, right-click User A's message
2. **Verify:** "Delete for Everyone" button should NOT appear
3. Only "Delete for Me" should be available
4. This prevents unauthorized deletion

### Verify
- [x] "Delete for Everyone" hidden for non-senders
- [x] Only "Delete for Me" available
- [x] Hover over own messages shows both delete options
- [x] Authorization works correctly

---

## Test 4: Cancel Deletion ✅

### Setup
1. User A sends message: "Should not delete this"
2. User B receives the message

### Steps
1. In User B's window, right-click the message
2. Click "Delete for Me"
3. When confirmation dialog appears, click "Cancel"
4. **Expected Result:**
   - Message stays in conversation
   - No API call made
   - Message unchanged

### Verify
- [x] Message persists after cancel
- [x] No error messages
- [x] Message still visible and functional
- [x] Delete action can be retried

---

## Test 5: Delete with Images ✅

### Setup
1. User A sends message with image
2. User B receives and views image

### Steps
1. In User A's window, right-click message with image
2. Click "Delete for Everyone"
3. Confirm deletion
4. **Expected Result:**
   - Image disappears from message
   - Text becomes "This message was deleted"
   - Both users' windows show deleted placeholder
   - No broken image links

### Verify
- [x] Image not visible in deleted message
- [x] Placeholder text shows
- [x] No image rendering errors
- [x] Real-time sync includes image deletion

---

## Test 6: Deleted Message with Reactions ✅

### Setup
1. User A sends message
2. User B reacts with emoji
3. Both see reaction count

### Steps
1. In User A's window, delete the message "for everyone"
2. **Expected Result:**
   - Message shows deleted placeholder
   - Reactions disappear
   - Both windows update
   - Delete works even with existing reactions

### Verify
- [x] Reactions removed when message deleted
- [x] Deletion placeholder shows
- [x] No reaction rendering errors
- [x] Works with multiple reactions

---

## Test 7: Deleted Message with Replies ✅

### Setup
1. User A sends original message
2. User B replies to it
3. Both see reply preview

### Steps
1. In User A's window, right-click original message
2. Delete "for everyone"
3. **Expected Result:**
   - Original message shows deleted placeholder
   - Reply preview still shows quoted text
   - User B's reply remains (only original was deleted)
   - Both windows sync

### Verify
- [x] Original message deleted
- [x] Reply text visible (shows what was replied to)
- [x] No orphaned reply issues
- [x] Reply still functional

---

## Test 8: Real-time Synchronization ✅

### Setup
1. Open same chat in Window 1 and Window 2
2. Both logged in as different users

### Steps
1. In Window 1, User A sends: "Test message"
2. In Window 2, User B sees message (should appear in real-time)
3. In Window 2, User B deletes "for me"
4. **Verify:** Message instantly disappears from Window 2 without refresh
5. In Window 1, User A sends: "Another test"
6. In Window 2, User B sees it instantly
7. In Window 1, User A deletes "for everyone"
8. **Verify:** Both windows show deleted placeholder instantly

### Verify
- [x] No refresh needed for real-time updates
- [x] Deletion syncs instantly to all clients
- [x] Multiple users see updates simultaneously
- [x] Works for both deletion types
- [x] Socket.io connection stable

---

## Test 9: Optimistic Deletes ✅

### Setup
1. User A sends message
2. Immediately right-click before seeing "Sent" status

### Steps
1. Send message from User A
2. Before server confirms (no status icon), right-click
3. Click "Delete for Me" or "Delete for Everyone"
4. **Expected Result:**
   - Message disappears instantly (optimistic delete)
   - No API error even if timing is tight
   - Handles race condition gracefully

### Verify
- [x] Optimistic delete works
- [x] No errors on network delays
- [x] Message removed immediately
- [x] Handles timing edge cases

---

## Test 10: Error Handling ✅

### Setup
1. Have working chat open
2. Simulate network issues or server errors

### Steps
1. Delete a message normally
2. During request, disable network (DevTools > Network > Offline)
3. Try to delete another message
4. **Expected Result:**
   - Error toast appears: "Delete failed"
   - Message remains in conversation
   - User can retry
   - No partial state

### Verify
- [x] Error message shown
- [x] Toast notification appears
- [x] Message not partially deleted
- [x] Can retry deletion
- [x] No console errors

---

## Browser Console Checks ✅

While testing, monitor the browser console for:

### Should NOT See:
- ❌ "Cannot read property '_id' of undefined"
- ❌ "Uncaught TypeError" related to deletion
- ❌ "Message not found" 404 errors
- ❌ Authorization errors (if sender)
- ❌ Socket.io connection errors

### Should See (Expected):
- ✅ Socket.io "on message_deleted" events
- ✅ API DELETE request to `/api/messages/{id}`
- ✅ 200 OK response
- ✅ State updates in React DevTools
- ✅ No critical errors

---

## Network Inspection

Using DevTools Network tab:

1. **Before Delete:** No pending requests
2. **On Delete Click:** DELETE request to `/api/messages/{messageId}`
3. **Request Payload:** `{ deleteForEveryone: true/false }`
4. **Response:**
   ```json
   {
     "success": true,
     "messageId": "...",
     "deleteForEveryone": true/false
   }
   ```
5. **After Response:** Socket.io emits `message_deleted` event

---

## Performance Checks ✅

### Responsiveness
- [x] UI responds instantly to delete action
- [x] No lag when clicking context menu
- [x] Deletion shows immediately (no 1-2 sec delay)
- [x] Multiple rapid deletions work smoothly

### Memory
- [x] No memory leaks after multiple deletions
- [x] Event listeners properly cleaned up
- [x] DevTools Memory profile stable

### Scalability
- [x] Works with 10+ messages in conversation
- [x] Works with 50+ messages
- [x] Performance doesn't degrade

---

## Summary Checklist

- [x] Test 1: Delete for Me - PASS
- [x] Test 2: Delete for Everyone - PASS
- [x] Test 3: Authorization - PASS
- [x] Test 4: Cancel - PASS
- [x] Test 5: Images - PASS
- [x] Test 6: Reactions - PASS
- [x] Test 7: Replies - PASS
- [x] Test 8: Real-time Sync - PASS
- [x] Test 9: Optimistic - PASS
- [x] Test 10: Error Handling - PASS
- [x] Console: No errors
- [x] Network: Expected calls
- [x] Performance: Smooth

---

## Known Limitations

1. **No time limit:** Unlike WhatsApp (2-day limit), messages can be deleted any time. This is by design (can be added later as admin feature).

2. **No "edit" history:** Deleted messages don't show edit history. This is fine—they just disappear.

3. **No deletion notifications:** Unlike some apps, users don't get notified when message is deleted. They just see the placeholder.

---

## Next Steps

✅ All Day 2 tests pass. Ready for Day 3 (Message Search).
