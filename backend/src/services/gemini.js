const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function askGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en backend/.env');
  }

  const response = await fetch(`${GEMINI_URL}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini respondió ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return text.trim();
}

function buildFinancialContext(context) {
  const lines = [];
  lines.push(`Mes actual analizado: ${context.month}`);
  lines.push(`Ingresos del mes: ${context.totalIncome}`);
  lines.push(`Gastos del mes: ${context.totalExpense}`);
  lines.push(`Balance disponible: ${context.balance}`);

  if (context.topCategory) {
    const percent =
      context.totalExpense > 0
        ? Math.round((context.topCategory.total / context.totalExpense) * 100)
        : 0;
    lines.push(
      `Categoría con mayor gasto: ${context.topCategory.category} (${context.topCategory.total}, ~${percent}% de los gastos)`
    );
  }

  if (Object.keys(context.byCategory).length > 0) {
    lines.push('Gastos por categoría:');
    for (const [cat, total] of Object.entries(context.byCategory)) {
      lines.push(`  - ${cat}: ${total}`);
    }
  }

  if (context.budgets.length > 0) {
    lines.push('Presupuestos del mes:');
    for (const b of context.budgets) {
      lines.push(`  - ${b.category}: gastado ${b.spent} de ${b.limit} (${b.percent}%)`);
    }
  }

  if (context.series.length > 1) {
    lines.push('Comparativo de los últimos meses (mes | ingresos | gastos):');
    for (const s of context.series) {
      lines.push(`  - ${s.month} | ${s.income} | ${s.expense}`);
    }
  }

  if (context.recent.length > 0) {
    lines.push('Últimos movimientos:');
    for (const m of context.recent) {
      lines.push(`  - ${m.date} ${m.type} ${m.category}: ${m.amount} (${m.description || 'sin descripción'})`);
    }
  }

  return lines.join('\n');
}

function buildChatPrompt(question, history, contextText) {
  const historyText = (history || [])
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'FinAI'}: ${m.content}`)
    .join('\n');

  return [
    'Eres FinAI, un asistente financiero personal dentro de una aplicación web educativa.',
    'Tu trabajo es analizar los datos financieros reales del usuario que se te entregan y responder sus preguntas.',
    '',
    'Reglas:',
    '- Responde siempre en español, con tono amable y claro.',
    '- Usa ÚNICAMENTE los datos financieros proporcionados; no inventes cifras.',
    '- Sé conciso: máximo 4 a 6 oraciones.',
    '- Cuando sea útil, sugiere acciones prácticas de ahorro o control de gastos.',
    '- No eres un asesor financiero profesional: si preguntan por inversiones o temas complejos, recomienda consultar a un profesional.',
    '',
    'Datos financieros del usuario:',
    contextText,
    historyText ? `\nConversación previa:\n${historyText}` : '',
    `\nPregunta del usuario: ${question}`,
    '\nRespuesta de FinAI:',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildRecommendationsPrompt(contextText) {
  return [
    'Eres FinAI, un asistente financiero personal educativo.',
    'Genera exactamente 3 recomendaciones cortas y personalizadas (una por línea, sin numerar) basadas en estos datos financieros:',
    contextText,
    '',
    'Reglas: español, máximo 20 palabras por recomendación, menciona cifras concretas cuando aplique, tono motivador.',
  ].join('\n');
}

module.exports = { askGemini, buildFinancialContext, buildChatPrompt, buildRecommendationsPrompt };
