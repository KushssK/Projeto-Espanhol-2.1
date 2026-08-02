const mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'construindo_saberes' });
  // remove só os dados de teste que EU criei; mantém as contas do usuário (Kayurl, KayTeste)
  await db.query("DELETE FROM messages WHERE channel IN ('repro_a__repro_b','AnaTeste__AnaUrl')");
  await db.query("DELETE FROM users WHERE email IN ('repro_a@test.com','repro_b@test.com','anateste@test.com','anaurl@test.com')");
  const [m] = await db.query('SELECT COUNT(*) n FROM messages');
  const [u] = await db.query('SELECT username,email FROM users');
  const [a] = await db.query('SELECT COUNT(*) n FROM admins');
  console.log('MESSAGES restantes:', m[0].n);
  console.log('USERS:', JSON.stringify(u));
  console.log('ADMINS:', a[0].n);
  await db.end();
})().catch((e) => { console.error('DB ERR', e.message); process.exit(1); });
