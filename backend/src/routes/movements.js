const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { MOVEMENTS, getMovements } = require('../services/finance');
const { CATEGORIES, TYPES } = require('../constants');

const router = express.Router();

function validateMovement(body) {
  const errors = [];
  const type = String(body.type || '').toLowerCase();
  const amount = Number(body.amount);
  const date = String(body.date || '');
  const category = String(body.category || '').trim();
  const description = String(body.description || '').trim();

  if (!TYPES.includes(type)) errors.push('El tipo debe ser "ingreso" o "gasto"');
  if (!Number.isFinite(amount) || amount <= 0) errors.push('El valor debe ser un número mayor a 0');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('La fecha debe tener formato YYYY-MM-DD');

  if (type === 'gasto' && !CATEGORIES.includes(category)) {
    errors.push(`La categoría debe ser una de: ${CATEGORIES.join(', ')}`);
  }
  if (type === 'ingreso' && !category) {
    errors.push('Indica la fuente del ingreso');
  }

  return { errors, data: { type, amount, date, category, description: description.slice(0, 200) } };
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const { month, type, category } = req.query;
    const movements = await getMovements(req.userId, { month, type, category });
    res.json({ movements });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar movimientos', detalle: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { errors, data } = validateMovement(req.body);
  if (errors.length > 0) return res.status(400).json({ error: errors.join('. ') });

  try {
    const ref = db.ref(`${MOVEMENTS}/${req.userId}`).push();
    await ref.set(data);
    res.status(201).json({ id: ref.key, ...data });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el movimiento', detalle: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { errors, data } = validateMovement(req.body);
  if (errors.length > 0) return res.status(400).json({ error: errors.join('. ') });

  try {
    const ref = db.ref(`${MOVEMENTS}/${req.userId}/${req.params.id}`);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }

    await ref.update(data);
    res.json({ id: req.params.id, ...data });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el movimiento', detalle: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const ref = db.ref(`${MOVEMENTS}/${req.userId}/${req.params.id}`);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }

    await ref.remove();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el movimiento', detalle: err.message });
  }
});

module.exports = router;
