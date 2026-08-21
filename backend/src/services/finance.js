const { db } = require('../config/firebase');
const { monthRange, dateKey, previousMonths, currentMonthKey } = require('../constants');

const MOVEMENTS = 'movements';
const BUDGETS = 'budgets';

async function getUserItems(userId, node) {
  let snapshot = await db.ref(`${node}/${userId}`).once('value');

  // Reintento ante fallos transitorios de red (el SDK devuelve vacío
  // en silencio si no logra renovar el token de acceso)
  if (!snapshot.exists()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    snapshot = await db.ref(`${node}/${userId}`).once('value');
  }

  const value = snapshot.val() || {};
  return Object.entries(value).map(([id, data]) => ({ id, ...data }));
}

async function getMovements(userId, { month, type, category } = {}) {
  let movements = await getUserItems(userId, MOVEMENTS);

  if (month) {
    const { start, end } = monthRange(month);
    const startKey = dateKey(start);
    const endKey = dateKey(new Date(end.getTime() - 1));
    movements = movements.filter((m) => m.date >= startKey && m.date <= endKey);
  }

  if (type) movements = movements.filter((m) => m.type === type);
  if (category) movements = movements.filter((m) => m.category === category);

  movements.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return movements;
}

function summarize(movements) {
  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    count: movements.length,
    byCategory: {},
  };

  for (const m of movements) {
    const amount = Number(m.amount) || 0;
    if (m.type === 'ingreso') {
      summary.totalIncome += amount;
    } else {
      summary.totalExpense += amount;
      summary.byCategory[m.category] = (summary.byCategory[m.category] || 0) + amount;
    }
  }

  summary.balance = summary.totalIncome - summary.totalExpense;
  return summary;
}

function getTopCategory(byCategory) {
  const entries = Object.entries(byCategory);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [category, total] = entries[0];
  return { category, total };
}

async function getMonthlySeries(userId, monthsCount = 6) {
  const keys = previousMonths(monthsCount);
  const series = [];

  for (const key of keys) {
    const movements = await getMovements(userId, { month: key });
    const s = summarize(movements);
    series.push({
      month: key,
      income: s.totalIncome,
      expense: s.totalExpense,
      balance: s.balance,
    });
  }

  return series;
}

async function getBudgets(userId) {
  return getUserItems(userId, BUDGETS);
}

async function getBudgetsWithUsage(userId, month = currentMonthKey()) {
  const [budgets, movements] = await Promise.all([
    getBudgets(userId),
    getMovements(userId, { month, type: 'gasto' }),
  ]);

  const spentByCategory = {};
  for (const m of movements) {
    spentByCategory[m.category] = (spentByCategory[m.category] || 0) + Number(m.amount || 0);
  }

  return budgets.map((b) => {
    const limit = Number(b.limit) || 0;
    const spent = spentByCategory[b.category] || 0;
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return { ...b, limit, spent, percent };
  });
}

module.exports = {
  MOVEMENTS,
  BUDGETS,
  getMovements,
  summarize,
  getTopCategory,
  getMonthlySeries,
  getBudgets,
  getBudgetsWithUsage,
};
