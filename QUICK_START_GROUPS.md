# PulseChat Groups - Quick Start Guide

## 🚀 Start Using Group Chat in 3 Steps

### Step 1: Start the Development Server
```bash
cd pulsechat-client
npm run dev
```

### Step 2: Log In
- Open http://localhost:5173 (or your configured dev URL)
- Login with your credentials

### Step 3: Create a Group
1. Click "Groups" button in the left sidebar
2. Click "Create Group" 
3. Enter group name
4. Select members from your contacts
5. Click "Create"
6. Start chatting!

---

## 📚 Component Overview

### Where Everything Is

| Feature | Component | File |
|---------|-----------|------|
| Create groups | NewGroupModal | `src/pages/NewGroupModal.jsx` |
| View groups | GroupList | `src/pages/GroupList.jsx` |
| Chat in groups | GroupChat | `src/pages/GroupChat.jsx` |
| Group settings | GroupInfo | `src/pages/GroupInfo.jsx` |
| Main integration | Chat | `src/pages/Chat.jsx` |

### How They Connect

```
Chat.jsx
├── NewGroupModal
│   └── Form to create groups
├── GroupList
│   └── Shows all groups, handles selection
├── GroupChat (when group selected)
│   ├── Message display
│   ├── Message input
│   ├── Typing indicators
│   └── File upload
└── GroupInfo (optional sidebar)
    └── Member management
```

---

## 🎮 User Features

### For Any Member
- ✅ View all groups you're in
- ✅ Send and receive messages
- ✅ See who's typing
- ✅ Upload images/files
- ✅ Delete your own messages
- ✅ Leave group

### For Group Creator
- ✅ All member features plus:
- ✅ Add/remove members
- ✅ Delete entire group
- ✅ Update group name/description

---

## 🔧 Developer Reference

### State Variables in Chat.jsx

```javascript
// Group-related states
const [showGroupModal, setShowGroupModal] = useState(false);        // Controls modal visibility
const [groups, setGroups] = useState([]);                           // All user's groups
const [selectedGroup, setSelectedGroup] = useState(null);           // Currently selected group
const [viewMode, setViewMode] = useState('messages');              // 'messages' or 'groups'
const [loadingGroups, setLoadingGroups] = useState(false);         // Loading state
```

### View Mode Logic

```javascript
{viewMode === 'messages' ? (
  // Show messages and selected user chat
  selectedUser ? (<ChatUI />) : (<EmptyState />)
) : (
  // Show groups and selected group chat
  selectedGroup ? (<GroupChat />) : (<GroupEmptyState />)
)}
```

### Loading Groups

```javascript
useEffect(() => {
  if (!user) return;
  setLoadingGroups(true);
  getAllGroupsApi()
    .then(({ data }) => setGroups(data || []))
    .catch(() => toast.error('Failed to load groups'))
    .finally(() => setLoadingGroups(false));
}, [user]);
```

### Creating a Group

```javascript
<NewGroupModal 
  isOpen={showGroupModal}
  onClose={() => setShowGroupModal(false)}
  onGroupCreated={(newGroup) => {
    setGroups([...groups, newGroup]);     // Add to list
    setSelectedGroup(newGroup);            // Select it
    setViewMode('groups');                 // Switch to groups view
    setShowGroupModal(false);              // Close modal
  }}
  contacts={users}
/>
```

---

## 📡 API Calls

### Groups API

```javascript
// From src/api/index.js
import {
  getAllGroupsApi,           // Get all groups
  createGroupApi,            // Create new group
  getGroupApi,               // Get group details
  updateGroupApi,            // Update group
  addGroupMembersApi,        // Add members
  removeGroupMemberApi,      // Remove member
  leaveGroupApi,             // Leave group
  deleteGroupApi,            // Delete group
  sendGroupMessageApi,       // Send message
  getGroupMessagesApi        // Get messages
} from '../api';
```

### Example Usage

```javascript
// Create a group
const { data: newGroup } = await createGroupApi({
  name: 'Project Team',
  description: 'Discuss project updates',
  memberIds: ['userId1', 'userId2', 'userId3']
});

// Get all groups
const { data: userGroups } = await getAllGroupsApi();

// Send message to group
const { data: message } = await sendGroupMessageApi(groupId, {
  text: 'Hello everyone!'
});

// Get group messages
const { data: messages } = await getGroupMessagesApi(groupId);

// Add member to group (admin only)
await addGroupMembersApi(groupId, ['newUserId']);

// Leave a group
await leaveGroupApi(groupId);

// Delete a group (creator only)
await deleteGroupApi(groupId);
```

---

## 🔌 Socket.io Events

### Emitted Events

