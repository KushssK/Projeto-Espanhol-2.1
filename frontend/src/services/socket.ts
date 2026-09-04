import { io, Socket } from 'socket.io-client';

// Em desenvolvimento o backend roda em http://localhost:3000.
// Em produção o frontend (Vercel) e o backend (Render) estão em origens
// diferentes. O Socket.IO fica na MESMA origem da API REST — por isso, quando
// VITE_SOCKET_URL não está definida no build, derivamos a URL a partir de
// VITE_API_URL (que normalmente está configurada). Sem essa derivação, um build
// sem VITE_SOCKET_URL tentaria conectar em http://localhost:3000 (o computador
// do visitante) e o chat em tempo real nunca funcionaria.
const API_URL = import.meta.env.VITE_API_URL || '';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_ORIGIN || 'http://localhost:3000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  const token = localStorage.getItem('token');
  if (s && token) {
    s.auth = { token };
    if (!s.connected) {
      s.connect();
    }
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
