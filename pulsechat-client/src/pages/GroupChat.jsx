import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

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
      _id: `opt_${Date.now()}`,
      senderId: user._id,
      groupId: group._id,
      senderName: user.name,
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
        senderName: user.name,
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
                className={`flex gap-sm max-w-[80%] group ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
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
                  <div className={`rounded-lg px-md py-sm ${isMe ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}>
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
}
