/**
 * Prueba de humo de la API FinAI.
 *
 * Uso:
 *   1. Inicia el servidor en un terminal:  npm run dev
 *   2. En otro terminal ejecuta:           npm run smoke
 */
require('dotenv').config();
const { admin, initError } = require('../src/config/firebase');

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';
const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;
const DEMO_EMAIL = 'demo@finai.com';

async function getIdToken() {
  if (!WEB_API_KEY) throw new Error('Define FIREBASE_WEB_API_KEY en backend/.env (es la apiKey de la config web de Firebase)');

  const user = await admin.auth().getUserByEmail(DEMO_EMAIL);
  const customToken = await admin.auth().createCustomToken(user.uid);

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`No se pudo obtener el token: ${data.error?.message}`);
  return data.idToken;
}

async function call(path, options = {}, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function main() {
  if (initError) throw new Error(`Firebase no inicializado: ${initError}`);

  console.log('1️⃣ Health check...');
  const health = await fetch(`${BASE_URL}/health`).then((r) => r.json());
  console.log('   ', JSON.stringify(health));

  console.log('2️⃣ Autenticando usuario demo...');
  const token = await getIdToken();
  console.log('    ✓ Token obtenido');

  console.log('3️⃣ GET /stats/summary...');
  const summary = await call('/stats/summary', {}, token);
  if (summary.status !== 200) throw new Error(summary.data.error);
  console.log(`    Ingresos: ${summary.data.totalIncome} | Gastos: ${summary.data.totalExpense} | Balance: ${summary.data.balance}`);
  console.log(`    Categoría top: ${summary.data.topCategory?.category} | Presupuestos: ${summary.data.budgets.length} | Recientes: ${summary.data.recent.length}`);

  console.log('4️⃣ GET /finai/recommendations...');
  const recs = await call('/finai/recommendations', {}, token);
  recs.data.recommendations.forEach((r, i) => console.log(`    ${i + 1}. ${r}`));
  console.log('    fuente:', recs.data.source);

  console.log('5️⃣ POST /finai/chat → "¿En qué estoy gastando más?"');
  const chat = await call('/finai/chat', { method: 'POST', body: { message: '¿En qué estoy gastando más?' } }, token);
  if (chat.status !== 200) throw new Error(chat.data.error);
  console.log('    FinAI:', chat.data.reply.slice(0, 220));
  console.log('    fuente:', chat.data.source);

  console.log('\n✅ Todas las pruebas pasaron.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
