import axios from 'axios';

// O backend rodará na porta 3000 por padrão
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Origem do servidor (para montar URLs absolutas de mídia/upload)
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/**
 * Converte um caminho relativo de mídia (ex.: /uploads/avatars/x.png)
 * em URL absoluta apontando para o servidor de arquivos.
 * URLs já absolutas (ex.: Supabase Storage) passam direto.
 */
export const assetUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path; // já é URL absoluta
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

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

// Interceptor de sessão expirada: 401 em qualquer chamada autenticada
// encerra a sessão local e volta ao login (evita falhas silenciosas com
// mensagens genéricas — ex.: salvar cor/logo no painel admin).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthCall && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);
