const { formatCOP } = require('../constants');

function buildFallbackReply(question, context) {
  const q = question.toLowerCase();
  const { totalIncome, totalExpense, balance, topCategory, byCategory, budgets } = context;

  if (topCategory && (q.includes('gastando más') || q.includes('gasto más') || q.includes('categoría') || q.includes('categoria'))) {
    const percent = totalExpense > 0 ? Math.round((topCategory.total / totalExpense) * 100) : 0;
    return `Según tus movimientos, tu categoría con mayor gasto este mes es ${topCategory.category}, con ${formatCOP(topCategory.total)} (~${percent}% de tus gastos totales). Te conviene revisar esa categoría y considerar establecer un presupuesto mensual para controlarla.`;
  }

  if (q.includes('cuánto he gastado') || q.includes('cuanto he gastado') || q.includes('gastado este mes') || q.includes('gastos del mes')) {
    return `Durante este mes has registrado gastos por un total de ${formatCOP(totalExpense)}, frente a ingresos de ${formatCOP(totalIncome)}. Tu balance actual es ${formatCOP(balance)}.`;
  }

  if (q.includes('queda') || q.includes('balance') || q.includes('disponible')) {
    return `Tu balance disponible este mes es de ${formatCOP(balance)} (ingresos ${formatCOP(totalIncome)} menos gastos ${formatCOP(totalExpense)}).`;
  }

  if (budgets.length > 0 && (q.includes('presupuesto'))) {
    const detail = budgets
      .map((b) => `${b.category}: ${formatCOP(b.spent)} de ${formatCOP(b.limit)} (${b.percent}%)`)
      .join('; ');
    return `Este es el estado de tus presupuestos: ${detail}.`;
  }

  if (q.includes('ahorrar') || q.includes('ahorro') || q.includes('reducir')) {
    const tips = [];
    if (topCategory) {
      tips.push(`tu mayor gasto es ${topCategory.category} con ${formatCOP(topCategory.total)}, podrías fijar un límite mensual para esta categoría`);
    }
    const smallCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(1, 3)
      .map(([cat]) => cat);
    if (smallCategories.length > 0) {
      tips.push(`también puedes revisar gastos frecuentes en ${smallCategories.join(' y ')}`);
    }
    if (balance > 0) {
      tips.push(`considera apartar una parte de tu balance de ${formatCOP(balance)} como ahorro`);
    }
    return `Para ahorrar te sugiero lo siguiente: ${tips.join('. ')}.`;
  }

  return `Este mes tienes ingresos por ${formatCOP(totalIncome)}, gastos por ${formatCOP(totalExpense)} y un balance de ${formatCOP(balance)}.` +
    (topCategory ? ` Tu categoría con mayor gasto es ${topCategory.category}.` : '') +
    ' Puedo ayudarte con detalles por categoría, presupuestos o ideas de ahorro.';
}

function buildFallbackRecommendations(context) {
  const recs = [];
  const { totalIncome, totalExpense, balance, topCategory, budgets } = context;

  if (totalIncome === 0 && totalExpense === 0) {
    return [
      'Aún no registras movimientos este mes. Agrega tus ingresos y gastos para recibir recomendaciones.',
      'Registra al menos tus gastos fijos para conocer tu situación.',
      'Establece un presupuesto para tu categoría de mayor gasto habitual.',
    ];
  }

  if (topCategory) {
    const percent = totalExpense > 0 ? Math.round((topCategory.total / totalExpense) * 100) : 0;
    recs.push(`${topCategory.category} representa ~${percent}% de tus gastos: revisa si hay gastos que puedas reducir.`);
  }

  for (const b of budgets) {
    if (b.percent >= 100) {
      recs.push(`Has alcanzado el presupuesto de ${b.category} (${b.percent}%). Evita más gastos en esta categoría.`);
    } else if (b.percent >= 85) {
      recs.push(`Has utilizado el ${b.percent}% del presupuesto de ${b.category}. Cuidado con los gastos restantes.`);
    }
  }

  if (balance > 0) {
    recs.push(`Tienes un balance positivo de ${formatCOP(balance)}. Considera apartar una parte como ahorro.`);
  } else if (totalExpense > totalIncome) {
    recs.push('Tus gastos superan tus ingresos este mes. Prioriza reducir gastos no esenciales.');
  }

  while (recs.length < 3) {
    recs.push('Registra tus gastos diariamente para tener un control más preciso.');
  }

  return recs.slice(0, 3);
}

module.exports = { buildFallbackReply, buildFallbackRecommendations };
