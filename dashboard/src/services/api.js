import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4051/api',
  withCredentials: true,
  timeout: 30000
});

export default api;
