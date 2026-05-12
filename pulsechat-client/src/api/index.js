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

export default api;
