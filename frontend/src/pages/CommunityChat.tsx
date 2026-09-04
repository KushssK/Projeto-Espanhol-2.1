import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, assetUrl } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import {
  Send,
  Image,
  Plus,
  User as UserIcon,
  MessageSquare,
  Globe,
  Lock,
  Search,
  X,
  Users,
  UserPlus,
  UserMinus,
  Ban,
  LogOut,
} from 'lucide-react';

interface Message {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'AUDIO' | 'PDF' | null;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface RoomUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface RoomMember {
  userId: string;
  joinedAt?: string;
  lastReadAt?: string | null;
  user: RoomUser;
}

interface ChatRoom {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string | null;
  members: RoomMember[];
  lastMessage?: any | null;
  unread?: boolean;
}

interface FriendUser {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  role?: string;
}

interface SearchUser extends FriendUser {
  isFriend?: boolean;
}

type ModalKind = 'none' | 'addFriend' | 'createGroup';

export const CommunityChat: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { themeColor } = useThemeStore();

  // ---------- Conversas / chat ----------
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  // Contador local de mensagens não lidas (chave = roomId)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  // Participantes visíveis (grupo)
  const [showMembers, setShowMembers] = useState(false);

  // ---------- Amigos / bloqueios ----------
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'friends'>('chats');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<FriendUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // ---------- Modais ----------
  const [modal, setModal] = useState<ModalKind>('none');
  // Busca de pessoa (modal Adicionar amigo)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  // Criação de grupo (seleção entre amigos)
  const [groupName, setGroupName] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs "live" usadas pelos handlers de socket (listeners estáveis)
  const activeRoomIdRef = useRef<string | null>(null);
  const roomsRef = useRef<ChatRoom[]>([]);
  const currentUserIdRef = useRef<string | undefined>(currentUser?.id);

  // ==========================================================================
  // Helpers de exibição
  // ==========================================================================
  const getRoomDisplayName = useCallback(
    (room: ChatRoom) => {
      if (room.type === 'GROUP' && room.name) return room.name;
      const other = room.members.find((m) => m.userId !== currentUser?.id);
      return other?.user.username || 'Conversa';
    },
    [currentUser?.id]
  );

  const timeOf = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const unreadOf = (roomId: string) => unreadCounts[roomId] || 0;

