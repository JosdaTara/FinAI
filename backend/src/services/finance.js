const { db } = require('../config/firebase');
const { monthRange, monthKeyFromDate, previousMonths, currentMonthKey } = require('../constants');

const MOVEMENTS = 'movements';
const BUDGETS = 'budgets';

async function getMovements(userId, { month, type, category } = {}) {
  let query = db.collection(MOVEMENTS).where('userId', '==', userId);

  if (month) {
    const { start, end } = monthRange(month);
    const startKey = monthKeyFromDate(start);
    const endKey = monthKeyFromDate(new Date(end.getTime() - 1));
    query = query.where('date', '>=', startKey).where('date', '<=', endKey);
  }

  if (type) query = query.where('type', '==', type);
  if (category) query = query.where('category', '==', category);

  const snapshot = await query.orderBy('date', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
  const snapshot = await db.collection(BUDGETS).where('userId', '==', userId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
