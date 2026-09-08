// Testes de unidade não tocam o banco — mas lib/prisma.ts exige DATABASE_URL
// no import. Valor fictício é suficiente: o cliente só conecta sob demanda.
process.env.DATABASE_URL = 'postgresql://teste:teste@localhost:5432/teste';
process.env.JWT_SECRET = 'chave-de-teste';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';