  // ==========================================================================
  // Carregamento de dados
  // ==========================================================================
  const loadRooms = useCallback(async (): Promise<ChatRoom[]> => {
    try {
      const res = await api.get('/chat/rooms');
      const data: ChatRoom[] = res.data;
      setRooms(data);
      const counts: Record<string, number> = {};
      for (const room of data) {
        if (room.unread) counts[room.id] = (counts[room.id] || 0) + 1;
      }
      setUnreadCounts(counts);
      return data;
    } catch (err) {
      console.error('Erro ao buscar salas de chat:', err);
      return [];
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const res = await api.get('/friends');
      setFriends(res.data || []);
    } catch (err) {
      console.error('Erro ao buscar amigos:', err);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  const loadBlocks = useCallback(async () => {
    try {
      const res = await api.get('/friends/blocks');
      setBlockedUsers(res.data || []);
    } catch (err) {
      console.error('Erro ao buscar bloqueados:', err);
    }
  }, []);

  // ==========================================================================
  // Socket — conexão e listeners estáveis (registrados UMA única vez)
  // ==========================================================================
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    void loadRooms();
    void loadFriends();
    void loadBlocks();

    const handleConnect = () => {
      setTypingUsers([]);
      const roomId = activeRoomIdRef.current;
      if (roomId) socket.emit('join_room', roomId);
    };

    const handleReceiveMessage = (message: Message & { chatRoomId: string }) => {
      const roomId = message.chatRoomId;

      // Atualiza a prévia na barra lateral; recarrega se a conversa ainda não existe
      setRooms((prev) => {
        const exists = prev.some((r) => r.id === roomId);
        if (!exists) {
          void loadRooms();
          return prev;
        }
        return prev.map((r) => (r.id === roomId ? { ...r, lastMessage: message } : r));
      });

      // Contador de não lidas: só conta quando a sala NÃO está aberta aqui
      if (roomId === activeRoomIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
      } else if (message.sender.id !== currentUserIdRef.current) {
        setUnreadCounts((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
      }
    };

    // Eventos do sistema de amigos (sala pessoal user:{id})
    const handleFriendsUpdated = () => {
      void loadFriends();
    };
    const handleBlocksUpdated = () => {
      void loadBlocks();
    };

    // Alguém saiu de um grupo aberto → atualiza participantes
    const handleMemberLeft = async (data: { roomId: string; userId: string }) => {
      const list = await loadRooms();
      const updated = list.find((r) => r.id === data.roomId);
      if (updated && activeRoomIdRef.current === data.roomId) {
        setActiveRoom(updated);
      }
    };

    const handleUserTyping = ({ userId, roomId }: { userId: string; roomId: string }) => {
      if (roomId !== activeRoomIdRef.current) return;
      if (userId === currentUserIdRef.current) return;
      const room = roomsRef.current.find((r) => r.id === roomId);
      const name =
        room?.members.find((m) => m.userId === userId)?.user.username || 'Alguém';
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    };
    const handleUserStopTyping = ({ userId, roomId }: { userId: string; roomId: string }) => {
      if (roomId !== activeRoomIdRef.current) return;
      const room = roomsRef.current.find((r) => r.id === roomId);
      const name =
        room?.members.find((m) => m.userId === userId)?.user.username || 'Alguém';
      setTypingUsers((prev) => prev.filter((u) => u !== name));
    };

    const handleSocketError = (data: { message: string }) => {
      console.error('[socket error]', data.message);
      // Mensagens bloqueadas aparecem para o próprio usuário tentar
      if (data.message && /não pode enviar/.test(data.message)) {
        alert('Esta conversa está bloqueada. Você não pode enviar mensagens.');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('error', handleSocketError);
    socket.on('friends_updated', handleFriendsUpdated);
    socket.on('blocks_updated', handleBlocksUpdated);
    socket.on('member_left', handleMemberLeft);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('error', handleSocketError);
      socket.off('friends_updated', handleFriendsUpdated);
      socket.off('blocks_updated', handleBlocksUpdated);
      socket.off('member_left', handleMemberLeft);
    };
  }, [loadRooms, loadFriends, loadBlocks]);

  // Refs sincronizadas para os handlers de socket
  useEffect(() => {
    activeRoomIdRef.current = activeRoom?.id ?? null;
  }, [activeRoom]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id;
  }, [currentUser?.id]);

  // Rolar para o final do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ==========================================================================
  // Seleção / criação de conversas
  // ==========================================================================
  const selectRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setTypingUsers([]);
    setShowMembers(false);

    // Entra na sala (reforço — o backend já adiciona todas as salas na conexão)
    getSocket().emit('join_room', room.id);

    // Marca como lida (local + servidor)
    setUnreadCounts((prev) => ({ ...prev, [room.id]: 0 }));
    api.post(`/chat/rooms/${room.id}/read`).catch(() => undefined);

    try {
      const res = await api.get(`/chat/rooms/${room.id}/messages?limit=100`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  };

  const openPrivateWithFriend = async (friend: FriendUser) => {
    const existing = rooms.find(
      (r) => r.type === 'PRIVATE' && r.members.some((m) => m.userId === friend.id)
    );
    if (existing) {
      setSidebarTab('chats');
      void selectRoom(existing);
      return;
    }

    try {
      const res = await api.post('/chat/rooms/private', { targetUserId: friend.id });
      const room: ChatRoom = res.data;
      setRooms((prev) => [room, ...prev.filter((r) => r.id !== room.id)]);
      setSidebarTab('chats');
      void selectRoom(room);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao iniciar conversa.');
    }
  };

  const leaveGroup = async (room: ChatRoom) => {
    if (room.type !== 'GROUP') return;
    if (!window.confirm('Sair deste grupo? Você deixará de receber as mensagens dele.')) return;
    try {
      await api.post(`/chat/rooms/${room.id}/leave`);
      // Remove o socket atual da sala no servidor
      getSocket().emit('leave_room', room.id);
      setActiveRoom(null);
      setMessages([]);
      void loadRooms();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao sair do grupo.');
    }
  };

  // Auto-selecionar a primeira conversa após o carregamento
  useEffect(() => {
    if (!activeRoom && rooms.length > 0 && !loadingRooms) {
      void selectRoom(rooms[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom, rooms, loadingRooms]);

  // ==========================================================================
  // Sistema de amigos
  // ==========================================================================
  const runUserSearch = useCallback(
    async (q: string) => {
      const term = q.trim();
      if (term.length < 2) {
        setSearchResults([]);
        setSearchDone(false);
        return;
      }
      setSearchingUsers(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(term)}`);
        setSearchResults(
          (res.data || []).filter((u: SearchUser) => u.id !== currentUser?.id)
        );
        setSearchDone(true);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    },
    [currentUser?.id]
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      void runUserSearch(val);
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleAddFriend = async (target: SearchUser) => {
    try {
      await api.post('/friends', { targetUserId: target.id });
      // Remove do resultado e atualiza a lista
      setSearchResults((prev) => prev.filter((u) => u.id !== target.id));
      void loadFriends();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao adicionar amigo.';
      if (/já são amigos|bloqueio/.test(msg)) {
        // Estado dessincronizado (outra aba) — recarrega listas e resultados
        void loadFriends();
        void runUserSearch(searchTerm);
      }
      alert(msg);
    }
  };

  const handleRemoveFriend = async (friend: FriendUser) => {
    if (!window.confirm(`Remover @${friend.username || 'usuario'} dos seus amigos?`)) return;
    try {
      await api.delete(`/friends/${friend.id}`);
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover amigo.');
    }
  };

  const handleBlockUser = async (friend: FriendUser) => {
    if (
      !window.confirm(
        `Bloquear @${friend.username || 'usuario'}? Ele não aparecerá nas suas buscas e não poderá enviar mensagens.`
      )
    )
      return;
    try {
      await api.post(`/friends/${friend.id}/block`);
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
      void loadBlocks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao bloquear usuário.');
    }
  };

  const handleUnblockUser = async (user: FriendUser) => {
    try {
      await api.post(`/friends/${user.id}/unblock`);
      setBlockedUsers((prev) => prev.filter((b) => b.id !== user.id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao desbloquear usuário.');
    }
  };

  const toggleGroupSelection = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedGroupIds.length === 0) return;
    setCreating(true);
    try {
      const res = await api.post('/chat/rooms/group', {
        name: groupName.trim(),
        memberIds: selectedGroupIds,
      });
      const room: ChatRoom = res.data;
      setRooms((prev) => [room, ...prev.filter((r) => r.id !== room.id)]);
      closeModal();
      setSidebarTab('chats');
      void selectRoom(room);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar o grupo.');
    } finally {
      setCreating(false);
    }
  };

  const openModal = (kind: ModalKind) => {
    setModal(kind);
    if (kind === 'createGroup') setSelectedGroupIds([]);
    if (kind === 'addFriend') {
      setSearchTerm('');
      setSearchResults([]);
      setSearchDone(false);
    }
  };

  const closeModal = () => {
    setModal('none');
    setGroupName('');
    setSelectedGroupIds([]);
    setSearchTerm('');
    setSearchResults([]);
    setSearchDone(false);
  };

  // ==========================================================================
  // Envio de mensagens
  // ==========================================================================
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    const socket = getSocket();
    const text = newMessage.trim();
    setNewMessage('');

    // Socket persiste + faz broadcast (evita duplicidade via REST)
    socket.emit('send_message', { roomId: activeRoom.id, content: text });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { roomId: activeRoom.id });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!activeRoom) return;
    const socket = getSocket();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (e.target.value.length > 0) {
      socket.emit('typing', { roomId: activeRoom.id });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { roomId: activeRoom.id });
      }, 2000);
    } else {
      socket.emit('stop_typing', { roomId: activeRoom.id });
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/chat/rooms/${activeRoom.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // A mensagem chega via socket receive_message (broadcast do controller)
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err);
      alert('Erro ao enviar arquivo. Verifique se ele tem até 20MB e um formato permitido.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ==========================================================================
  // UI auxiliares
  // ==========================================================================
  const Avatar = ({ url, size }: { url?: string | null; size?: number }) => {
    const s = size || 40;
    return url ? (
      <img src={assetUrl(url)} alt="" className="rounded-full object-cover border border-[var(--border-color)] shrink-0" style={{ width: s, height: s }} />
    ) : (
      <div
        className="rounded-full bg-[var(--border-color)] flex items-center justify-center shrink-0"
        style={{ width: s, height: s, color: 'var(--text-muted)' }}
      >
        <UserIcon size={s * 0.45} />
      </div>
    );
  };

  const RoleBadge = ({ role }: { role?: string }) => {
    if (role === 'ADMIN')
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-500/10 text-red-500">Admin</span>
      );
    if (role === 'TEACHER')
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/10 text-amber-500">Prof</span>
      );
    return null;
  };

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* ============ Sidebar: Conversas | Amigos ============ */}
      <div className="w-full md:w-80 glass border-2 border-[var(--border-color)] rounded-[24px] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <MessageSquare size={18} style={{ color: themeColor }} /> Comunidade
            </h3>
          </div>

          <div className="flex rounded-xl p-1 bg-[var(--panel-bg)] border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setSidebarTab('chats')}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: sidebarTab === 'chats' ? 'var(--bg-color)' : 'transparent',
                color: sidebarTab === 'chats' ? themeColor : 'var(--text-muted)',
                boxShadow: sidebarTab === 'chats' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <MessageSquare size={14} /> Conversas
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('friends')}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: sidebarTab === 'friends' ? 'var(--bg-color)' : 'transparent',
                color: sidebarTab === 'friends' ? themeColor : 'var(--text-muted)',
                boxShadow: sidebarTab === 'friends' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Users size={14} /> Amigos {friends.length > 0 && `(${friends.length})`}
            </button>
          </div>
        </div>

        {/* ---------- ABA CONVERSAS ---------- */}
        {sidebarTab === 'chats' && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {loadingRooms && (
              <p className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>
                Carregando conversas...
              </p>
            )}
            {!loadingRooms && rooms.length === 0 && (
              <div className="text-center py-8 px-4 flex flex-col items-center gap-3">
                <MessageSquare size={28} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma conversa ativa ainda.
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarTab('friends')}
                  className="btn-3d text-xs font-bold py-2 px-4"
                  style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                >
                  <UserPlus size={14} /> Adicionar amigos para começar
                </button>
              </div>
            )}
            {rooms.map((room) => {
              const isSelected = activeRoom?.id === room.id;
              const unread = unreadOf(room.id);
              return (
                <div
                  key={room.id}
                  onClick={() => void selectRoom(room)}
                  className="p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between gap-2 cursor-pointer hover:border-[var(--primary-color)] transition-all"
                  style={isSelected ? { borderColor: themeColor, backgroundColor: 'var(--primary-soft)' } : {}}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[var(--border-color)] flex items-center justify-center shrink-0" style={{ color: themeColor }}>
                      {room.type === 'PRIVATE' ? <Lock size={18} /> : <Globe size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold truncate flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                        {getRoomDisplayName(room)}
                        {unread > 0 && (
                          <span
                            className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                            style={{ backgroundColor: themeColor }}
                          >
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </h4>
                      {room.lastMessage && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          <strong>{room.lastMessage.sender?.username}:</strong>{' '}
                          {room.lastMessage.content || 'Arquivo'}
                        </p>
                      )}
                    </div>
                  </div>
                  {room.lastMessage && (
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {timeOf(room.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ---------- ABA AMIGOS ---------- */}
        {sidebarTab === 'friends' && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openModal('addFriend')}
                className="btn-3d text-[11px] font-bold py-2 px-2 flex items-center justify-center gap-1.5"
                style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
              >
                <UserPlus size={14} /> Adicionar amigo
              </button>
              <button
                type="button"
                onClick={() => openModal('createGroup')}
                className="btn-3d text-[11px] font-bold py-2 px-2 flex items-center justify-center gap-1.5"
                style={{ '--btn-bg': 'var(--text-muted)', '--btn-shadow': 'var(--border-color)' } as any}
              >
                <Users size={14} /> Criar grupo
              </button>
            </div>

            <p className="text-[10px] font-black uppercase tracking-wider pt-1" style={{ color: 'var(--text-muted)' }}>
              Seus amigos ({friends.length})
            </p>

            {loadingFriends && (
              <p className="text-center text-xs py-4" style={{ color: 'var(--text-muted)' }}>
                Carregando amigos...
              </p>
            )}

            {!loadingFriends && friends.length === 0 && (
              <div className="text-center py-6 px-3 flex flex-col items-center gap-2">
                <UserPlus size={26} style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  Você ainda não tem amigos aqui.
                </p>
                <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                  Use &quot;Adicionar amigo&quot; e busque alguém por @username ou e-mail.
                </p>
              </div>
            )}

            {friends.map((friend) => (
              <div
                key={friend.id}
                className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar url={friend.avatarUrl} size={36} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-extrabold truncate" style={{ color: 'var(--text-main)' }}>
                        @{friend.username || 'usuario'}
                      </p>
                      <RoleBadge role={friend.role} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => void openPrivateWithFriend(friend)}
                    title="Conversar"
                    className="p-1.5 rounded-lg border border-[var(--border-color)] cursor-pointer hover:bg-[var(--primary-light)] transition-colors"
                    style={{ background: 'transparent', color: themeColor }}
                  >
                    <MessageSquare size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemoveFriend(friend)}
                    title="Remover amigo"
                    className="p-1.5 rounded-lg border border-[var(--border-color)] cursor-pointer hover:bg-[var(--color-danger)]/10 transition-colors"
                    style={{ background: 'transparent', color: 'var(--text-muted)' }}
                  >
                    <UserMinus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBlockUser(friend)}
                    title="Bloquear usuário"
                    className="p-1.5 rounded-lg border border-[var(--border-color)] cursor-pointer hover:bg-red-500/10 transition-colors"
                    style={{ background: 'transparent', color: 'var(--color-danger)' }}
                  >
                    <Ban size={13} />
                  </button>
                </div>
              </div>
            ))}

            {/* Bloqueados */}
            {blockedUsers.length > 0 && (
              <>
                <p className="text-[10px] font-black uppercase tracking-wider pt-2" style={{ color: 'var(--text-muted)' }}>
                  Bloqueados ({blockedUsers.length})
                </p>
                {blockedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-2 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--panel-bg)]/60 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar url={u.avatarUrl} size={28} />
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-muted)' }}>
                        @{u.username || 'usuario'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleUnblockUser(u)}
                      className="text-[11px] font-bold border border-[var(--border-color)] rounded-lg px-2 py-1 cursor-pointer hover:bg-[var(--bg-color)] shrink-0"
                      style={{ background: 'transparent', color: themeColor }}
                    >
                      Desbloquear
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ============ Caixa de Chat ============ */}
      <div className="flex-1 glass border-2 border-[var(--border-color)] rounded-[24px] flex flex-col overflow-hidden">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-[var(--border-color)] flex items-center justify-center shrink-0" style={{ color: themeColor }}>
                  {activeRoom.type === 'PRIVATE' ? <Lock size={18} /> : <Globe size={18} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold truncate" style={{ color: 'var(--text-main)' }}>
                    {getRoomDisplayName(activeRoom)}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {activeRoom.type === 'PRIVATE' ? 'Conversa privada entre amigos' : 'Conversa em grupo'}
                    </span>
                    {activeRoom.type === 'GROUP' && (
                      <button
                        type="button"
                        onClick={() => setShowMembers((v) => !v)}
                        className="text-[11px] font-bold border-none cursor-pointer bg-transparent underline underline-offset-2"
                        style={{ color: themeColor }}
                      >
                        {activeRoom.members.length} membro{activeRoom.members.length !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {activeRoom.type === 'GROUP' && (
                <button
                  type="button"
                  onClick={() => void leaveGroup(activeRoom)}
                  className="flex items-center gap-1.5 text-xs font-bold border border-[var(--border-color)] rounded-lg px-3 py-2 cursor-pointer hover:bg-red-500/10 transition-colors shrink-0"
                  style={{ background: 'transparent', color: 'var(--color-danger)' }}
                  title="Sair do grupo"
                >
                  <LogOut size={13} /> Sair
                </button>
              )}
            </div>

            {/* Participantes (grupo) */}
            {activeRoom.type === 'GROUP' && showMembers && (
              <div className="px-6 py-3 border-b border-[var(--border-color)] bg-[var(--panel-bg)]/40 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {activeRoom.members.map((m) => (
                  <span
                    key={m.userId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <Avatar url={m.user.avatarUrl} size={18} />
                    @{m.user.username || 'usuario'}
                    {m.userId === currentUser?.id && <span style={{ color: themeColor }}>(você)</span>}
                  </span>
                ))}
              </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[var(--bg-color)]/30">
              {messages.map((msg) => {
                const isMe = msg.sender.id === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[75%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                    <Avatar url={msg.sender.avatarUrl} size={36} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold px-1" style={{ color: 'var(--text-muted)', textAlign: isMe ? 'right' : 'left' }}>
                        {msg.sender.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className="px-4 py-2.5 rounded-[18px] border text-sm"
                        style={{
                          backgroundColor: isMe ? themeColor : 'var(--panel-bg)',
                          color: isMe ? '#FFFFFF' : 'var(--text-main)',
                          borderColor: isMe ? 'transparent' : 'var(--border-color)',
                          borderRadius: isMe ? '18px 2px 18px 18px' : '2px 18px 18px 18px',
                        }}
                      >
                        {msg.content && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>}

                        {msg.mediaUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden">
                            {msg.mediaType === 'IMAGE' ? (
                              <img src={assetUrl(msg.mediaUrl)} alt="Midia" className="max-w-full h-auto object-cover max-h-60 rounded" />
                            ) : msg.mediaType === 'AUDIO' ? (
                              <audio src={assetUrl(msg.mediaUrl)} controls className="w-full h-8" />
                            ) : (
                              <a
                                href={assetUrl(msg.mediaUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold flex items-center gap-1.5 text-xs underline"
                                style={{ color: isMe ? '#FFFFFF' : themeColor }}
                              >
                                📁 Baixar Arquivo Anexo
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Rodapé */}
            <div className="p-4 border-t border-[var(--border-color)] flex flex-col gap-2">
              {typingUsers.length > 0 && (
                <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está' : 'estão'} digitando...
                </span>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => void handleUploadFile(e)}
                  className="hidden"
                  accept="image/*,audio/*,application/pdf,text/plain"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 w-11 rounded-xl border border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-color)] shrink-0"
                  style={{ color: 'var(--text-muted)', background: 'none' }}
                  title="Enviar anexo (até 20MB)"
                >
                  <Image size={20} />
                </button>

                <input
                  type="text"
                  placeholder="Escreva sua mensagem em espanhol..."
                  className="input-gamified flex-1"
                  value={newMessage}
                  onChange={handleTyping}
                  style={{ borderRadius: '12px' }}
                />

                <button
                  type="submit"
                  className="btn-3d h-11 w-11 shrink-0"
                  style={{ padding: 0, borderRadius: '12px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center" style={{ color: 'var(--text-muted)' }}>
            <MessageSquare size={48} />
            <p className="font-bold">Selecione uma conversa ou fale com um amigo.</p>
            <p className="text-sm">Use a aba Amigos para iniciar conversas privadas e grupos.</p>
          </div>
        )}
      </div>

      {/* ============ Modal: Adicionar amigo ============ */}
      {modal === 'addFriend' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass p-6 rounded-[24px] border border-[var(--border-color)] max-w-md w-full flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <UserPlus size={18} style={{ color: themeColor }} /> Adicionar amigo
              </h3>
              <button
                onClick={closeModal}
                className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer border border-[var(--border-color)] bg-transparent"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              A comunidade é privada: ninguém aparece aqui sem uma busca explícita.
              Procure por @username ou e-mail.
            </p>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Digite @username ou e-mail (mín. 2 caracteres)..."
                  className="input-gamified w-full"
                  style={{ paddingLeft: '36px' }}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {searchingUsers && (
                <p className="text-center text-xs py-4" style={{ color: 'var(--text-muted)' }}>Buscando...</p>
              )}
              {!searchingUsers && searchTerm.trim().length >= 2 && searchDone && searchResults.length === 0 && (
                <p className="text-center text-xs py-4" style={{ color: 'var(--text-muted)' }}>
                  Nenhum usuário encontrado com este termo.
                </p>
              )}
              {!searchingUsers && searchTerm.trim().length < 2 && (
                <div className="text-center py-6 px-3 border border-dashed border-[var(--border-color)] rounded-xl">
                  <UserPlus size={22} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs font-bold mt-1" style={{ color: 'var(--text-muted)' }}>
                    Digite ao menos 2 caracteres para buscar.
                  </p>
                </div>
              )}

              {!searchingUsers && searchResults.length > 0 && (
                <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--panel-bg)] max-h-[240px] overflow-y-auto">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-color)] last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar url={u.avatarUrl} size={34} />
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-extrabold truncate" style={{ color: 'var(--text-main)' }}>
                            @{u.username || 'usuario'}
                          </p>
                          <RoleBadge role={u.role} />
                        </div>
                      </div>
                      {u.isFriend ? (
                        <span
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg shrink-0"
                          style={{ color: themeColor, backgroundColor: 'var(--primary-light)' }}
                        >
                          Amigo ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleAddFriend(u)}
                          className="btn-3d text-[11px] font-bold px-3 py-1.5 shrink-0"
                          style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                        >
                          <Plus size={12} /> Adicionar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ Modal: Criar grupo ============ */}
      {modal === 'createGroup' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass p-6 rounded-[24px] border border-[var(--border-color)] max-w-md w-full flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Users size={18} style={{ color: themeColor }} /> Criar grupo
              </h3>
              <button
                onClick={closeModal}
                className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer border border-[var(--border-color)] bg-transparent"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-8 px-4 flex flex-col items-center gap-3">
                <UserPlus size={28} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                  Grupos só podem ser criados com amigos.
                </p>
                <button
                  type="button"
                  onClick={() => openModal('addFriend')}
                  className="btn-3d text-xs font-bold py-2 px-4"
                  style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                >
                  <UserPlus size={14} /> Adicionar amigos primeiro
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Nome do grupo..."
                  className="input-gamified"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Selecione amigos ({selectedGroupIds.length} de {friends.length})
                  </span>
                  <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--panel-bg)] max-h-[220px] overflow-y-auto">
                    {friends.map((f) => {
                      const selected = selectedGroupIds.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleGroupSelection(f.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--bg-color)] cursor-pointer"
                          style={{ background: selected ? 'var(--primary-light)' : 'none' }}
                        >
                          <div
                            className="h-5 w-5 rounded-md border flex items-center justify-center shrink-0"
                            style={{
                              borderColor: selected ? themeColor : 'var(--border-color)',
                              color: selected ? '#fff' : 'transparent',
                              backgroundColor: selected ? themeColor : 'transparent',
                            }}
                          >
                            {selected && '✓'}
                          </div>
                          <Avatar url={f.avatarUrl} size={30} />
                          <span className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>
                            @{f.username || 'usuario'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="btn-3d btn-secondary flex-1 text-sm font-bold py-2">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !groupName.trim() || selectedGroupIds.length === 0}
                    className="btn-3d flex-1 text-sm font-bold py-2"
                    style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                  >
                    {creating ? 'Criando...' : 'Criar grupo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
