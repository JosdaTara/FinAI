const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.ref(`users/${req.userId}`).once('value');
    const data = snapshot.val() || {};
    res.json({
      nombre: data.nombre || '',
      correo: data.correo || '',
      monthlyIncome: Number(data.monthlyIncome) || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar el perfil', detalle: err.message });
  }
});

router.put('/income', verifyToken, async (req, res) => {
  const income = Number(req.body.monthlyIncome);

  if (!Number.isFinite(income) || income < 0) {
    return res.status(400).json({ error: 'El ingreso debe ser un número mayor o igual a 0' });
  }

  try {
    await db.ref(`users/${req.userId}`).update({ monthlyIncome: income });
    res.json({ monthlyIncome: income });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el ingreso', detalle: err.message });
  }
});

module.exports = router;
