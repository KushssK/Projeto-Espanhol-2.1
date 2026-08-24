import React, { useEffect, useState } from 'react';
import { api, assetUrl } from '../services/api';
import { useThemeStore } from '../stores/useThemeStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Trophy, Star, User as UserIcon } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalXP: number;
  lessonsCompleted: number;
}

export const Leaderboard: React.FC = () => {
  const [ranking, setRanking] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { themeColor } = useThemeStore();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/progress/leaderboard?limit=25');
        setRanking(response.data);
      } catch (error) {
        console.error('Erro ao carregar leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-height-[60vh] gap-4" style={{ height: '70vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
        <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Carregando ranking...</p>
      </div>
    );
  }

  // Separar pódio
  const podium = ranking.slice(0, 3);
  const remaining = ranking.slice(3);

  const getPodiumColor = (index: number) => {
    if (index === 0) return '#FFD700'; // Dourado
    if (index === 1) return '#C0C0C0'; // Prata
    return '#CD7F32'; // Bronze
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-[var(--primary-light)] mb-3" style={{ color: themeColor }}>
          <Trophy size={36} />
        </div>
        <h1 className="text-3xl font-extrabold" style={{ margin: '0 0 6px' }}>
          Liga de Campeões
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Pratique lições, ganhe XP e compita saudavelmente com os outros alunos!
        </p>
      </div>

      {/* Pódio (Top 3) */}
      {podium.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-6 mt-4">
          {/* Segundo Colocado */}
          {podium[1] && (
            <div className="flex flex-col items-center order-1">
              <div className="relative mb-2">
                {podium[1].avatarUrl ? (
                  <img src={assetUrl(podium[1].avatarUrl)} alt="Avatar" className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-4" style={{ borderColor: getPodiumColor(1) }} />
                ) : (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[var(--border-color)] flex items-center justify-center border-4" style={{ borderColor: getPodiumColor(1), color: 'var(--text-muted)' }}>
                    <UserIcon size={24} />
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-slate-300 text-slate-800 text-xs font-black flex items-center justify-center border-2 border-white">
                  2
                </div>
              </div>
              <span className="font-extrabold text-sm sm:text-base text-center truncate max-w-[100px]" style={{ color: 'var(--text-main)' }}>
                {podium[1].username}
              </span>
              <span className="text-xs font-black" style={{ color: getPodiumColor(1) }}>
                {podium[1].totalXP} XP
              </span>
              <div className="w-full h-24 sm:h-28 mt-2 rounded-t-2xl border-t border-x border-[var(--border-color)]" style={{ backgroundColor: 'rgba(192, 192, 192, 0.08)' }} />
            </div>
          )}

          {/* Primeiro Colocado */}
          {podium[0] && (
            <div className="flex flex-col items-center order-2">
              <div className="relative mb-3">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">👑</div>
                {podium[0].avatarUrl ? (
                  <img src={assetUrl(podium[0].avatarUrl)} alt="Avatar" className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4" style={{ borderColor: getPodiumColor(0) }} />
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[var(--border-color)] flex items-center justify-center border-4" style={{ borderColor: getPodiumColor(0), color: 'var(--text-muted)' }}>
                    <UserIcon size={32} />
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-amber-400 text-amber-950 text-sm font-black flex items-center justify-center border-2 border-white">
                  1
                </div>
              </div>
              <span className="font-extrabold text-base sm:text-lg text-center truncate max-w-[120px]" style={{ color: 'var(--text-main)' }}>
                {podium[0].username}
              </span>
              <span className="text-sm font-black" style={{ color: getPodiumColor(0) }}>
                {podium[0].totalXP} XP
              </span>
              <div className="w-full h-32 sm:h-36 mt-2 rounded-t-2xl border-t-2 border-x-2" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)', borderColor: getPodiumColor(0) }} />
            </div>
          )}

          {/* Terceiro Colocado */}
          {podium[2] && (
            <div className="flex flex-col items-center order-3">
              <div className="relative mb-2">
                {podium[2].avatarUrl ? (
                  <img src={assetUrl(podium[2].avatarUrl)} alt="Avatar" className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-4" style={{ borderColor: getPodiumColor(2) }} />
                ) : (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[var(--border-color)] flex items-center justify-center border-4" style={{ borderColor: getPodiumColor(2), color: 'var(--text-muted)' }}>
                    <UserIcon size={24} />
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-amber-600 text-amber-950 text-xs font-black flex items-center justify-center border-2 border-white">
                  3
                </div>
              </div>
              <span className="font-extrabold text-sm sm:text-base text-center truncate max-w-[100px]" style={{ color: 'var(--text-main)' }}>
                {podium[2].username}
              </span>
              <span className="text-xs font-black" style={{ color: getPodiumColor(2) }}>
                {podium[2].totalXP} XP
              </span>
              <div className="w-full h-20 sm:h-24 mt-2 rounded-t-2xl border-t border-x border-[var(--border-color)]" style={{ backgroundColor: 'rgba(205, 127, 50, 0.08)' }} />
            </div>
          )}
        </div>
      )}

      {/* Tabela do Restante do Ranking */}
      <div className="glass rounded-[24px] border-2 border-[var(--border-color)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-color)]">
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Classificação
          </h3>
        </div>

        {remaining.length === 0 && podium.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            Nenhum aluno no ranking de XP ainda.
          </div>
        ) : (
          <div className="flex flex-col">
            {remaining.map((player) => {
              const isMe = player.userId === currentUser?.id;
              return (
                <div 
                  key={player.userId}
                  className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--bg-color)] transition-colors"
                  style={isMe ? { backgroundColor: 'var(--primary-soft)' } : {}}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-center font-black text-sm" style={{ color: 'var(--text-muted)' }}>
                      {player.rank}
                    </span>
                    {player.avatarUrl ? (
                      <img src={assetUrl(player.avatarUrl)} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
                        <UserIcon size={18} />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        {player.username}
                        {isMe && <span className="text-[10px] bg-[var(--primary-color)] text-white px-1.5 py-0.5 rounded-full">Você</span>}
                      </h4>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {player.lessonsCompleted} lições completas
                      </span>
                    </div>
                  </div>

                  <span className="font-extrabold flex items-center gap-1" style={{ color: themeColor }}>
                    <Star fill={themeColor} size={16} /> {player.totalXP} XP
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
