require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initError } = require('./config/firebase');
const movementsRouter = require('./routes/movements');
const budgetsRouter = require('./routes/budgets');
const statsRouter = require('./routes/stats');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    servicio: 'FinAI API',
    firebase: initError ? `no configurado: ${initError}` : 'conectado',
    gemini: process.env.GEMINI_API_KEY ? 'configurado' : 'sin configurar (respuestas locales)',
  });
});

app.use('/api/movements', movementsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/finai', chatRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`✅ FinAI API escuchando en http://localhost:${PORT}`);
  if (initError) {
    console.warn(`⚠️  Firebase no inicializado: ${initError}`);
    console.warn('   Revisa backend/.env y la clave de cuenta de servicio.');
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY no configurada: el asistente usará respuestas locales simuladas.');
  }
});
