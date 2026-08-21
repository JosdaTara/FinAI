const CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Educación',
  'Entretenimiento',
  'Servicios',
  'Salud',
  'Compras',
  'Vivienda',
  'Otros',
];

const TYPES = ['ingreso', 'gasto'];

function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function previousMonths(count, fromMonthKey = currentMonthKey()) {
  const [year, month] = fromMonthKey.split('-').map(Number);
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(year, month - 1 - i, 1);
    keys.push(monthKeyFromDate(d));
  }
  return keys;
}

function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

module.exports = {
  CATEGORIES,
  TYPES,
  currentMonthKey,
  monthRange,
  monthKeyFromDate,
  dateKey,
  previousMonths,
  formatCOP,
};
