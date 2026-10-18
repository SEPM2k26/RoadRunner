import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Unknown error';
    return Promise.reject(new Error(msg));
  }
);

export default api;

// ── Person 1 APIs ───────────────────────────────────────────────
export const vehiclesAPI = {
  getAll:  (params) => api.get('/vehicles', { params }),
  getOne:  (id)     => api.get(`/vehicles/${id}`),
  create:  (data)   => api.post('/vehicles', data),
  update:  (id, data) => api.put(`/vehicles/${id}`, data),
  remove:  (id)     => api.delete(`/vehicles/${id}`),
};

export const driversAPI = {
  getAll:  (params) => api.get('/drivers', { params }),
  getOne:  (id)     => api.get(`/drivers/${id}`),
  create:  (data)   => api.post('/drivers', data),
  update:  (id, data) => api.put(`/drivers/${id}`, data),
  remove:  (id)     => api.delete(`/drivers/${id}`),
};

export const fuelAPI = {
  getAll:  (params) => api.get('/fuel', { params }),
  create:  (data)   => api.post('/fuel', data),
  update:  (id, data) => api.put(`/fuel/${id}`, data),
  remove:  (id)     => api.delete(`/fuel/${id}`),
};

export const maintenanceAPI = {
  getAll:  (params) => api.get('/maintenance', { params }),
  getDue:  ()       => api.get('/maintenance/due'),
  create:  (data)   => api.post('/maintenance', data),
  update:  (id, data) => api.put(`/maintenance/${id}`, data),
  remove:  (id)     => api.delete(`/maintenance/${id}`),
};

// ── Person 2 APIs ───────────────────────────────────────────────
export const routesAPI = {
  getAll:  (params) => api.get('/routes', { params }),
  getOne:  (id)     => api.get(`/routes/${id}`),
  create:  (data)   => api.post('/routes', data),
  update:  (id, data) => api.put(`/routes/${id}`, data),
  remove:  (id)     => api.delete(`/routes/${id}`),
};

export const tripsAPI = {
  getAll:  (params) => api.get('/trips', { params }),
  getOne:  (id)     => api.get(`/trips/${id}`),
  create:  (data)   => api.post('/trips', data),
  update:  (id, data) => api.put(`/trips/${id}`, data),
};

export const incidentsAPI = {
  getAll:  (params) => api.get('/incidents', { params }),
  getOne:  (id)     => api.get(`/incidents/${id}`),
  create:  (data)   => api.post('/incidents', data),
  update:  (id, data) => api.put(`/incidents/${id}`, data),
  remove:  (id)     => api.delete(`/incidents/${id}`),
};

// ── Person 3 APIs ───────────────────────────────────────────────
export const reportsAPI = {
  fleet:     () => api.get('/reports/fleet'),
  fuel:      () => api.get('/reports/fuel'),
  trips:     (params) => api.get('/reports/trips', { params }),
  incidents: () => api.get('/reports/incidents'),
};

export const predictionsAPI = {
  predict:  (data) => api.post('/predictions/delay', data),
  history:  (params) => api.get('/predictions/delay', { params }),
};

export const schemaAPI = {
  get: () => api.get('/schema'),
};
