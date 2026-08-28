"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.bootstrapAdmin = exports.registerStaff = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const cpf_1 = require("../lib/cpf");
const auth_validators_1 = require("../validators/auth.validators");
function signToken(userId, role) {
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
}
function publicUser(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        avatarUrl: user.avatarUrl,
        isBanned: false,
    };
}
async function createUserAccount(params) {
    const existingUser = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [
                { email: params.email },
                { username: params.username || undefined },
                ...(params.cpfHash ? [{ cpfHash: params.cpfHash }] : []),
            ],
        },
    });
    if (existingUser) {
        return { error: 'Usuário já existe com este e-mail, username ou CPF.', status: 400 };
    }
    const hashedPassword = await bcrypt_1.default.hash(params.password, 10);
    const newUser = await prisma_1.prisma.user.create({
        data: {
            email: params.email,
            passwordHash: hashedPassword,
            dob: new Date(params.dob),
            username: params.username,
            role: params.role,
            cpfHash: params.cpfHash,
        },
    });
    return { newUser };
}
const register = async (req, res) => {
    try {
        const parsed = auth_validators_1.registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados de cadastro inválidos.' });
        }
        const { email, password, dob, username } = parsed.data;
        const cpf = req.body.cpf;
        if (cpf) {
            return res.status(403).json({
                error: 'Cadastro de staff deve usar POST /api/auth/register/staff com CPF autorizado.',
            });
        }
        const result = await createUserAccount({
            email,
            password,
            dob,
            username,
            role: 'STUDENT',
        });
        if ('error' in result) {
            return res.status(result.status ?? 400).json({ error: result.error });
        }
        const { newUser } = result;
        return res.status(201).json({
            message: 'Usuário registrado com sucesso',
            token: signToken(newUser.id, newUser.role),
            user: publicUser(newUser),
        });
    }
    catch (error) {
        console.error('Erro no registro:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.register = register;
const registerStaff = async (req, res) => {
    try {
        const parsed = auth_validators_1.registerStaffSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados de cadastro staff inválidos.' });
        }
        const { email, password, dob, cpf, username } = parsed.data;
        const normalizedCpf = (0, cpf_1.normalizeCpf)(cpf);
        if (!normalizedCpf) {
            return res.status(400).json({ error: 'CPF inválido. Informe 11 dígitos.' });
        }
        const whitelistEntry = await prisma_1.prisma.whitelist_CPF.findUnique({
            where: { cpf: normalizedCpf },
        });
        if (!whitelistEntry) {
            return res.status(403).json({ error: 'CPF não autorizado para registro de Staff.' });
        }
        const result = await createUserAccount({
            email,
            password,
            dob,
            username,
            cpfHash: (0, cpf_1.hashCpf)(normalizedCpf),
            role: whitelistEntry.role,
        });
        if ('error' in result) {
            return res.status(result.status ?? 400).json({ error: result.error });
        }
        const { newUser } = result;
        return res.status(201).json({
            message: 'Conta staff registrada com sucesso',
            token: signToken(newUser.id, newUser.role),
            user: publicUser(newUser),
        });
    }
    catch (error) {
        console.error('Erro no registro staff:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.registerStaff = registerStaff;
const bootstrapAdmin = async (req, res) => {
    try {
        const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
        if (!bootstrapSecret) {
            return res.status(503).json({ error: 'Endpoint desabilitado. Configure BOOTSTRAP_SECRET no servidor.' });
        }
        const parsed = auth_validators_1.bootstrapAdminSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
        }
        const { secret, email, password, dob, username } = parsed.data;
        if (secret !== bootstrapSecret) {
            return res.status(403).json({ error: 'Chave de bootstrap inválida.' });
        }
        const existingAdmin = await prisma_1.prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (existingAdmin) {
            return res.status(403).json({
                error: 'Já existe um administrador no sistema. Faça login normalmente em /login.',
            });
        }
        const result = await createUserAccount({
            email,
            password,
            dob,
            username,
            role: 'ADMIN',
        });
        if ('error' in result) {
            return res.status(result.status ?? 400).json({ error: result.error });
        }
        const { newUser } = result;
        return res.status(201).json({
            message: 'Admin criado com sucesso!',
            token: signToken(newUser.id, newUser.role),
            user: publicUser(newUser),
        });
    }
    catch (error) {
        console.error('Erro no bootstrap admin:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.bootstrapAdmin = bootstrapAdmin;
const login = async (req, res) => {
    try {
        const parsed = auth_validators_1.loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'E-mail e senha são obrigatórios.' });
        }
        const { email, password } = parsed.data;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        if (user.isBanned) {
            return res.status(403).json({ error: 'Conta banida.' });
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        return res.status(200).json({
            message: 'Login realizado com sucesso',
            token: signToken(user.id, user.role),
            user: publicUser(user),
        });
    }
    catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.login = login;
//# sourceMappingURL=auth.controller.js.map