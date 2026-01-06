import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4051/api',
  withCredentials: true,
  timeout: 30000
});

// Extended timeout for long-running AI operations (2 minutes)
export const AI_TIMEOUT = 120000;

export default api;
