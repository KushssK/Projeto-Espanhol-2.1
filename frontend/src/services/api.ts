import axios from 'axios';

// O backend rodará na porta 3000 por padrão
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Origem do servidor (para montar URLs absolutas de mídia/upload)
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/**
 * Converte um caminho relativo de mídia (ex.: /uploads/avatars/x.png)
 * em URL absoluta apontando para o servidor de arquivos.
 */
export const assetUrl = (path?: string | null): string =>
  path ? `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}` : '';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para injetar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
