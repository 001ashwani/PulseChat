import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginApi = (data) => api.post('/auth/login', data);
export const registerApi = (data) => api.post('/auth/register', data);

// Users
export const getUsersApi = () => api.get('/users');

// Messages
export const getMessagesApi = (userId) => api.get(`/messages/${userId}`);
export const sendMessageApi = (receiverId, text) =>
  api.post(`/messages/send/${receiverId}`, { text });

export default api;
