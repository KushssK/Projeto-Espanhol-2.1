import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================================
// Mocks — testes de unidade não tocam banco nem Socket.IO
// ============================================================================
const prismaMock = vi.hoisted(() => ({
  user: { findMany: vi.fn() },
  friendship: { findMany: vi.fn() },
  chatRoom: { create: vi.fn() },
}));

const socketMock = vi.hoisted(() => ({
  getIO: vi.fn(() => null),
  leaveUserRooms: vi.fn(),
  joinUserRooms: vi.fn(),
  emitToUser: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('../src/socket', () => socketMock);
vi.mock('../src/lib/storage', () => ({ persistUpload: vi.fn() }));

import { createGroupRoom } from '../src/controllers/chat.controller';
import type { AuthRequest } from '../src/middlewares/auth.middleware';

const CREATOR = 'user-creator';
const FRIEND_A = 'user-a';
const FRIEND_B = 'user-b';
const STRANGER = 'user-stranger';

const makeReq = (body: unknown): AuthRequest =>
  ({ user: { userId: CREATOR, role: 'STUDENT' }, body } as unknown as AuthRequest);

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn((payload) => payload);
  return res;
};

/** Cenário padrão: A e B são amigos do criador; STRANGER existe mas não é amigo. */
const mockFriendsOfCreator = (friendIds: string[]) => {
  prismaMock.user.findMany.mockImplementation(async ({ where }: any) =>
    (where.id.in as string[]).map((id: string) => ({ id }))
  );
  prismaMock.friendship.findMany.mockImplementation(async ({ where }: any) =>
    (where.friendId.in as string[])
      .filter((id: string) => friendIds.includes(id))
      .map((id: string) => ({ friendId: id }))
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFriendsOfCreator([FRIEND_A, FRIEND_B]);
});

describe('createGroupRoom (criação de grupo com apenas amigos)', () => {
  it('1 amigo → 201 e grupo com criador + amigo', async () => {
    const room = { id: 'room-1', type: 'GROUP', name: 'Grupo', members: [{ userId: CREATOR }, { userId: FRIEND_A }] };
    prismaMock.chatRoom.create.mockResolvedValue(room);

    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Grupo', memberIds: [FRIEND_A] }), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prismaMock.chatRoom.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'GROUP',
          name: 'Grupo',
          members: { create: [{ userId: CREATOR }, { userId: FRIEND_A }] },
        }),
      })
    );
  });

  it('2 amigos → 201 com criador + os dois', async () => {
    const room = { id: 'room-2', type: 'GROUP', name: 'Trio', members: [{ userId: CREATOR }, { userId: FRIEND_A }, { userId: FRIEND_B }] };
    prismaMock.chatRoom.create.mockResolvedValue(room);

    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Trio', memberIds: [FRIEND_A, FRIEND_B] }), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prismaMock.chatRoom.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: { create: [{ userId: CREATOR }, { userId: FRIEND_A }, { userId: FRIEND_B }] },
        }),
      })
    );
  });

  it('nenhum amigo selecionado (memberIds vazio) → 400', async () => {
    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Grupo', memberIds: [] }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.chatRoom.create).not.toHaveBeenCalled();
  });

  it('usuário não-amigo → 403 e grupo NÃO criado', async () => {
    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Grupo', memberIds: [STRANGER] }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prismaMock.chatRoom.create).not.toHaveBeenCalled();
  });

  it('amizade mista (amigo + não-amigo) → 403 e grupo NÃO criado', async () => {
    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Grupo', memberIds: [FRIEND_A, STRANGER] }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prismaMock.chatRoom.create).not.toHaveBeenCalled();
  });

  it('amigo duplicado → deduplicado, 201 sem membros repetidos', async () => {
    const room = { id: 'room-3', type: 'GROUP', name: 'Dup', members: [{ userId: CREATOR }, { userId: FRIEND_A }] };
    prismaMock.chatRoom.create.mockResolvedValue(room);

    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Dup', memberIds: [FRIEND_A, FRIEND_A, FRIEND_A] }), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prismaMock.chatRoom.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: { create: [{ userId: CREATOR }, { userId: FRIEND_A }] },
        }),
      })
    );
  });

  it('membro banido → 400 e grupo NÃO criado', async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: FRIEND_A }]); // banido não volta na consulta

    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Grupo', memberIds: [FRIEND_A, 'user-banido'] }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.chatRoom.create).not.toHaveBeenCalled();
  });

  it('sem nome → 400', async () => {
    const res = makeRes();
    await createGroupRoom(makeReq({ name: '', memberIds: [FRIEND_A] }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.chatRoom.create).not.toHaveBeenCalled();
  });

  it('memberIds ausente/inválido → 400 (não exploda)', async () => {
    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Grupo' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.chatRoom.create).not.toHaveBeenCalled();
  });

  it('criador listado em memberIds é ignorado (não duplica RoomMember)', async () => {
    const room = { id: 'room-4', type: 'GROUP', name: 'Self', members: [{ userId: CREATOR }, { userId: FRIEND_A }] };
    prismaMock.chatRoom.create.mockResolvedValue(room);

    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Self', memberIds: [FRIEND_A, CREATOR] }), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prismaMock.chatRoom.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: { create: [{ userId: CREATOR }, { userId: FRIEND_A }] },
        }),
      })
    );
  });

  it('após criar, sockets dos membros entram na sala e recebem rooms_updated', async () => {
    const room = { id: 'room-5', type: 'GROUP', name: 'Realtime', members: [{ userId: CREATOR }, { userId: FRIEND_A }] };
    prismaMock.chatRoom.create.mockResolvedValue(room);

    const res = makeRes();
    await createGroupRoom(makeReq({ name: 'Realtime', memberIds: [FRIEND_A] }), res);

    expect(socketMock.joinUserRooms).toHaveBeenCalledWith(CREATOR, 'room-5');
    expect(socketMock.joinUserRooms).toHaveBeenCalledWith(FRIEND_A, 'room-5');
    expect(socketMock.emitToUser).toHaveBeenCalledWith(CREATOR, 'rooms_updated', { roomId: 'room-5' });
    expect(socketMock.emitToUser).toHaveBeenCalledWith(FRIEND_A, 'rooms_updated', { roomId: 'room-5' });
  });
});
