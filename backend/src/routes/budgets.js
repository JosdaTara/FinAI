const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { BUDGETS, getBudgets } = require('../services/finance');
const { CATEGORIES } = require('../constants');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const budgets = await getBudgets(req.userId);
    res.json({ budgets });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar presupuestos', detalle: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const category = String(req.body.category || '').trim();
  const limit = Number(req.body.limit);

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `La categoría debe ser una de: ${CATEGORIES.join(', ')}` });
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    return res.status(400).json({ error: 'El límite debe ser un número mayor a 0' });
  }

  try {
    const budgets = await getBudgets(req.userId);

    if (budgets.some((b) => b.category === category)) {
      return res.status(409).json({ error: `Ya existe un presupuesto para ${category}. Edítalo o elimínalo primero.` });
    }

    const ref = db.ref(`${BUDGETS}/${req.userId}`).push();
    await ref.set({
      category,
      limit,
      period: 'mensual',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: ref.key, category, limit, period: 'mensual' });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el presupuesto', detalle: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const limit = Number(req.body.limit);

  if (!Number.isFinite(limit) || limit <= 0) {
    return res.status(400).json({ error: 'El límite debe ser un número mayor a 0' });
  }

  try {
    const ref = db.ref(`${BUDGETS}/${req.userId}/${req.params.id}`);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    await ref.update({ limit });
    res.json({ id: req.params.id, limit, category: snapshot.val().category });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el presupuesto', detalle: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const ref = db.ref(`${BUDGETS}/${req.userId}/${req.params.id}`);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    await ref.remove();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el presupuesto', detalle: err.message });
  }
});

module.exports = router;
