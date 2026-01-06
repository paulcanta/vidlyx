import api from './api';

export const tagService = {
  getAll: () => api.get('/tags'),
  search: (query) => api.get('/tags/search', { params: { q: query } }),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`)
};

export default tagService;
