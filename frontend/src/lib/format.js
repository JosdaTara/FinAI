export const CATEGORIES = [
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

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCOP(value) {
  return copFormatter.format(value || 0);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatMonth(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}
