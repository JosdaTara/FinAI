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
    const existing = await db
      .collection(BUDGETS)
      .where('userId', '==', req.userId)
      .where('category', '==', category)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: `Ya existe un presupuesto para ${category}. Edítalo o elimínalo primero.` });
    }

    const docRef = await db.collection(BUDGETS).add({
      userId: req.userId,
      category,
      limit,
      period: 'mensual',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id, category, limit, period: 'mensual' });
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
    const ref = db.collection(BUDGETS).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    await ref.update({ limit });
    res.json({ id: req.params.id, limit, category: doc.data().category });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el presupuesto', detalle: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const ref = db.collection(BUDGETS).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    await ref.delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el presupuesto', detalle: err.message });
  }
});

module.exports = router;
