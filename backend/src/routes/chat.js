const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  getMovements,
  summarize,
  getTopCategory,
  getMonthlySeries,
  getBudgetsWithUsage,
} = require('../services/finance');
const { askGemini, buildFinancialContext, buildChatPrompt, buildRecommendationsPrompt } = require('../services/gemini');
const { buildFallbackReply, buildFallbackRecommendations } = require('../services/fallback');
const { formatCOP, currentMonthKey } = require('../constants');

const router = express.Router();

async function buildContext(userId) {
  const month = currentMonthKey();
  const [movements, budgets, series] = await Promise.all([
    getMovements(userId, { month }),
    getBudgetsWithUsage(userId, month),
    getMonthlySeries(userId, 4),
  ]);

  const summary = summarize(movements);

  return {
    month,
    totalIncome: summary.totalIncome,
    totalExpense: summary.totalExpense,
    balance: summary.balance,
    byCategory: summary.byCategory,
    topCategory: getTopCategory(summary.byCategory),
    budgets,
    series,
    recent: movements.slice(0, 8),
  };
}

router.post('/chat', verifyToken, async (req, res) => {
  const question = String(req.body.message || '').trim();

  if (!question) return res.status(400).json({ error: 'Escribe una pregunta' });
  if (question.length > 500) return res.status(400).json({ error: 'La pregunta es demasiado larga' });

  const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];

  try {
    const context = await buildContext(req.userId);
    const contextText = buildFinancialContext(context);

    let reply;
    let source;

    if (!process.env.GEMINI_API_KEY) {
      reply = buildFallbackReply(question, context);
      source = 'local';
    } else {
      try {
        reply = await askGemini(buildChatPrompt(question, history, contextText));
        source = 'gemini';
      } catch (err) {
        console.error('Gemini falló, usando respuesta local:', err.message);
        reply = buildFallbackReply(question, context);
        source = 'local';
      }
    }

    res.json({ reply, source });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar la pregunta', detalle: err.message });
  }
});

router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const context = await buildContext(req.userId);
    const contextText = buildFinancialContext(context);

    let recommendations;
    let source;

    if (!process.env.GEMINI_API_KEY) {
      recommendations = buildFallbackRecommendations(context);
      source = 'local';
    } else {
      try {
        const raw = await askGemini(buildRecommendationsPrompt(contextText));
        recommendations = raw
          .split('\n')
          .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
          .filter(Boolean)
          .slice(0, 3);
        if (recommendations.length === 0) throw new Error('Respuesta vacía de Gemini');
        source = 'gemini';
      } catch (err) {
        console.error('Gemini falló, usando recomendaciones locales:', err.message);
        recommendations = buildFallbackRecommendations(context);
        source = 'local';
      }
    }

    res.json({ recommendations, source, balance: context.balance });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar recomendaciones', detalle: err.message });
  }
});

module.exports = router;
