const fs = require('fs');
const path = require('path');

// Create components directory if it doesn't exist
const componentsDir = path.join(__dirname, 'pulsechat-client', 'src', 'components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// NewGroupModal.jsx
const newGroupModalContent = `import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { createGroupApi } from '../api';

export default function NewGroupModal({ isOpen, onClose, onGroupCreated, contacts = [] }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) return [];
    return contacts.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedMembers.some(m => m._id === c._id)
    );
  }, [contacts, searchQuery, selectedMembers]);

  const handleAddMember = (contact) => {
    setSelectedMembers(prev => [...prev, contact]);
    setSearchQuery('');
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers(prev => prev.filter(m => m._id !== memberId));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    if (selectedMembers.length < 1) {
      toast.error('Add at least 1 member');
      return;
    }

    setLoading(true);
    try {
      const { data } = await createGroupApi({
        name: groupName.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers.map(m => m._id),
      });
      
      toast.success('Group created!');
      onGroupCreated(data);
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 flex justify-between items-center p-lg border-b border-outline-variant/30 bg-surface">
          <h2 className="font-headline text-xl font-bold text-on-surface">Create Group</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-lg space-y-lg">
          <div>
            <label className="block font-label text-sm font-bold text-on-surface mb-xs">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface placeholder-on-surface-variant/50 focus:border-primary outline-none transition-colors font-label text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-label text-sm font-bold text-on-surface mb-xs">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows="3"
              className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface placeholder-on-surface-variant/50 focus:border-primary outline-none transition-colors font-label text-sm resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-label text-sm font-bold text-on-surface mb-xs">
              Add Members *
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface placeholder-on-surface-variant/50 focus:border-primary outline-none transition-colors font-label text-sm"
                disabled={loading}
              />
              {searchQuery && filteredContacts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container border border-outline-variant/30 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredContacts.map(contact => (
                    <button
                      key={contact._id}
                      type="button"
                      onClick={() => handleAddMember(contact)}
                      className="w-full px-md py-sm text-left hover:bg-surface-variant/50 transition-colors border-b border-outline-variant/10 last:border-b-0 flex items-center gap-md"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="font-label text-sm text-on-surface">{contact.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div>
              <label className="block font-label text-sm font-bold text-on-surface mb-xs">
                Selected Members ({selectedMembers.length})
              </label>
              <div className="flex flex-wrap gap-sm">
                {selectedMembers.map(member => (
                  <div
                    key={member._id}
                    className="bg-primary-container text-on-primary-container px-md py-xs rounded-full flex items-center gap-xs font-label text-sm"
                  >
                    <span>{member.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member._id)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-md pt-lg border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-surface-container border border-outline-variant/50 text-on-surface font-label text-sm font-bold py-sm px-md rounded-lg hover:bg-surface-variant/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim() || selectedMembers.length === 0}
              className="flex-1 bg-primary text-on-primary font-label text-sm font-bold py-sm px-md rounded-lg hover:bg-primary-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-xs"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(componentsDir, 'NewGroupModal.jsx'), newGroupModalContent);
console.log('Created NewGroupModal.jsx');

// GroupList.jsx
const groupListContent = `import { useMemo } from 'react';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function GroupList({ groups = [], selectedGroupId, onSelectGroup, onNewGroup, loading = false }) {
  const sortedGroups = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    return [...groups].sort((a, b) => 
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  }, [groups]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* New Group Button */}
      <button
        onClick={onNewGroup}
        disabled={loading}
        className="m-md bg-primary text-on-primary font-label text-sm font-bold py-3 px-md rounded-lg shadow-sm hover:bg-primary-dim active:scale-95 transition-all duration-200 flex items-center justify-center gap-sm disabled:opacity-50"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        New Group
      </button>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center py-8 text-on-surface-variant font-label text-sm">Loading groups...</div>
        ) : sortedGroups.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant font-label text-sm px-4">
            <p className="mb-2">No groups yet</p>
            <p className="text-xs">Create one to get started!</p>
          </div>
        ) : (
          sortedGroups.map(group => {
            const isSelected = selectedGroupId === group._id;
            const memberCount = group.memberIds?.length || 0;
            return (
              <div
                key={group._id}
                onClick={() => onSelectGroup(group)}
                className={\`p-md border-b border-outline-variant/10 cursor-pointer transition-colors \${isSelected ? 'bg-surface-container border-l-4 border-l-primary' : 'hover:bg-surface-container'}\`}
              >
                <div className="flex gap-md items-start group">
                  <div className={w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border transition-colors \${isSelected ? 'border-2 border-primary' : 'border-outline-variant/30 group-hover:border-primary'}\`}>
                    {group.avatar ? (
                      <img alt={group.name} src={group.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                        {getInitials(group.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-label text-sm text-on-surface font-bold truncate">{group.name}</h3>
                    <p className="font-body text-xs text-on-surface-variant mt-xs">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(componentsDir, 'GroupList.jsx'), groupListContent);
console.log('Created GroupList.jsx');

// GroupInfo.jsx
const groupInfoContent = `import { useState } from 'react';
import toast from 'react-hot-toast';
import { addGroupMembersApi, removeGroupMemberApi, leaveGroupApi, deleteGroupApi } from '../api';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function GroupInfo({ group, currentUserId, onGroupUpdated, onLeaveGroup, onDelete, isLoading = false }) {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const isCreator = group.createdBy === currentUserId;
  const isAdmin = group.admins?.includes(currentUserId) || isCreator;

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    
    setActionLoading(\`remove-\${userId}\`);
    try {
      await removeGroupMemberApi(group._id, userId);
      toast.success('Member removed');
      onGroupUpdated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;
    
    setActionLoading('leave');
    try {
      await leaveGroupApi(group._id);
      toast.success('Left group');
      onLeaveGroup();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    
    setActionLoading('delete');
    try {
      await deleteGroupApi(group._id);
      toast.success('Group deleted');
      onDelete();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border-l border-outline-variant/30 bg-surface">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-lg border-b border-outline-variant/30">
          {group.avatar && (
            <img alt={group.name} src={group.avatar} className="w-full h-32 object-cover rounded-lg mb-md" />
          )}
          <h2 className="font-headline text-xl font-bold text-on-surface mb-xs">{group.name}</h2>
          {group.description && (
            <p className="font-body text-sm text-on-surface-variant">{group.description}</p>
          )}
          <p className="font-label text-xs text-on-surface-variant mt-md">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Members Section */}
        <div className="p-lg border-b border-outline-variant/30">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label text-sm font-bold text-on-surface">Members ({group.memberIds?.length || 0})</h3>
            {isAdmin && (
              <button
                onClick={() => setShowAddMembers(!showAddMembers)}
                className="text-primary hover:text-primary-dim transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            )}
          </div>

          <div className="space-y-xs">
            {(group.memberIds || []).map(memberId => {
              const isMe = memberId === currentUserId;
              const isGroupAdmin = group.admins?.includes(memberId);
              return (
                <div key={memberId} className="flex items-center justify-between p-sm bg-surface-container rounded-lg">
                  <div className="flex items-center gap-sm flex-1">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                      {memberId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-label text-xs text-on-surface font-bold">{isMe ? 'You' : memberId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm">
                    {isGroupAdmin && (
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">Admin</span>
                    )}
                    {isAdmin && !isMe && (
                      <button
                        onClick={() => handleRemoveMember(memberId)}
                        disabled={actionLoading === \`remove-\${memberId}\`}
                        className="text-error hover:text-error-dim text-sm disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="p-lg border-b border-outline-variant/30 space-y-md text-sm">
          <div>
            <p className="font-label text-xs text-on-surface-variant font-bold mb-xs">Group ID</p>
            <p className="font-body text-xs text-on-surface font-mono break-all">{group._id}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-lg border-t border-outline-variant/30 space-y-sm">
        <button
          onClick={handleLeaveGroup}
          disabled={actionLoading === 'leave' || isLoading}
          className="w-full bg-surface-container border border-outline-variant/50 text-on-surface font-label text-sm font-bold py-2 px-md rounded-lg hover:bg-surface-variant/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Leave Group
        </button>
        {isCreator && (
          <button
            onClick={handleDeleteGroup}
            disabled={actionLoading === 'delete' || isLoading}
            className="w-full bg-error/10 border border-error/30 text-error font-label text-sm font-bold py-2 px-md rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Group
          </button>
        )}
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(componentsDir, 'GroupInfo.jsx'), groupInfoContent);
console.log('Created GroupInfo.jsx');

// GroupChat.jsx
const groupChatContent = `import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { getGroupApi, getGroupMessagesApi, sendGroupMessageApi, deleteMessageApi, uploadFileApi } from '../api';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function GroupChat({ groupId, onBack }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useSocket(user?._id);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showInfo, setShowInfo] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Fetch group details
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    Promise.all([
      getGroupApi(groupId),
      getGroupMessagesApi(groupId),
    ])
      .then(([{ data: groupData }, { data: messagesData }]) => {
        setGroup(groupData);
        setMessages(messagesData || []);
        socketRef.current?.emit('join_group', { groupId, userId: user._id });
      })
      .catch(() => toast.error('Failed to load group'))
      .finally(() => setLoading(false));

    return () => {
      socketRef.current?.emit('leave_group', { groupId, userId: user._id });
    };
  }, [groupId]);

  // Socket listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !group) return;

    const onReceiveMessage = (data) => {
      if (data.groupId === group._id) {
        setMessages(prev => [...prev, data]);
      }
    };

    const onTyping = ({ userId, groupId: gId }) => {
      if (gId === group._id && userId !== user._id) {
        setTypingUsers(prev => new Set(prev).add(userId));
      }
    };

    const onStopTyping = ({ userId, groupId: gId }) => {
      if (gId === group._id) {
        setTypingUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
      }
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId
        ? { ...m, deletedForEveryone: true, text: '', image: null }
        : m
      ));
    };

    socket.on('receive_message', onReceiveMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('message_deleted', onMessageDeleted);

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('message_deleted', onMessageDeleted);
    };
  }, [socketRef, group]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!message.trim() && !imagePreview) || !group || sending) return;

    const text = message.trim();
    setMessage('');
    setSending(true);

    let imageUrl = null;
    if (imagePreview?.file) {
      try {
        const fd = new FormData();
        fd.append('file', imagePreview.file);
        const { data } = await uploadFileApi(fd);
        imageUrl = data.url;
      } catch { toast.error('Image upload failed'); }
    }
    setImagePreview(null);

    const optimistic = {
      _id: \`opt_\${Date.now()}\`,
      senderId: user._id,
      groupId: group._id,
      text,
      image: imageUrl,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { data: saved } = await sendGroupMessageApi(group._id, { text, image: imageUrl });
      setMessages(prev => prev.map(m => m._id === optimistic._id ? saved : m));
      socketRef.current?.emit('send_message', {
        senderId: user._id,
        groupId: group._id,
        text,
        image: imageUrl,
        _id: saved._id,
        createdAt: saved.createdAt,
      });
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
    } finally { setSending(false); }
  };

  const handleDelete = async (msg, forEveryone) => {
    if (msg.optimistic) { setMessages(prev => prev.filter(m => m._id !== msg._id)); return; }
    try {
      await deleteMessageApi(msg._id, forEveryone);
      if (forEveryone) {
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, deletedForEveryone: true, text: '', image: null } : m));
        socketRef.current?.emit('message_deleted', { messageId: msg._id, groupId: group._id });
      } else {
        setMessages(prev => prev.filter(m => m._id !== msg._id));
      }
    } catch { toast.error('Delete failed'); }
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview({ url, file });
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!socketRef.current || !group) return;
    socketRef.current.emit('typing', { userId: user._id, groupId: group._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', { userId: user._id, groupId: group._id });
    }, 1500);
  };

  if (!group && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-on-surface-variant">Group not found</p>
          <button onClick={onBack} className="mt-4 text-primary">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-bright">
      {/* Header */}
      {group && (
        <div className="h-16 border-b border-outline-variant/30 bg-surface flex items-center justify-between px-md sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="lg:hidden text-on-surface-variant p-1 -ml-2 rounded-lg hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30">
              {group.avatar ? (
                <img alt={group.name} src={group.avatar} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  {getInitials(group.name)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="font-label text-sm font-bold text-on-surface">{group.name}</h2>
              <p className="font-body text-xs text-on-surface-variant">{group.memberIds?.length || 0} members</p>
            </div>
          </div>
          <button onClick={() => setShowInfo(!showInfo)} className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-variant transition-all">
            <span className="material-symbols-outlined">info</span>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-md custom-scrollbar bg-chat-pattern">
        {loading ? (
          <div className="text-center py-8 text-on-surface-variant">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((m, index) => {
            const isMe = m.senderId === user._id;
            const isDeleted = m.deletedForEveryone;
            return (
              <div
                key={m._id || index}
                className={\`flex gap-sm max-w-[80%] group \${isMe ? 'self-end flex-row-reverse' : 'self-start'}\`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-auto border border-outline-variant/30 bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                    {typeof m.senderName === 'string' ? getInitials(m.senderName) : m.senderId.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className={isMe ? 'flex-row-reverse' : ''}>
                  {!isMe && (
                    <p className="font-label text-xs text-on-surface-variant mb-xs px-md">{m.senderName || 'Unknown'}</p>
                  )}
                  <div className={\`rounded-lg px-md py-sm \${isMe ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}\`}>
                    {isDeleted ? (
                      <p className="font-body text-sm italic opacity-60">Message deleted</p>
                    ) : (
                      <>
                        {m.image && <img alt="msg" src={m.image} className="max-w-xs rounded mb-1" />}
                        <p className="font-body text-sm whitespace-pre-wrap break-words">{m.text}</p>
                      </>
                    )}
                    <p className="font-label text-xs opacity-70 mt-xs text-right">{formatTime(m.createdAt)}</p>
                  </div>
                </div>
                {isMe && !m.optimistic && (
                  <button onClick={() => handleDelete(m, true)} className="opacity-0 group-hover:opacity-100 text-on-surface-variant text-xs p-1 hover:text-error transition-all">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
              </div>
            );
          })
        )}
        {Array.from(typingUsers).length > 0 && (
          <div className="text-on-surface-variant text-xs italic">Someone is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-outline-variant/30 bg-surface p-md">
        {imagePreview && (
          <div className="mb-md relative max-w-xs">
            <img alt="preview" src={imagePreview.url} className="rounded-lg max-h-24" />
            <button onClick={() => setImagePreview(null)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-sm items-end">
          <input type="file" ref={fileInputRef} onChange={handleImagePick} accept="image/*" className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary p-2 hover:bg-surface-container rounded-lg">
            <span className="material-symbols-outlined">image</span>
          </button>
          <textarea value={message} onChange={handleTyping} onKeyDown={handleKeyDown} placeholder="Message..." rows="1" className="flex-1 bg-surface-container border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface placeholder-on-surface-variant/50 focus:border-primary outline-none transition-colors font-body text-sm resize-none" disabled={sending} />
          <button type="submit" disabled={(!message.trim() && !imagePreview) || sending} className="bg-primary text-on-primary p-2 rounded-lg hover:bg-primary-dim disabled:opacity-50 transition-colors">
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(componentsDir, 'GroupChat.jsx'), groupChatContent);
console.log('Created GroupChat.jsx');

console.log('All components created successfully!');

