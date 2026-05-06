import axios from 'axios';

const api = axios.create({
    // Use relative path for production to avoid CORS and environment variable issues
    baseURL: '/api'
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
