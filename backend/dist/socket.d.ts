import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
export declare const getIO: () => SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any> | null;
export declare const setupSocket: (server: HttpServer) => SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
//# sourceMappingURL=socket.d.ts.map