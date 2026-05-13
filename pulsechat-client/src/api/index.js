import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginApi = (data) => api.post('/auth/login', data);
export const registerApi = (data) => api.post('/auth/register', data);

// Users
export const getUsersApi = () => api.get('/users');

// Messages
export const getMessagesApi = (userId) => api.get(`/messages/${userId}`);
export const sendMessageApi = (receiverId, payload) => api.post(`/messages/send/${receiverId}`, payload);
export const deleteMessageApi = (messageId, deleteForEveryone) =>
  api.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
export const reactToMessageApi = (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji });
export const uploadFileApi = (formData) =>
  api.post('/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Group Messages
export const sendGroupMessageApi = (groupId, payload) => api.post(`/messages/group/${groupId}`, payload);
export const getGroupMessagesApi = (groupId) => api.get(`/messages/group/${groupId}`);

// Groups
export const createGroupApi = (data) => api.post('/groups', data);
export const getGroupApi = (groupId) => api.get(`/groups/${groupId}`);
export const updateGroupApi = (groupId, data) => api.patch(`/groups/${groupId}`, data);
export const addGroupMembersApi = (groupId, memberIds) => api.post(`/groups/${groupId}/members`, { memberIds });
export const removeGroupMemberApi = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`);
export const leaveGroupApi = (groupId) => api.post(`/groups/${groupId}/leave`);
export const deleteGroupApi = (groupId) => api.delete(`/groups/${groupId}`);

export default api;
