"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeWhitelist = exports.addWhitelist = exports.listWhitelist = void 0;
const prisma_1 = require("../lib/prisma");
const cpf_1 = require("../lib/cpf");
const listWhitelist = async (_req, res) => {
    try {
        const entries = await prisma_1.prisma.whitelist_CPF.findMany({
            orderBy: { cpf: 'asc' },
        });
        return res.status(200).json(entries);
    }
    catch (error) {
        console.error('Erro ao listar whitelist:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.listWhitelist = listWhitelist;
const addWhitelist = async (req, res) => {
    try {
        const { cpf, role } = req.body;
        const normalized = cpf ? (0, cpf_1.normalizeCpf)(cpf) : null;
        if (!normalized) {
            return res.status(400).json({ error: 'CPF inválido. Informe 11 dígitos.' });
        }
        if (!role || (role !== 'TEACHER' && role !== 'ADMIN')) {
            return res.status(400).json({ error: 'Role deve ser TEACHER ou ADMIN.' });
        }
        const entry = await prisma_1.prisma.whitelist_CPF.create({
            data: { cpf: normalized, role },
        });
        return res.status(201).json({ message: 'CPF autorizado com sucesso', entry });
    }
    catch (error) {
        if (error?.code === 'P2002') {
            return res.status(409).json({ error: 'CPF já consta na whitelist.' });
        }
        console.error('Erro ao adicionar whitelist:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.addWhitelist = addWhitelist;
const removeWhitelist = async (req, res) => {
    try {
        const cpfParam = req.params.cpf;
        const normalized = (0, cpf_1.normalizeCpf)(cpfParam);
        if (!normalized) {
            return res.status(400).json({ error: 'CPF inválido.' });
        }
        await prisma_1.prisma.whitelist_CPF.delete({ where: { cpf: normalized } });
        return res.status(200).json({ message: 'CPF removido da whitelist.' });
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ error: 'CPF não encontrado na whitelist.' });
        }
        console.error('Erro ao remover whitelist:', error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
};
exports.removeWhitelist = removeWhitelist;
//# sourceMappingURL=whitelist.controller.js.map