```javascript
// Join group when opened
socketRef.current?.emit('join_group', { groupId, userId: user._id });

// Leave group when closed
socketRef.current?.emit('leave_group', { groupId, userId: user._id });

// User is typing
socketRef.current?.emit('typing', { groupId, userName: user.name });

// User stopped typing
socketRef.current?.emit('stop_typing', { groupId, userId: user._id });

// Send message (via API, but Socket receives it)
await sendGroupMessageApi(groupId, { text: message });
```

### Listening Events

```javascript
// New message received
socketRef.current?.on('receive_message', ({ groupId: msgGroupId, message: msg }) => {
  if (msgGroupId === groupId) {
    setMessages(prev => [...prev, msg]);
  }
});

// User typing in group
socketRef.current?.on('typing', ({ groupId: typingGroupId, userName }) => {
  if (typingGroupId === groupId) {
    // Show typing indicator
  }
});

// User stopped typing
socketRef.current?.on('stop_typing', ({ groupId: typingGroupId, userId }) => {
  if (typingGroupId === groupId) {
    // Hide typing indicator
  }
});

// Message deleted
socketRef.current?.on('message_deleted', ({ messageId, groupId: delGroupId }) => {
  if (delGroupId === groupId) {
    setMessages(prev => prev.filter(m => m._id !== messageId));
  }
});
```

---

## 🐛 Debugging Tips

### Check Group Loading
```javascript
// In browser console
console.log('Groups:', groups);
console.log('Selected Group:', selectedGroup);
console.log('View Mode:', viewMode);
```

### Check Socket Connection
```javascript
// In browser console
console.log('Socket:', socketRef.current);
console.log('Connected:', socketRef.current?.connected);
```

### Test API
```javascript
// In browser console
import { getAllGroupsApi } from './api';
getAllGroupsApi().then(res => console.log('Groups:', res.data));
```

### Check for Errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed API calls
5. Look for Socket.io connection issues

---

## ⚙️ Configuration

### Environment Variables Needed
```
VITE_API_URL=http://localhost:3000      # Backend API endpoint
VITE_SOCKET_URL=http://localhost:3000   # Socket.io endpoint
```

### Backend Requirements
- Ensure backend has group endpoints implemented
- Socket.io server must be running
- Database must have group collections
- CORS must allow group requests

---

## 📝 Common Tasks

### Add a Feature to GroupChat
1. Open `src/pages/GroupChat.jsx`
2. Add your feature logic in the component
3. Import any needed APIs or utilities
4. Use existing Socket.io patterns
5. Match styling with Tailwind/Material Design tokens

### Update GroupList Styling
1. Open `src/pages/GroupList.jsx`
2. Modify Tailwind classes (lines 30-95)
3. Keep responsive design intact
4. Use existing color tokens (bg-surface, text-on-surface, etc.)

### Add New Group API
1. Open `src/api/index.js`
2. Add new export function (lines 45-58)
3. Follow pattern: `export const functionName = (params) => api.method('/endpoint', params)`
4. Import and use in components

### Move Components to Proper Directory
Components are currently in `src/pages/` directory. To move to `src/components/`:

1. Create `src/components/` directory
2. Move all 4 group components there
3. Update Chat.jsx imports:
```javascript
import NewGroupModal from '../components/NewGroupModal';
import GroupList from '../components/GroupList';
import GroupChat from '../components/GroupChat';
```

---

## ✅ Testing Checklist

Use this to verify everything works:

- [ ] Can create a group with 2+ members
- [ ] Can send message in group
- [ ] Can see messages from other users
- [ ] Typing indicators show correctly
- [ ] Can upload images to group
- [ ] Can delete own messages
- [ ] Can add member to group (admin)
- [ ] Can remove member from group (admin)
- [ ] Can leave group
- [ ] Can delete group (creator only)
- [ ] View mode switches correctly
- [ ] Group list updates in real-time
- [ ] Works on mobile view
- [ ] No console errors

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Groups list is empty" | Check backend API, verify user is logged in |
| "Can't send message" | Check Socket.io connection, verify group ID |
| "Typing indicators not showing" | Check Socket.io events, verify group ID |
| "Images not uploading" | Check file size, verify uploadFileApi works |
| "App crashes when creating group" | Check form validation, verify API response |
| "Members can't be selected" | Check contacts are loaded, verify user list |

---

## 📞 Need Help?

Refer to these files:
- **PHASE4_COMPLETE.md** - Full feature overview and testing guide
- **PHASE4_INTEGRATION_VERIFICATION.md** - Technical integration details
- **GROUP_INTEGRATION_GUIDE.md** - Code snippets and patterns

---

## 🎉 You're Ready!

The group chat feature is fully implemented and integrated. Start the dev server and try it out!

```bash
cd pulsechat-client && npm run dev
```

Happy chatting! 💬
