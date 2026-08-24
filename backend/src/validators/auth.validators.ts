import { z } from 'zod';

// ============================================================================
// Validação de entrada (Zod) — endpoints de autenticação
// ============================================================================

// Regex simples de e-mail (evita dependência de formatos específicos da versão)
const emailSchema = z
  .string()
  .min(1, 'E-mail é obrigatório.')
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'E-mail inválido.',
  });

const passwordSchema = z
  .string()
  .min(6, 'A senha deve ter pelo menos 6 caracteres.')
  .max(100, 'A senha deve ter no máximo 100 caracteres.');

// Data de nascimento: deve existir, ser no passado e o usuário ter 13+ anos
const dobSchema = z
  .string()
  .min(1, 'Data de nascimento é obrigatória.')
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: 'Data de nascimento inválida.',
  })
  .refine((v) => {
    const dob = new Date(v);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    return age >= 13;
  }, {
    message: 'É necessário ter pelo menos 13 anos para se cadastrar.',
  });

const usernameSchema = z
  .string()
  .min(3, 'O username deve ter pelo menos 3 caracteres.')
  .max(24, 'O username deve ter no máximo 24 caracteres.')
  .regex(/^[a-zA-Z0-9_.]+$/, 'O username só pode conter letras, números, ponto e sublinhado.')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  dob: dobSchema,
  username: usernameSchema,
});

export const registerStaffSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  dob: dobSchema,
  username: usernameSchema,
  cpf: z
    .string()
    .min(1, 'CPF é obrigatório para staff.')
    .refine((v) => v.replace(/\D/g, '').length === 11, {
      message: 'CPF deve conter 11 dígitos.',
    }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export const bootstrapAdminSchema = z.object({
  secret: z.string().min(1, 'Chave de bootstrap é obrigatória.'),
  email: emailSchema,
  password: passwordSchema,
  dob: dobSchema,
  username: usernameSchema,
});

// Tipos inferidos
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
