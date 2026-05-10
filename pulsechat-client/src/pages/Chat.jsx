import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket, disconnectSocket } from '../hooks/useSocket';
import { getUsersApi, getMessagesApi, sendMessageApi } from '../api';

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
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch users for sidebar
  useEffect(() => {
    getUsersApi()
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Failed to load contacts'))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Fetch messages when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMsgs(true);
    setMessages([]);
    getMessagesApi(selectedUser._id)
      .then(({ data }) => setMessages(data))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoadingMsgs(false));
  }, [selectedUser]);

  // Socket listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onReceiveMessage = (data) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        setMessages(prev => [...prev, data]);
      }
      // Update last message preview in sidebar
      setUsers(prev => prev.map(u =>
        u._id === data.senderId ? { ...u, lastMessagePreview: data.text } : u
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

    socket.on('receive_message', onReceiveMessage);
    socket.on('user_status', onUserStatus);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('user_status', onUserStatus);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
    };
  }, [socketRef, selectedUser]);

  const handleSend = async () => {
    if (!message.trim() || !selectedUser || sending) return;
    const text = message.trim();
    setMessage('');
    setSending(true);

    // Optimistic UI
    const optimistic = {
      _id: `opt_${Date.now()}`,
      senderId: user._id,
      text,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { data: saved } = await sendMessageApi(selectedUser._id, text);
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m._id === optimistic._id ? saved : m));

      // Notify receiver via socket
      socketRef.current?.emit('send_message', {
        senderId: user._id,
        receiverId: selectedUser._id,
        text,
        conversationId: saved.conversationId,
        _id: saved._id,
        createdAt: saved.createdAt,
      });
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
    } finally {
      setSending(false);
    }
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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOnline = (uid) => onlineUsers.has(uid);
  const isTyping = selectedUser && typingUsers.has(selectedUser._id);

  return (
    <div className="bg-background text-on-background h-screen flex overflow-hidden w-full relative">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-80 h-full bg-surface-container-lowest/50 border-r border-white/5 backdrop-blur-3xl fixed md:relative z-40 md:z-auto`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-margin-mobile border-b border-white/5">
          <h2 className="font-display-lg text-title-lg text-primary">Contacts</h2>
          <button onClick={handleLogout} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-error hover:bg-white/5 transition-all" title="Logout">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-md space-y-md hide-scrollbar">
          {/* Search */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors">search</span>
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border-none rounded-xl py-2 pl-10 pr-4 text-body-md focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/30 text-on-surface outline-none"
              placeholder="Search conversations..." type="text"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2">
            <button className="bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-1 text-label-sm font-label-sm">
              Online ({users.filter(u => isOnline(u._id)).length})
            </button>
            <button className="bg-white/5 text-on-surface-variant hover:bg-white/10 rounded-full px-4 py-1 text-label-sm font-label-sm transition-colors">All</button>
          </div>

          {/* Contact list */}
          <div className="space-y-sm">
            {loadingUsers ? (
              <div className="text-center py-8 text-on-surface-variant/40 text-body-md">Loading contacts...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant/40 text-body-md">No contacts found</div>
            ) : (
              filteredUsers.map(u => {
                const online = isOnline(u._id);
                const active = selectedUser?._id === u._id;
                return (
                  <div
                    key={u._id}
                    onClick={() => { setSelectedUser(u); setSidebarOpen(false); }}
                    className={`flex items-center gap-md p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5'}`}
                  >
                    <div className="relative w-12 h-12 shrink-0">
                      {u.avatar ? (
                        <img alt={u.name} src={u.avatar} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                          {getInitials(u.name)}
                        </div>
                      )}
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${online ? 'bg-primary status-glow-online' : 'bg-outline'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-body-lg truncate ${active ? 'text-primary' : 'text-on-surface'}`}>{u.name}</span>
                        {online && <span className="text-[10px] text-primary/60 font-label-sm uppercase tracking-wider">Active</span>}
                      </div>
                      <p className="text-body-md text-on-surface-variant/60 truncate">{u.email}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="relative flex-1 flex flex-col h-full bg-background overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center px-margin-mobile h-16 w-full bg-surface/10 backdrop-blur-xl border-b border-white/10 z-20 sticky top-0">
          <div className="flex items-center gap-md">
            <button className="md:hidden text-primary transition-all duration-300 active:scale-95" onClick={() => setSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            {selectedUser ? (
              <div className="flex items-center gap-sm">
                <div className="relative w-10 h-10">
                  {selectedUser.avatar ? (
                    <img alt={selectedUser.name} src={selectedUser.avatar} className="w-full h-full rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                      {getInitials(selectedUser.name)}
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${isOnline(selectedUser._id) ? 'bg-primary status-glow-online' : 'bg-outline'}`}></div>
                </div>
                <div>
                  <h1 className="font-title-lg text-title-lg text-primary leading-tight">{selectedUser.name}</h1>
                  <p className="text-label-sm font-label-sm" style={{ color: isTyping ? '#adc6ff' : 'rgba(173,198,255,0.6)' }}>
                    {isTyping ? 'typing...' : isOnline(selectedUser._id) ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-title-lg text-title-lg text-on-surface">PulseChat</h1>
                <p className="text-label-sm text-on-surface-variant/40 font-label-sm">Select a contact</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-sm">
            {selectedUser && (
              <>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 transition-all">
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 transition-all">
                  <span className="material-symbols-outlined">call</span>
                </button>
              </>
            )}
            <button onClick={handleLogout} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-error hover:bg-white/5 transition-all" title="Logout">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-margin-mobile py-lg space-y-lg relative z-10 scroll-smooth hide-scrollbar pb-32">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center pt-24">
              <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              </div>
              <h2 className="text-headline-md font-headline-md text-on-surface">Welcome, {user?.name}!</h2>
              <p className="text-body-md text-on-surface-variant/60">Select a contact from the sidebar to start chatting.</p>
            </div>
          ) : loadingMsgs ? (
            <div className="flex items-center justify-center pt-24">
              <span className="material-symbols-outlined text-primary text-[32px] animate-spin">progress_activity</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center pt-24">
              <span className="material-symbols-outlined text-on-surface-variant/30 text-[48px]">waving_hand</span>
              <p className="text-body-md text-on-surface-variant/40">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === user._id || msg.senderId?._id === user._id;
              return (
                <div key={msg._id} className={`flex ${isMine ? 'flex-col items-end gap-xs ml-auto' : 'items-end gap-sm'} max-w-[85%] md:max-w-[70%] ${isMine ? 'ml-auto' : ''}`}>
                  {!isMine && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                      {selectedUser.avatar ? (
                        <img alt={selectedUser.name} src={selectedUser.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {getInitials(selectedUser.name)}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-xs">
                    <div className={`p-md rounded-2xl text-body-md shadow-xl ${isMine ? 'message-out backdrop-blur-md text-on-surface-variant rounded-br-xs' : 'glass-surface text-on-surface rounded-bl-xs'} ${msg.optimistic ? 'opacity-70' : ''}`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                      <span className="text-[10px] text-on-surface-variant/40">{formatTime(msg.createdAt)}</span>
                      {isMine && <span className="material-symbols-outlined text-[12px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Message Input */}
        {selectedUser && (
          <div className="absolute bottom-xl left-margin-mobile right-margin-mobile z-30">
            <div className="glass-floating rounded-full p-2 flex items-center gap-2 border border-white/10 shadow-2xl">
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors shrink-0">
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 text-body-md text-on-surface placeholder:text-on-surface-variant/40 h-10 outline-none w-full"
                placeholder="Type a message..."
                type="text"
                value={message}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
              />
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors shrink-0">
                <span className="material-symbols-outlined">sentiment_satisfied</span>
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_20px_rgba(173,198,255,0.3)] hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-surface/10 backdrop-blur-2xl border-t border-white/10 rounded-t-xl">
          <div onClick={() => setSidebarOpen(true)} className="flex flex-col items-center justify-center bg-primary/20 text-primary rounded-full px-4 py-1 border border-primary/30 cursor-pointer">
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="font-label-sm text-label-sm">Chats</span>
          </div>
          <div className="flex flex-col items-center justify-center text-on-surface-variant/60">
            <span className="material-symbols-outlined">person_search</span>
            <span className="font-label-sm text-label-sm">Contacts</span>
          </div>
          <div className="flex flex-col items-center justify-center text-on-surface-variant/60">
            <span className="material-symbols-outlined">explore</span>
            <span className="font-label-sm text-label-sm">Explore</span>
          </div>
          <div onClick={handleLogout} className="flex flex-col items-center justify-center text-on-surface-variant/60 cursor-pointer">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-sm text-label-sm">Logout</span>
          </div>
        </nav>
      </main>

      {/* Background Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary-container/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
    </div>
  );
}
