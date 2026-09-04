import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, assetUrl } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { Send, Image, Plus, User as UserIcon, MessageSquare, Globe, Lock, Search, X, Users } from 'lucide-react';

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
  user: RoomUser;
}

interface ChatRoom {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string | null;
  members: RoomMember[];
  lastMessage?: any | null;
}

interface SearchUser {
  id: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  role?: string;
  createdAt?: string;
}

export const CommunityChat: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { themeColor } = useThemeStore();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Abas da barra lateral: Conversas vs Membros da Comunidade
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'members'>('chats');
  const [communityMembers, setCommunityMembers] = useState<SearchUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Modal de criação
  const [roomMode, setRoomMode] = useState<'private' | 'group'>('private');
  const [newRoomName, setNewRoomName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<SearchUser | null>(null);
  const [groupMembers, setGroupMembers] = useState<SearchUser[]>([]);
  const [creating, setCreating] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs "live" usadas pelos handlers de socket (mantêm os listeners estáveis,
  // sem precisar re-registrá-los a cada troca de conversa)
  const activeRoomIdRef = useRef<string | null>(null);
  const roomsRef = useRef<ChatRoom[]>([]);
  const currentUserIdRef = useRef<string | undefined>(currentUser?.id);

  // Helper: nome de exibição da sala
  const getRoomDisplayName = useCallback(
    (room: ChatRoom) => {
      if (room.type === 'GROUP' && room.name) return room.name;
      const other = room.members.find((m) => m.userId !== currentUser?.id);
      return other?.user.username || 'Conversa';
    },
    [currentUser?.id]
  );

  const handleSelectRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setTypingUsers([]);

    try {
      const res = await api.get(`/chat/rooms/${room.id}/messages?limit=100`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  };

  const loadRooms = useCallback(async () => {
    try {
      const res = await api.get('/chat/rooms');
      const data: ChatRoom[] = res.data;
      setRooms(data);
    } catch (err) {
      console.error('Erro ao buscar salas de chat:', err);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Mantém as refs sincronizadas para os handlers de socket
  useEffect(() => {
    activeRoomIdRef.current = activeRoom?.id ?? null;
  }, [activeRoom]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id;
  }, [currentUser?.id]);

  // Conectar socket + registrar os listeners UMA única vez (listeners estáveis:
  // nenhuma mensagem se perde ao trocar de conversa). A reconexão automática do
  // Socket.IO dispara 'connect' de novo — nesse momento re-entramos na conversa
  // aberta (o servidor também já re-adiciona o socket a todas as salas do usuário).
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    loadRooms();

    const handleConnect = () => {
      setTypingUsers([]);
      const roomId = activeRoomIdRef.current;
      if (roomId) socket.emit('join_room', roomId);
    };

    // Receber mensagens em tempo real (texto via socket e arquivos via REST broadcast)
    const handleReceiveMessage = (message: Message & { chatRoomId: string }) => {
      const roomId = message.chatRoomId;

      // Atualiza a prévia na barra lateral; se a conversa ainda não foi carregada
      // (ex.: outro usuário acabou de iniciá-la), recarrega a lista para ela aparecer.
      setRooms((prev) => {
        const exists = prev.some((r) => r.id === roomId);
        if (!exists) {
          void loadRooms();
          return prev;
        }
        return prev.map((r) => (r.id === roomId ? { ...r, lastMessage: message } : r));
      });

      // Só adiciona à conversa aberta no momento (deduplicação por id)
      if (roomId === activeRoomIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
      }
    };

    // Indicador de digitação — só exibe quando corresponde à conversa aberta
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
    };

    socket.on('connect', handleConnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('error', handleSocketError);
    };
  }, [loadRooms]);

  // Rolar para o final do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Selecionar uma conversa: entra na sala (o backend já adiciona o socket a
  // todas as salas do usuário na conexão — isto é só um reforço) e carrega o
  // histórico de mensagens.
  const selectRoom = (room: ChatRoom) => {
    const socket = getSocket();
    socket.emit('join_room', room.id);
    void handleSelectRoom(room);
  };

  // Auto-selecionar a primeira sala após o primeiro carregamento
  useEffect(() => {
    if (!activeRoom && rooms.length > 0 && !loadingRooms) {
      selectRoom(rooms[0]);
    }
  }, [activeRoom, rooms, loadingRooms]);

  // Carregar todos os membros da comunidade
  const loadCommunityMembers = useCallback(async (q = '') => {
    setLoadingMembers(true);
    try {
      const url = q.trim().length >= 2
        ? `/users/search?q=${encodeURIComponent(q.trim())}`
        : '/users/search';
      const res = await api.get(url);
      const filtered = res.data.filter((u: SearchUser) => u.id !== currentUser?.id);
      setCommunityMembers(filtered);
      return filtered;
    } catch (err) {
      console.error('Erro ao buscar membros da comunidade:', err);
      return [];
    } finally {
      setLoadingMembers(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadCommunityMembers();
  }, [loadCommunityMembers]);

  // Ao abrir o modal de nova conversa, pré-carregar os membros
  useEffect(() => {
    if (showCreateModal) {
      if (communityMembers.length === 0) {
        loadCommunityMembers().then((users) => {
          if (users) {
            setSearchResults(users.filter((u: SearchUser) => u.id !== selectedTarget?.id && !groupMembers.some((m) => m.id === u.id)));
          }
        });
      } else {
        setSearchResults(communityMembers.filter((u: SearchUser) => u.id !== selectedTarget?.id && !groupMembers.some((m) => m.id === u.id)));
      }
    }
  }, [showCreateModal, communityMembers, selectedTarget, groupMembers, loadCommunityMembers]);

  // Iniciar conversa direta 1:1 imediatamente (pelo sidebar ou modal)
  const handleStartDirectChat = async (targetUser: SearchUser) => {
    // Verificar se já existe conversa privada com o usuário
    const existing = rooms.find(
      (r) => r.type === 'PRIVATE' && r.members.some((m) => m.userId === targetUser.id)
    );
    if (existing) {
      selectRoom(existing);
      setSidebarTab('chats');
      return;
    }

    try {
      const res = await api.post('/chat/rooms/private', { targetUserId: targetUser.id });
      const room: ChatRoom = res.data;
      setRooms((prev) => [room, ...prev.filter((r) => r.id !== room.id)]);
      selectRoom(room);
      setSidebarTab('chats');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao iniciar conversa.');
    }
  };

  // Filtragem e busca em tempo real no modal
  const handleModalSearchChange = (val: string) => {
    setSearchTerm(val);
    if (!val.trim()) {
      setSearchResults(
        communityMembers.filter(
          (u) =>
            u.id !== selectedTarget?.id &&
            !groupMembers.some((m) => m.id === u.id)
        )
      );
    } else {
      const lower = val.toLowerCase();
      setSearchResults(
        communityMembers.filter(
          (u) =>
            u.id !== selectedTarget?.id &&
            !groupMembers.some((m) => m.id === u.id) &&
            ((u.username && u.username.toLowerCase().includes(lower)) ||
             (u.email && u.email.toLowerCase().includes(lower)))
        )
      );
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      let res;
      if (roomMode === 'private') {
        if (!selectedTarget) return;
        res = await api.post('/chat/rooms/private', { targetUserId: selectedTarget.id });
      } else {
        if (!newRoomName.trim()) return;
        res = await api.post('/chat/rooms/group', {
          name: newRoomName.trim(),
          memberIds: groupMembers.map((m) => m.id),
        });
      }

      const room: ChatRoom = res.data;
      setRooms((prev) => [room, ...prev.filter((r) => r.id !== room.id)]);
      selectRoom(room);
      setShowCreateModal(false);
      resetCreateForm();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar a conversa.');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setRoomMode('private');
    setNewRoomName('');
    setSearchTerm('');
    setSearchResults(communityMembers);
    setSelectedTarget(null);
    setGroupMembers([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    const socket = getSocket();
    const text = newMessage.trim();
    setNewMessage('');

    // Emitir socket para o backend persistir + broadcast (evita duplicidade via REST)
    socket.emit('send_message', { roomId: activeRoom.id, content: text });

    // Sinalizar fim da digitação
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { roomId: activeRoom.id });
  };

  // Digitação (typing indicator)
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

  // Enviar arquivos/imagens — via REST (backend faz broadcast do receive_message)
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

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* Sidebar de Conversas & Membros */}
      <div className="w-full md:w-80 glass border-2 border-[var(--border-color)] rounded-[24px] flex flex-col overflow-hidden">
        {/* Header do Sidebar com Tabs */}
        <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <MessageSquare size={18} style={{ color: themeColor }} /> Comunidade
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-8 w-8 rounded-xl bg-[var(--primary-light)] flex items-center justify-center cursor-pointer border-none hover:opacity-85"
              style={{ color: themeColor }}
              title="Nova Conversa"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Seletor de Abas */}
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
              <MessageSquare size={14} />
              Conversas {rooms.length > 0 && `(${rooms.length})`}
            </button>
            <button
              type="button"
              onClick={() => {
                setSidebarTab('members');
                if (communityMembers.length === 0) loadCommunityMembers();
              }}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: sidebarTab === 'members' ? 'var(--bg-color)' : 'transparent',
                color: sidebarTab === 'members' ? themeColor : 'var(--text-muted)',
                boxShadow: sidebarTab === 'members' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Users size={14} />
              Membros {communityMembers.length > 0 && `(${communityMembers.length})`}
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba: CONVERSAS */}
        {sidebarTab === 'chats' && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {loadingRooms && (
              <p className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>
                Carregando conversas...
              </p>
            )}
            {!loadingRooms && rooms.length === 0 && (
              <div className="text-center py-8 px-4 flex flex-col items-center gap-3">
                <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma conversa ativa ainda.
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarTab('members')}
                  className="btn-3d text-xs font-bold py-2 px-4"
                  style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                >
                  <Users size={14} /> Ver Membros da Comunidade
                </button>
              </div>
            )}
            {rooms.map((room) => {
              const isSelected = activeRoom?.id === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className="p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:border-[var(--primary-color)] transition-all"
                  style={isSelected ? { borderColor: themeColor, backgroundColor: 'var(--primary-soft)' } : {}}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[var(--border-color)] flex items-center justify-center shrink-0" style={{ color: themeColor }}>
                      {room.type === 'PRIVATE' ? <Lock size={18} /> : <Globe size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold truncate" style={{ color: 'var(--text-main)' }}>
                        {getRoomDisplayName(room)}
                      </h4>
                      {room.lastMessage && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          <strong>{room.lastMessage.sender?.username}:</strong>{' '}
                          {room.lastMessage.content || 'Arquivo'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Conteúdo da Aba: MEMBROS DA COMUNIDADE */}
        {sidebarTab === 'members' && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {/* Campo de filtro rápido */}
            <div className="relative mb-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filtrar estudante ou professor..."
                className="input-gamified w-full text-xs py-1.5 pl-8 pr-2"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
              />
            </div>

            {loadingMembers && (
              <p className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>
                Carregando membros da comunidade...
              </p>
            )}

            {!loadingMembers && communityMembers.length === 0 && (
              <p className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>
                Nenhum membro encontrado.
              </p>
            )}

            {communityMembers
              .filter((u) => {
                if (!memberSearchTerm.trim()) return true;
                const lower = memberSearchTerm.toLowerCase();
                return (
                  (u.username && u.username.toLowerCase().includes(lower)) ||
                  (u.email && u.email.toLowerCase().includes(lower))
                );
              })
              .map((member) => (
                <div
                  key={member.id}
                  className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] flex items-center justify-between gap-2 hover:border-[var(--primary-color)] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {member.avatarUrl ? (
                      <img
                        src={assetUrl(member.avatarUrl)}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-[var(--border-color)]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[var(--border-color)] flex items-center justify-center shrink-0">
                        <UserIcon size={16} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-extrabold truncate" style={{ color: 'var(--text-main)' }}>
                          {member.username || 'Sem username'}
                        </p>
                        {member.role === 'ADMIN' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-500/10 text-red-500">
                            Admin
                          </span>
                        )}
                        {member.role === 'TEACHER' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/10 text-amber-500">
                            Prof
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartDirectChat(member)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--primary-light)] transition-colors cursor-pointer shrink-0"
                    style={{ background: 'transparent', color: themeColor }}
                    title={`Conversar com ${member.username || member.email}`}
                  >
                    <Send size={13} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Caixa de Chat */}
      <div className="flex-1 glass border-2 border-[var(--border-color)] rounded-[24px] flex flex-col overflow-hidden">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--border-color)] flex items-center justify-center" style={{ color: themeColor }}>
                  {activeRoom.type === 'PRIVATE' ? <Lock size={18} /> : <Globe size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
                    {getRoomDisplayName(activeRoom)}
                  </h3>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {activeRoom.type === 'PRIVATE' ? 'Conversa privada 1:1' : 'Conversa em grupo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[var(--bg-color)]/30">
              {messages.map((msg) => {
                const isMe = msg.sender.id === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[75%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                    {msg.sender.avatarUrl ? (
                      <img src={assetUrl(msg.sender.avatarUrl)} alt="Avatar" className="h-9 w-9 rounded-full object-cover border shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                        <UserIcon size={16} />
                      </div>
                    )}

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

            {/* Rodapé: Input e Indicadores */}
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
                  onChange={handleUploadFile}
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
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <MessageSquare size={48} className="mb-2" />
            <p className="font-bold">Selecione ou crie uma conversa para começar.</p>
          </div>
        )}
      </div>

      {/* Modal de Criação de Conversa */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass p-6 rounded-[24px] border border-[var(--border-color)] max-w-md w-full flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg">Nova Conversa</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer border border-[var(--border-color)] bg-transparent"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Seletor de modo */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setRoomMode('private'); setSelectedTarget(null); setGroupMembers([]); }}
                className={`flex-1 py-2 font-bold text-xs rounded-xl border cursor-pointer ${roomMode === 'private' ? '' : 'border-transparent'}`}
                style={roomMode === 'private' ? { borderColor: themeColor, color: themeColor, backgroundColor: 'var(--primary-light)' } : {}}
              >
                Privada (1:1)
              </button>
              <button
                type="button"
                onClick={() => { setRoomMode('group'); setSelectedTarget(null); setGroupMembers([]); }}
                className={`flex-1 py-2 font-bold text-xs rounded-xl border cursor-pointer ${roomMode === 'group' ? '' : 'border-transparent'}`}
                style={roomMode === 'group' ? { borderColor: themeColor, color: themeColor, backgroundColor: 'var(--primary-light)' } : {}}
              >
                Grupo
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              {roomMode === 'group' && (
                <input
                  type="text"
                  placeholder="Nome do grupo..."
                  className="input-gamified"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              )}

              {/* Busca de usuário */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  {roomMode === 'private'
                    ? 'SELECIONE OU BUSQUE UM MEMBRO DA COMUNIDADE'
                    : 'ADICIONAR MEMBROS (OPCIONAL)'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Filtrar por username ou email..."
                      className="input-gamified w-full"
                      style={{ paddingLeft: '36px' }}
                      value={searchTerm}
                      onChange={(e) => handleModalSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Lista de membros com scroll */}
                <div className="mt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Membros disponíveis ({searchResults.length})
                  </span>
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center border border-[var(--border-color)] rounded-xl bg-[var(--panel-bg)]">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Nenhum membro encontrado com este filtro.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--panel-bg)] max-h-[220px] overflow-y-auto">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            if (roomMode === 'private') setSelectedTarget(u);
                            else setGroupMembers((prev) => [...prev, u]);
                            setSearchTerm('');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--bg-color)] cursor-pointer"
                          style={{ background: 'none' }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {u.avatarUrl ? (
                              <img src={assetUrl(u.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-[var(--border-color)] flex items-center justify-center shrink-0">
                                <UserIcon size={14} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-extrabold truncate" style={{ color: 'var(--text-main)' }}>
                                  {u.username || 'Sem username'}
                                </p>
                                {u.role === 'ADMIN' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-500/10 text-red-500">
                                    Admin
                                  </span>
                                )}
                                {u.role === 'TEACHER' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/10 text-amber-500">
                                    Prof
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                            </div>
                          </div>
                          <span
                            className="text-[11px] font-bold px-2 py-1 rounded-lg border border-[var(--border-color)] shrink-0 transition-colors"
                            style={{ color: themeColor }}
                          >
                            Selecionar
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seleção atual */}
              {roomMode === 'private' && selectedTarget && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--primary-light)]">
                  <div className="flex items-center gap-2">
                    {selectedTarget.avatarUrl ? (
                      <img src={assetUrl(selectedTarget.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[var(--border-color)] flex items-center justify-center">
                        <UserIcon size={14} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-extrabold" style={{ color: 'var(--text-main)' }}>
                        {selectedTarget.username || 'Sem username'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{selectedTarget.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    className="text-xs font-bold cursor-pointer border-none bg-transparent"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    Remover
                  </button>
                </div>
              )}

              {roomMode === 'group' && groupMembers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {groupMembers.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                      style={{ borderColor: themeColor, color: themeColor, backgroundColor: 'var(--primary-light)' }}
                    >
                      {m.username || m.email}
                      <button
                        type="button"
                        onClick={() => setGroupMembers((prev) => prev.filter((x) => x.id !== m.id))}
                        className="cursor-pointer border-none bg-transparent"
                        style={{ color: themeColor }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="btn-3d btn-secondary flex-1 text-sm font-bold py-2">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || (roomMode === 'private' && !selectedTarget) || (roomMode === 'group' && !newRoomName.trim())}
                  className="btn-3d flex-1 text-sm font-bold py-2"
                  style={{ '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                >
                  {creating ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
