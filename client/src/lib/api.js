import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem('flux_token');
  const token = rawToken?.trim();

  console.log('🔥 SENDING TOKEN:', token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute =
      err.config?.url?.includes('/auth/login') ||
      err.config?.url?.includes('/auth/register');

    if (err.response?.status === 401 && !isAuthRoute) {
      console.warn('❌ Unauthorized — token may be invalid');

      localStorage.removeItem('flux_token');
      localStorage.removeItem('flux_user');
    }

    return Promise.reject(err);
  }
);

export default api;