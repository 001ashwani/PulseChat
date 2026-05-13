import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket, disconnectSocket } from '../hooks/useSocket';
import { getUsersApi, getMessagesApi, sendMessageApi, deleteMessageApi, reactToMessageApi, uploadFileApi, getAllGroupsApi } from '../api';
import NewGroupModal from './NewGroupModal';
import GroupList from './GroupList';
import GroupChat from './GroupChat';

const EMOJIS = ['😀','😂','❤️','👍','👎','😮','😢','🔥','🎉','🙏','😍','😎','🤔','😴','💯'];
const QUICK_REACTIONS = ['❤️','😂','👍','😮','😢','🙏'];

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socketRef = useSocket(user?._id);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [msgSearch, setMsgSearch] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);

  // Group-related state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState('messages');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Fetch users for sidebar
  useEffect(() => {
    getUsersApi()
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Failed to load contacts'))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Fetch groups
  useEffect(() => {
    if (!user) return;
    setLoadingGroups(true);
    getAllGroupsApi()
      .then(({ data }) => setGroups(data || []))
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setLoadingGroups(false));
  }, [user]);

  // Fetch messages when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMsgs(true);
    setMessages([]);
    getMessagesApi(selectedUser._id)
      .then(({ data }) => {
        setMessages(data);
        // Tell the sender their messages have been seen
        socketRef.current?.emit('messages_read', {
          senderId: selectedUser._id,
          receiverId: user._id,
        });
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoadingMsgs(false));
  }, [selectedUser]);

  // Socket listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onReceiveMessage = (data) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        // If actively viewing this chat, mark as seen immediately
        setMessages(prev => [...prev, { ...data, seen: true }]);
        // Tell sender we've seen it
        socketRef.current?.emit('messages_read', {
          senderId: data.senderId,
          receiverId: user._id,
        });
      } else {
        // Not viewing — mark as delivered (not seen)
        setUsers(prev => prev.map(u => {
          if (u._id === data.senderId) {
            return {
              ...u,
              lastMessagePreview: data.text,
              unreadCount: (u.unreadCount || 0) + 1
            };
          }
          return u;
        }));
      }
    };

    const onMessagesRead = ({ receiverId }) => {
      // Receiver has seen our messages — mark all our sent messages to them as seen
      setMessages(prev => prev.map(m =>
        m.senderId === user._id ? { ...m, seen: true } : m
      ));
    };

    const onUserStatus = ({ userId, status }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        status === 'online' ? next.add(userId) : next.delete(userId);
        return next;
      });
    };

    const onTyping = ({ senderId }) => {
      if (selectedUser?._id === senderId) {
        setTypingUsers(prev => new Set(prev).add(senderId));
      }
    };

    const onStopTyping = ({ senderId }) => {
      setTypingUsers(prev => { const s = new Set(prev); s.delete(senderId); return s; });
    };

    const onInitialOnlineUsers = (userIds) => {
      setOnlineUsers(new Set(userIds));
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId
        ? { ...m, deletedForEveryone: true, text: '', image: null }
        : m
      ));
    };

    const onMessageReaction = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    };

    socket.on('initial_online_users', onInitialOnlineUsers);
    socket.on('receive_message', onReceiveMessage);
    socket.on('user_status', onUserStatus);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('messages_read', onMessagesRead);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('message_reaction', onMessageReaction);

    return () => {
      socket.off('initial_online_users', onInitialOnlineUsers);
      socket.off('receive_message', onReceiveMessage);
      socket.off('user_status', onUserStatus);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('messages_read', onMessagesRead);
      socket.off('message_deleted', onMessageDeleted);
      socket.off('message_reaction', onMessageReaction);
    };
  }, [socketRef, selectedUser]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!message.trim() && !imagePreview) || !selectedUser || sending) return;
    const text = message.trim();
    setMessage('');
    setReplyTo(null);
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
      _id: `opt_${Date.now()}`,
      senderId: user._id,
      text,
      image: imageUrl,
      replyToSnapshot: replyTo ? { text: replyTo.text, senderName: replyTo.senderId === user._id ? 'You' : selectedUser.name, image: replyTo.image } : null,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { data: saved } = await sendMessageApi(selectedUser._id, { text, image: imageUrl, replyToId: replyTo?._id });
      setMessages(prev => prev.map(m => m._id === optimistic._id ? saved : m));
      socketRef.current?.emit('send_message', {
        senderId: user._id, receiverId: selectedUser._id,
        text, image: imageUrl,
        replyToSnapshot: saved.replyToSnapshot,
        conversationId: saved.conversationId,
        _id: saved._id, createdAt: saved.createdAt,
      });
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
    } finally { setSending(false); }
  };

  const handleDelete = async (msg, forEveryone) => {
    setContextMenu(null);
    if (msg.optimistic) { setMessages(prev => prev.filter(m => m._id !== msg._id)); return; }
    try {
      await deleteMessageApi(msg._id, forEveryone);
      if (forEveryone) {
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, deletedForEveryone: true, text: '', image: null } : m));
        socketRef.current?.emit('message_deleted', { messageId: msg._id, receiverId: selectedUser._id });
      } else {
        setMessages(prev => prev.filter(m => m._id !== msg._id));
      }
    } catch { toast.error('Delete failed'); }
  };

  const handleReact = async (msg, emoji) => {
    setContextMenu(null);
    if (msg.optimistic) return;
    try {
      const { data: updated } = await reactToMessageApi(msg._id, emoji);
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, reactions: updated.reactions } : m));
      socketRef.current?.emit('message_reaction', { messageId: msg._id, reactions: updated.reactions, receiverId: selectedUser._id });
    } catch { toast.error('Reaction failed'); }
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview({ url, file });
    e.target.value = '';
  };

  const openContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    const socket = socketRef.current;
    if (!socket || !selectedUser) return;
    socket.emit('typing', { senderId: user._id, receiverId: selectedUser._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { senderId: user._id, receiverId: selectedUser._id });
    }, 1500);
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const handleUserSelect = (u) => {
    setSelectedUser(u);
    setSidebarOpen(false);
    // Reset unread count locally when viewing chat
    setUsers(prev => prev.map(user => user._id === u._id ? { ...user, unreadCount: 0 } : user));
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOnline = (uid) => onlineUsers.has(uid);
  const isTyping = selectedUser && typingUsers.has(selectedUser._id);

  return (
    <div className="bg-background text-on-background font-body text-base h-screen overflow-hidden flex selection:bg-primary-container selection:text-on-primary-container relative">
      {/* SideNavBar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-[280px] flex-col p-lg border-r border-outline-variant/30 shadow-sm bg-surface z-20 transition-transform duration-300 md:translate-x-0 -translate-x-full">
        <div className="mb-xl">
          <h1 className="font-display text-4xl font-bold text-primary tracking-tight">PulseChat</h1>
          <p className="font-label text-sm text-on-surface-variant mt-xs">Connected</p>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="w-full bg-primary text-on-primary font-label text-sm font-bold py-3 px-md rounded-lg shadow-sm hover:bg-primary-dim active:scale-95 transition-all duration-200 flex items-center justify-center gap-sm mb-lg">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-2 pr-sm custom-scrollbar">
          <button onClick={() => { setViewMode('messages'); }} className={`w-full font-bold flex items-center gap-4 py-3 px-4 rounded-lg active:scale-95 transition-transform ${viewMode === 'messages' ? 'text-on-primary-container bg-primary-container' : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'}`} style={{ fontVariationSettings: viewMode === 'messages' ? "'FILL' 1" : "'FILL' 0" }}>
            <span className="material-symbols-outlined">chat</span>
            <span className="font-label text-sm">Chats</span>
          </button>
          <button onClick={() => { setViewMode('groups'); }} className={`w-full font-bold flex items-center gap-4 py-3 px-4 rounded-lg active:scale-95 transition-transform ${viewMode === 'groups' ? 'text-on-primary-container bg-primary-container' : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'}`} style={{ fontVariationSettings: viewMode === 'groups' ? "'FILL' 1" : "'FILL' 0" }}>
            <span className="material-symbols-outlined">group</span>
            <span className="font-label text-sm">Groups</span>
          </button>
        </div>
        <div className="mt-auto pt-lg border-t border-outline-variant/30 space-y-2">
          <button onClick={() => toast("Profile editing coming soon!", { icon: '🛠️' })} className="w-full text-on-surface-variant flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-surface-variant/50 hover:text-on-surface transition-all duration-200 active:scale-95">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>account_circle</span>
            <span className="font-label text-sm">Profile</span>
          </button>
          <button onClick={handleLogout} className="w-full text-on-surface-variant flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-surface-variant/50 hover:text-on-surface transition-all duration-200 active:scale-95">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
            <span className="font-label text-sm">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-[280px] w-full md:w-[calc(100%-280px)] h-full">
        {/* TopAppBar */}
        <header className="docked full-width top-0 bg-surface border-b border-outline-variant/30 flex justify-between items-center px-lg py-md z-10 shadow-sm">
          <div className="flex items-center gap-lg">
            <button className="lg:hidden text-on-surface-variant hover:text-primary transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="hidden md:flex bg-surface-container border border-outline-variant/30 rounded-full px-4 py-2 items-center gap-2 focus-within:border-primary transition-colors w-64">
              <span className="material-symbols-outlined text-outline text-sm">search</span>
              <input 
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-on-surface font-label text-sm w-full placeholder-outline focus:ring-0 p-0" 
                placeholder="Search..." type="text"
              />
            </div>
          </div>
          <div className="flex gap-lg items-center">
            <nav className="hidden md:flex gap-md font-label text-sm">
              <span onClick={() => toast("Filtering by Recent coming soon", { icon: '⏳' })} className="text-primary border-b-2 border-primary pb-1 font-bold cursor-pointer transition-opacity active:opacity-70">Recent</span>
              <span onClick={() => toast("Pinned chats coming soon", { icon: '📌' })} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-70">Pinned</span>
            </nav>
          </div>
          <div className="flex items-center gap-md">
            <button onClick={() => toast("No new notifications")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-70">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-primary/20 flex items-center justify-center font-bold text-primary">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden bg-surface-container-lowest">
          {/* Left Chat List Column */}
          <aside className={`w-full sm:w-[320px] ${sidebarOpen ? 'flex absolute inset-y-0 left-0 z-50 bg-surface-container-lowest' : 'hidden'} lg:flex flex-col border-r border-outline-variant/30 h-full`}>
            {sidebarOpen && (
              <div className="p-md flex justify-between items-center border-b border-outline-variant/20 lg:hidden bg-surface">
                <h2 className="font-headline text-xl font-bold text-on-surface">Chats</h2>
                <div className="flex gap-2">
                  <button onClick={handleLogout} className="text-error flex items-center justify-center p-2 rounded-lg hover:bg-error/10">
                    <span className="material-symbols-outlined">logout</span>
                  </button>
                  <button onClick={() => setSidebarOpen(false)} className="text-on-surface-variant p-2 rounded-lg hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            )}
            <div className="p-md border-b border-outline-variant/20">
              <div className="flex justify-between items-center mb-sm">
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  {viewMode === 'messages' ? 'Messages' : 'Groups'}
                </h2>
                <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded-full font-label text-xs font-bold">New</span>
              </div>
            </div>
            {viewMode === 'messages' ? (
              // Messages list
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loadingUsers ? (
                  <div className="text-center py-8 text-on-surface-variant font-label text-sm">Loading contacts...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant font-label text-sm">No contacts found</div>
                ) : (
                  filteredUsers.map(u => {
                    const online = isOnline(u._id);
                    const active = selectedUser?._id === u._id;
                    return (
                      <div 
                        key={u._id} 
                        onClick={() => handleUserSelect(u)}
                        className={`p-md border-b border-outline-variant/10 cursor-pointer transition-colors flex gap-md items-start group ${active ? 'bg-surface-container border-l-4 border-l-primary' : 'hover:bg-surface-container'}`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full overflow-hidden border transition-colors ${active ? 'border-2 border-primary' : 'border-outline-variant/30 group-hover:border-primary'}`}>
                            {u.avatar ? (
                              <img alt={u.name} src={u.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                                {getInitials(u.name)}
                              </div>
                            )}
                          </div>
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-container-lowest ${online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white'}`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-xs">
                            <h3 className="font-label text-sm text-on-surface font-bold truncate">{u.name}</h3>
                            {u.unreadCount > 0 && (
                              <span className="bg-primary text-on-primary rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm">
                                {u.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className={`font-body text-sm truncate ${active ? 'text-on-surface font-medium' : u.unreadCount > 0 ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                            {u.lastMessagePreview || u.email}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              // Groups list
              <GroupList 
                groups={groups}
                selectedGroupId={selectedGroup?._id}
                onSelectGroup={group => {
                  setSelectedGroup(group);
                  setSidebarOpen(false);
                }}
                onNewGroup={() => setShowGroupModal(true)}
                loading={loadingGroups}
              />
            )}
          </aside>

          {/* Center Chat Canvas */}
          <main className="flex-1 flex flex-col min-w-0 relative bg-surface-bright">
            {viewMode === 'messages' ? (
              // Messages mode
              selectedUser ? (
              <>
                {/* Sticky Chat Header */}
                <div className="h-16 border-b border-outline-variant/30 bg-surface flex items-center justify-between px-md sticky top-0 z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button className="lg:hidden text-on-surface-variant p-1 -ml-2 rounded-lg hover:bg-surface-variant transition-colors" onClick={() => { setSelectedUser(null); setSidebarOpen(true); }}>
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30">
                      {selectedUser.avatar ? (
                        <img alt={selectedUser.name} src={selectedUser.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                          {getInitials(selectedUser.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-label text-sm font-bold text-on-surface">{selectedUser.name}</h2>
                      <p className="font-body text-xs text-on-surface-variant flex items-center gap-1">
                        <span className={`w-2 h-2 border border-outline-variant/30 rounded-full ${isOnline(selectedUser._id) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white'}`}></span>
                        {isTyping ? 'typing...' : isOnline(selectedUser._id) ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-sm">
                    <button onClick={() => setShowMsgSearch(v => !v)} className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-variant transition-all" title="Search messages">
                      <span className="material-symbols-outlined">search</span>
                    </button>
                    <button onClick={() => toast('Video call coming soon', { icon: '📹' })} className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-variant transition-all">
                      <span className="material-symbols-outlined">videocam</span>
                    </button>
                    <button onClick={() => toast('Voice call coming soon', { icon: '📞' })} className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-variant transition-all">
                      <span className="material-symbols-outlined">call</span>
                    </button>
                  </div>
                </div>

                {/* In-chat search bar */}
                {showMsgSearch && (
                  <div className="bg-surface border-b border-outline-variant/30 px-md py-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant">search</span>
                    <input
                      value={msgSearch} onChange={e => setMsgSearch(e.target.value)}
                      placeholder="Search in conversation..."
                      className="flex-1 bg-transparent outline-none text-on-surface font-body text-sm"
                      autoFocus
                    />
                    {msgSearch && <button onClick={() => setMsgSearch('')} className="text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                  </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-md custom-scrollbar bg-chat-pattern relative">
                  {loadingMsgs ? (
                    <div className="text-center py-8 text-on-surface-variant font-label text-sm">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-on-surface-variant font-label text-sm">No messages yet. Say hi!</div>
                  ) : (
                    messages
                      .filter(m => !msgSearch || (m.text || '').toLowerCase().includes(msgSearch.toLowerCase()))
                      .map((m, index) => {
                      const isMe = m.senderId === user._id;
                      const isDeleted = m.deletedForEveryone;
                      return (
                        <div
                          key={m._id || index}
                          className={`flex gap-sm max-w-[80%] group ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
                          onContextMenu={(e) => openContextMenu(e, m)}
                        >
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-auto border border-outline-variant/30">
                              {selectedUser.avatar
                                ? <img alt={selectedUser.name} src={selectedUser.avatar} className="w-full h-full object-cover" />
                                : <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">{getInitials(selectedUser.name)}</div>
                              }
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            {/* Reply preview */}
                            {m.replyToSnapshot && !isDeleted && (
                              <div className={`px-3 py-1.5 rounded-lg border-l-4 border-primary text-xs ${isMe ? 'bg-primary/10 text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'} max-w-[240px] truncate`}>
                                <span className="font-bold block">{m.replyToSnapshot.senderName}</span>
                                {m.replyToSnapshot.image ? '📷 Photo' : m.replyToSnapshot.text}
                              </div>
                            )}
                            <div className={`${isMe ? 'bg-primary-container text-on-primary-container rounded-br-sm' : 'bg-surface text-on-surface border border-outline-variant/20 rounded-bl-sm'} rounded-2xl shadow-sm relative ${m.optimistic ? 'opacity-70' : ''} ${isDeleted ? 'opacity-50 italic' : ''}`}>
                              {/* Image */}
                              {m.image && !isDeleted && (
                                <img src={m.image} alt="" className="max-w-[240px] w-full rounded-xl mb-1 object-cover" />
                              )}
                              <div className="px-3 py-2">
                                {isDeleted
                                  ? <p className="font-body text-sm text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">block</span> This message was deleted</p>
                                  : m.text ? <p className="font-body text-base">{m.text}</p> : null
                                }
                                <span className="font-label text-[10px] flex justify-end items-center gap-0.5 mt-1">
                                  <span className={isMe ? 'text-primary' : 'text-on-surface-variant'}>{formatTime(m.createdAt)}</span>
                                  {isMe && !isDeleted && (
                                    m.optimistic
                                      ? <span className="material-symbols-outlined text-[13px] text-on-surface-variant/50">done</span>
                                      : m.seen
                                        ? <span className="material-symbols-outlined text-[13px] text-primary" title="Seen">done_all</span>
                                        : <span className="material-symbols-outlined text-[13px] text-on-surface-variant" title="Delivered">done_all</span>
                                  )}
                                </span>
                              </div>
                              {/* Reactions display */}
                              {m.reactions?.length > 0 && (
                                <div className="flex gap-0.5 flex-wrap px-2 pb-1">
                                  {Object.entries(
                                    m.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})
                                  ).map(([emoji, count]) => (
                                    <button key={emoji} onClick={() => handleReact(m, emoji)} className="bg-surface-container-low text-xs px-1.5 py-0.5 rounded-full border border-outline-variant/30 hover:bg-surface-variant transition-colors">
                                      {emoji}{count > 1 ? ` ${count}` : ''}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* Quick reaction on hover */}
                            {!isDeleted && !m.optimistic && (
                              <div className={`hidden group-hover:flex gap-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {QUICK_REACTIONS.map(e => (
                                  <button key={e} onClick={() => handleReact(m, e)} className="text-xs bg-surface border border-outline-variant/30 rounded-full px-1.5 py-0.5 hover:bg-surface-variant transition-colors shadow-sm">{e}</button>
                                ))}
                                <button onClick={(ev) => openContextMenu(ev, m)} className="text-[12px] bg-surface border border-outline-variant/30 rounded-full px-1.5 py-0.5 hover:bg-surface-variant transition-colors shadow-sm text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[14px]">more_vert</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {isTyping && (
                    <div className="flex gap-sm self-start max-w-[80%] mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-auto border border-outline-variant/30">
                        {selectedUser.avatar ? (
                          <img alt={selectedUser.name} src={selectedUser.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                            {getInitials(selectedUser.name)}
                          </div>
                        )}
                      </div>
                      <div className="bg-surface text-on-surface border border-outline-variant/20 rounded-2xl rounded-bl-sm p-md shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-surface border-t border-outline-variant/30 z-10">
                  {/* Reply preview bar */}
                  {replyTo && (
                    <div className="flex items-center gap-2 px-md py-2 bg-surface-container border-b border-outline-variant/20">
                      <div className="flex-1 border-l-4 border-primary pl-2">
                        <p className="text-xs font-bold text-primary">{replyTo.senderId === user._id ? 'You' : selectedUser.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{replyTo.image ? '📷 Photo' : replyTo.text}</p>
                      </div>
                      <button onClick={() => setReplyTo(null)} className="text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">close</span></button>
                    </div>
                  )}
                  {/* Image preview */}
                  {imagePreview && (
                    <div className="px-md py-2 flex items-center gap-3 bg-surface-container border-b border-outline-variant/20">
                      <img src={imagePreview.url} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-outline-variant/30" />
                      <span className="text-xs text-on-surface-variant flex-1 truncate">{imagePreview.file?.name}</span>
                      <button onClick={() => setImagePreview(null)} className="text-error"><span className="material-symbols-outlined text-[18px]">close</span></button>
                    </div>
                  )}
                  <div className="p-md">
                    <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-2 flex items-end gap-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                      <button onClick={() => setShowEmoji(v => !v)} className="p-2 text-on-surface-variant hover:text-primary transition-colors mb-1 rounded-lg hover:bg-surface-variant" title="Emoji">
                        <span className="material-symbols-outlined">mood</span>
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 text-on-surface-variant hover:text-primary transition-colors mb-1 rounded-lg hover:bg-surface-variant" title="Attach image">
                        <span className="material-symbols-outlined">attach_file</span>
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleImagePick} />
                      <textarea
                        value={message}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-on-surface font-body text-base resize-none max-h-32 min-h-[44px] py-2 placeholder-outline custom-scrollbar"
                        placeholder="Type a message..." rows="1"
                      />
                      <button
                        onClick={handleSend} disabled={(!message.trim() && !imagePreview) || sending}
                        className="p-3 bg-primary text-on-primary rounded-xl hover:bg-primary-dim transition-colors mb-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {sending
                          ? <span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>progress_activity</span>
                          : <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        }
                      </button>
                    </div>
                  </div>
                  {/* Emoji Picker */}
                  {showEmoji && (
                    <div className="absolute bottom-[80px] left-4 z-50 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl p-3 grid grid-cols-5 gap-1 w-[200px]">
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => { setMessage(prev => prev + e); setShowEmoji(false); }}
                          className="text-xl hover:bg-surface-container rounded-lg p-1 transition-colors">{e}</button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-xl">
                <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-md border border-outline-variant/20 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                </div>
                <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Welcome to PulseChat</h2>
                <p className="font-body text-on-surface-variant max-w-[448px] mb-6">Select a contact from the sidebar to start a conversation, or create a new chat to connect with someone new.</p>
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-primary w-auto px-6">
                  <span className="material-symbols-outlined">chat</span>
                  Open Chats
                </button>
              </div>
            )
          ) : (
            // Groups mode
            selectedGroup ? (
              <GroupChat groupId={selectedGroup._id} onBack={() => setSelectedGroup(null)} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-xl">
                <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-md border border-outline-variant/20 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-5xl">group</span>
                </div>
                <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">No Group Selected</h2>
                <p className="font-body text-on-surface-variant max-w-[448px] mb-6">Select a group from the sidebar or create a new one to get started.</p>
                <button onClick={() => setShowGroupModal(true)} className="btn-primary w-auto px-6">
                  <span className="material-symbols-outlined">add</span>
                  Create Group
                </button>
              </div>
            )
          )}
          </main>
        </div>
      </div>
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] bg-surface border border-outline-variant/30 rounded-xl shadow-xl py-1 min-w-[180px]"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 220) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-outline-variant/20">
            <p className="text-xs text-on-surface-variant font-bold">Quick Reactions</p>
            <div className="flex gap-1 mt-1">
              {QUICK_REACTIONS.map(e => (
                <button key={e} onClick={() => handleReact(contextMenu.message, e)}
                  className="text-base hover:bg-surface-container rounded-lg p-1 transition-colors">{e}</button>
              ))}
            </div>
          </div>
          <button onClick={() => { setReplyTo(contextMenu.message); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">reply</span> Reply
          </button>
          <button onClick={() => { navigator.clipboard.writeText(contextMenu.message.text || ''); toast.success('Copied!'); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">content_copy</span> Copy
          </button>
          {contextMenu.message.senderId === user._id && !contextMenu.message.deletedForEveryone && (
            <button onClick={() => handleDelete(contextMenu.message, true)}
              className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">delete</span> Delete for Everyone
            </button>
          )}
          <button onClick={() => handleDelete(contextMenu.message, false)}
            className="w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">delete_outline</span> Delete for Me
          </button>
          <button onClick={() => setContextMenu(null)}
            className="w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">close</span> Cancel
          </button>
        </div>
      )}
      {/* Dismiss overlays on outside click */}
      {(contextMenu || showEmoji) && (
        <div className="fixed inset-0 z-[9998]" onClick={() => { setContextMenu(null); setShowEmoji(false); }} />
      )}
      {/* New Group Modal */}
      <NewGroupModal 
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={(newGroup) => {
          setGroups([...groups, newGroup]);
          setSelectedGroup(newGroup);
          setViewMode('groups');
          setShowGroupModal(false);
        }}
        contacts={users}
      />
    </div>
  );
}
