const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini(prompt, retries = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en backend/.env');
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      if (text.trim()) return text.trim();
      throw new Error('Gemini devolvió una respuesta vacía');
    }

    // 503/429: servicio saturado o límite de tasa — esperar y reintentar
    if ((response.status === 503 || response.status === 429) && attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 4000 * (attempt + 1)));
      continue;
    }

    const detail = await response.text();
    throw new Error(`Gemini respondió ${response.status}: ${detail.slice(0, 300)}`);
  }

  throw new Error('Gemini no respondió tras varios intentos');
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
    '',
    'A continuación se muestran los datos financieros reales del usuario:',
    contextText,
    historyText ? `\nConversación previa:\n${historyText}` : '',
    `\nPregunta del usuario: ${question}`,
    '',
    'Tarea: responde la pregunta del usuario en español, con tono amable y claro, usando únicamente los datos proporcionados sin inventar cifras. Sé conciso (máximo 5 oraciones). Cuando sea útil, sugiere acciones prácticas de ahorro o control de gastos. No eres un asesor financiero profesional: si preguntan por inversiones o temas complejos, recomienda consultar a un profesional.',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildRecommendationsPrompt(contextText) {
  return [
    'A continuación se muestran los datos financieros de un usuario:',
    contextText,
    '',
    'Tarea: escribe exactamente 3 recomendaciones financieras personalizadas para este usuario. Responde ÚNICAMENTE con las 3 recomendaciones, una por línea, en español, máximo 20 palabras cada una, sin numeración ni viñetas.',
  ].join('\n');
}

module.exports = { askGemini: callGemini, buildFinancialContext, buildChatPrompt, buildRecommendationsPrompt };
