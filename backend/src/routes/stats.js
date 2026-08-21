const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  getMovements,
  summarize,
  getTopCategory,
  getMonthlySeries,
  getBudgetsWithUsage,
} = require('../services/finance');
const { currentMonthKey, monthRange, monthKeyFromDate } = require('../constants');

const router = express.Router();

router.get('/summary', verifyToken, async (req, res) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month || ''))
      ? req.query.month
      : currentMonthKey();

    const [movements, budgets] = await Promise.all([
      getMovements(req.userId, { month }),
      getBudgetsWithUsage(req.userId, month),
    ]);

    const summary = summarize(movements);
    const topCategory = getTopCategory(summary.byCategory);

    const recent = [...movements]
      .sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')))
      .slice(0, 5);

    res.json({
      month,
      ...summary,
      topCategory,
      byCategory: Object.entries(summary.byCategory)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total),
      budgets,
      recent,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular el resumen', detalle: err.message });
  }
});

router.get('/monthly', verifyToken, async (req, res) => {
  try {
    const months = Math.min(Math.max(Number(req.query.months) || 6, 2), 12);
    const series = await getMonthlySeries(req.userId, months);
    res.json({ series });
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular la serie mensual', detalle: err.message });
  }
});

module.exports = router;
