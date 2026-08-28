import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api, assetUrl } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { Send, Image, Plus, User as UserIcon, MessageSquare, Globe, Lock, Search, X } from 'lucide-react';

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
    const socket = getSocket();
    socket.emit('join_room', room.id);

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

  // Conectar socket + carregar salas
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    loadRooms();

    // Receber mensagens em tempo real (texto via socket e arquivos via REST broadcast)
    socket.on('receive_message', (message: Message & { chatRoomId: string }) => {
      // Só adicionar na conversa ativa se a mensagem for desta sala
      setMessages((prev) => {
        if (message.chatRoomId !== activeRoom?.id) return prev;
        return prev.some((m) => m.id === message.id) ? prev : [...prev, message];
      });

      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r.id === message.chatRoomId ? { ...r, lastMessage: message } : r
        )
      );
    });

    // Indicador de digitação (backend envia userId + roomId)
    const handleUserTyping = ({ userId }: { userId: string; roomId: string }) => {
      if (userId === currentUser?.id) return;
      const name =
        activeRoom?.members.find((m) => m.userId === userId)?.user.username || 'Alguém';
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    };
    const handleUserStopTyping = ({ userId }: { userId: string }) => {
      const name =
        activeRoom?.members.find((m) => m.userId === userId)?.user.username || 'Alguém';
      setTypingUsers((prev) => prev.filter((u) => u !== name));
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('error', (data: { message: string }) => {
      console.error('[socket error]', data.message);
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('error');
    };
  }, [loadRooms, activeRoom, currentUser?.id]);

  // Rolar para o final do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sair da sala anterior ao trocar (evita vazamento de mensagens entre salas)
  const previousRoomIdRef = useRef<string | null>(null);
  const selectRoom = (room: ChatRoom) => {
    const socket = getSocket();
    if (previousRoomIdRef.current && previousRoomIdRef.current !== room.id) {
      socket.emit('leave_room', previousRoomIdRef.current);
    }
    previousRoomIdRef.current = room.id;
    void handleSelectRoom(room);
  };

  // Auto-selecionar a primeira sala após o primeiro carregamento
  useEffect(() => {
    if (!activeRoom && rooms.length > 0 && !loadingRooms) {
      selectRoom(rooms[0]);
    }
  }, [activeRoom, rooms, loadingRooms]);

  // Buscar usuários para conversa 1:1 ou grupo
  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length < 2) return;
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(searchTerm.trim())}`);
      // Excluir usuário atual e já selecionados
      setSearchResults(
        res.data.filter(
          (u: SearchUser) =>
            u.id !== currentUser?.id &&
            u.id !== selectedTarget?.id &&
            !groupMembers.some((m) => m.id === u.id)
        )
      );
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
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
    setSearchResults([]);
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
      {/* Sidebar de Conversas */}
      <div className="w-full md:w-80 glass border-2 border-[var(--border-color)] rounded-[24px] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <MessageSquare style={{ color: themeColor }} /> Conversas
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-8 w-8 rounded-xl bg-[var(--primary-light)] flex items-center justify-center cursor-pointer border-none hover:opacity-85"
            style={{ color: themeColor }}
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {loadingRooms && (
            <p className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>
              Carregando conversas...
            </p>
          )}
          {!loadingRooms && rooms.length === 0 && (
            <p className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>
              Nenhuma conversa ainda. Clique em + para iniciar!
            </p>
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
                    ? 'BUSCAR POR USERNAME OU E-MAIL'
                    : 'ADICIONAR MEMBROS (OPCIONAL)'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="joao123 ou email@..."
                      className="input-gamified"
                      style={{ paddingLeft: '36px' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchUsers}
                    className="btn-3d text-xs font-bold"
                    style={{ padding: '8px 14px', '--btn-bg': themeColor, '--btn-shadow': 'var(--primary-hover)' } as any}
                  >
                    Buscar
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--panel-bg)]">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (roomMode === 'private') setSelectedTarget(u);
                          else setGroupMembers((prev) => [...prev, u]);
                          setSearchResults([]);
                          setSearchTerm('');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--bg-color)] cursor-pointer"
                        style={{ background: 'none' }}
                      >
                        {u.avatarUrl ? (
                          <img src={assetUrl(u.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[var(--border-color)] flex items-center justify-center">
                            <UserIcon size={14} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-extrabold" style={{ color: 'var(--text-main)' }}>
                            {u.username || 'Sem username'}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
