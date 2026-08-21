/**
 * Script de datos de demostración para FinAI.
 *
 * Crea un usuario demo (demo@finai.com / demo1234) y registra
 * movimientos del mes actual y del mes anterior, además de presupuestos.
 *
 * Requisitos:
 *   1. backend/.env con FIREBASE_SERVICE_ACCOUNT_PATH configurada
 *   2. El archivo JSON de la cuenta de servicio en la ruta indicada
 *
 * Uso:  npm run seed   (desde la carpeta backend/)
 */
require('dotenv').config();
const { admin, db, auth, initError } = require('../src/config/firebase');
const { currentMonthKey, previousMonths } = require('../src/constants');

const DEMO_EMAIL = 'demo@finai.com';
const DEMO_PASSWORD = 'demo1234';

function dayOf(monthKey, day) {
  return `${monthKey}-${String(day).padStart(2, '0')}`;
}

async function ensureDemoUser() {
  try {
    const user = await auth.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      displayName: 'Usuario Demo',
    });
    console.log(`✅ Usuario demo creado: ${DEMO_EMAIL} (uid ${user.uid})`);
    return user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-exists' || err.code === 'auth/uid-already-exists') {
      const user = await auth.getUserByEmail(DEMO_EMAIL);
      console.log(`ℹ️  El usuario demo ya existía (uid ${user.uid})`);
      return user.uid;
    }
    throw err;
  }
}

async function clearUserData(userId) {
  await db.ref(`movements/${userId}`).remove();
  await db.ref(`budgets/${userId}`).remove();
}

async function seedMovements(userId) {
  const thisMonth = currentMonthKey();
  const lastMonth = previousMonths(2)[0];

  const movements = [
    // Mes anterior
    { month: lastMonth, type: 'ingreso', amount: 1500000, date: dayOf(lastMonth, 1), category: 'Salario', description: 'Pago mensual' },
    { month: lastMonth, type: 'gasto', amount: 380000, date: dayOf(lastMonth, 3), category: 'Alimentación', description: 'Mercado del mes' },
    { month: lastMonth, type: 'gasto', amount: 180000, date: dayOf(lastMonth, 8), category: 'Transporte', description: 'Gasolina y peajes' },
    { month: lastMonth, type: 'gasto', amount: 160000, date: dayOf(lastMonth, 12), category: 'Entretenimiento', description: 'Salidas' },
    { month: lastMonth, type: 'gasto', amount: 90000, date: dayOf(lastMonth, 18), category: 'Servicios', description: 'Luz, agua e internet' },

    // Mes actual
    { month: thisMonth, type: 'ingreso', amount: 1500000, date: dayOf(thisMonth, 1), category: 'Salario', description: 'Pago mensual' },
    { month: thisMonth, type: 'gasto', amount: 450000, date: dayOf(thisMonth, 2), category: 'Alimentación', description: 'Mercado del mes' },
    { month: thisMonth, type: 'gasto', amount: 200000, date: dayOf(thisMonth, 5), category: 'Transporte', description: 'Transporte' },
    { month: thisMonth, type: 'gasto', amount: 250000, date: dayOf(thisMonth, 10), category: 'Entretenimiento', description: 'Cine y suscripciones' },
    { month: thisMonth, type: 'gasto', amount: 100000, date: dayOf(thisMonth, 14), category: 'Educación', description: 'Libros y materiales' },
    { month: thisMonth, type: 'gasto', amount: 50000, date: dayOf(thisMonth, 16), category: 'Otros', description: 'Varios' },
  ];

  const updates = {};
  for (const m of movements) {
    const key = db.ref(`movements/${userId}`).push().key;
    updates[key] = {
      type: m.type,
      amount: m.amount,
      date: m.date,
      category: m.category,
      description: m.description,
      createdAt: new Date().toISOString(),
    };
  }
  await db.ref(`movements/${userId}`).update(updates);
  console.log(`✅ ${movements.length} movimientos insertados (${lastMonth} y ${thisMonth})`);
}

async function seedBudgets(userId) {
  const budgets = [
    { category: 'Alimentación', limit: 400000 },
    { category: 'Transporte', limit: 250000 },
    { category: 'Entretenimiento', limit: 200000 },
  ];

  const updates = {};
  for (const b of budgets) {
    const key = db.ref(`budgets/${userId}`).push().key;
    updates[key] = {
      category: b.category,
      limit: b.limit,
      period: 'mensual',
      createdAt: new Date().toISOString(),
    };
  }
  await db.ref(`budgets/${userId}`).update(updates);
  console.log(`✅ ${budgets.length} presupuestos creados`);
}

async function main() {
  if (initError) {
    console.error('❌ Firebase no está configurado:', initError);
    console.error('   Configura backend/.env y coloca el JSON de cuenta de servicio.');
    process.exit(1);
  }

  console.log('🌱 Sembrando datos de demostración…\n');

  const userId = await ensureDemoUser();
  await clearUserData(userId);
  await seedMovements(userId);
  await seedBudgets(userId);

  console.log('\n🎉 Datos listos. Inicia sesión en la app con:');
  console.log(`   Correo:    ${DEMO_EMAIL}`);
  console.log(`   Contraseña: ${DEMO_PASSWORD}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
