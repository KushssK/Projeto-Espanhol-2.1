"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const client_1 = require("../generated/prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
// Driver adapter (Prisma 7 exige adapter para conectar em MySQL/MariaDB)
// O construtor aceita a connection string no formato mysql://usuario:senha@host:porta/banco
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida. Configure o .env antes de iniciar.');
}
const adapter = new adapter_mariadb_1.PrismaMariaDb(process.env.DATABASE_URL);
exports.prisma = new client_1.PrismaClient({ adapter });
//# sourceMappingURL=prisma.js.map