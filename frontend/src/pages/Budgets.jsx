import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCOP, CATEGORIES, currentMonth, formatMonth } from '../lib/format';
import Icon from '../components/Icon';

const DEFAULT_DIST = {
  Alimentación: 25,
  Vivienda: 15,
  Transporte: 12,
  Educación: 10,
  Servicios: 10,
  Salud: 8,
  Entretenimiento: 8,
  Compras: 7,
  Otros: 5,
};

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('Alimentación');
  const [limit, setLimit] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [income, setIncome] = useState('');
  const [realIncome, setRealIncome] = useState(0);
  const [dist, setDist] = useState({ ...DEFAULT_DIST });
  const [applying, setApplying] = useState(false);
  const [incomeMsg, setIncomeMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/budgets');
      setBudgets(data.budgets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api
      .get('/profile')
      .then((p) => {
        if (p.monthlyIncome > 0) setIncome(String(p.monthlyIncome));
      })
      .catch(() => {});
    api
      .get(`/stats/summary?month=${currentMonth()}`)
      .then((s) => setRealIncome(s.totalIncome || 0))
      .catch(() => {});
  }, []);

  async function handleSaveIncome() {
    setError('');
    setIncomeMsg('');
    try {
      await api.put('/profile/income', { monthlyIncome: Number(income) });
      setIncomeMsg('Ingreso guardado.');
    } catch (err) {
      setError(err.message);
    }
  }

  function setPct(cat, value) {
    const pct = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
    setDist((d) => ({ ...d, [cat]: pct }));
  }

  const incomeNum = Number(income) || 0;
  const totalPct = CATEGORIES.reduce((sum, cat) => sum + (Number(dist[cat]) || 0), 0);
  const unassignedPct = Math.max(0, 100 - totalPct);
  const canApply = incomeNum > 0 && totalPct > 0 && totalPct <= 100;

  async function applyDistribution() {
    setError('');
    setIncomeMsg('');
    setApplying(true);
    try {
      for (const cat of CATEGORIES) {
        const amount = Math.round((incomeNum * (Number(dist[cat]) || 0)) / 100);
        if (amount <= 0) continue;
        const existing = budgets.find((b) => b.category === cat);
        if (existing) {
          await api.put(`/budgets/${existing.id}`, { limit: amount });
        } else {
          await api.post('/budgets', { category: cat, limit: amount });
        }
      }
      await load();
      setIncomeMsg(`Distribución aplicada a ${formatCOP(incomeNum)} de ingreso.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/budgets/${editingId}`, { limit: Number(limit) });
      } else {
        await api.post('/budgets', { category, limit: Number(limit) });
      }
      setLimit('');
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const availableCategories = editingId
    ? []
    : CATEGORIES.filter((cat) => !budgets.some((b) => b.category === cat));

  return (
    <div className="page">
      <header className="page-header">
        <h2>Presupuestos</h2>
        <p className="page-subtitle">Límites de gasto mensual por categoría — {formatMonth(currentMonth())}</p>
      </header>

      <section className="panel dist-panel">
        <h3>
          <Icon name="target" size={16} /> Distribución del ingreso
        </h3>
        <p className="hint">
          Ingresa tu ingreso mensual total y repártelo entre las categorías. Al aplicar, se crean o
          actualizan los presupuestos automáticamente.
        </p>

        {error && <p className="alert alert-error">{error}</p>}
        {incomeMsg && <p className="alert alert-ok">{incomeMsg}</p>}

        <div className="income-row">
          <label className="income-field">
            Ingreso mensual total
            <input
              type="number"
              min="0"
              step="any"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Ej: 1500000"
            />
          </label>
          <button type="button" className="btn btn-outline" onClick={handleSaveIncome} disabled={!income}>
            Guardar ingreso
          </button>
          {realIncome > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setIncome(String(realIncome))}>
              Usar ingresos registrados ({formatCOP(realIncome)})
            </button>
          )}
        </div>

        <table className="dist-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>%</th>
              <th className="right">Presupuesto calculado</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <tr key={cat}>
                <td>{cat}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="pct-input"
                    value={dist[cat]}
                    onChange={(e) => setPct(cat, e.target.value)}
                  />
                </td>
                <td className="right amount-cell">{formatCOP(Math.round((incomeNum * (Number(dist[cat]) || 0)) / 100))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>
                <span className={totalPct > 100 ? 'text-expense' : 'text-income'}>{totalPct}%</span>
              </td>
              <td className="right amount-cell">{formatCOP(Math.round((incomeNum * totalPct) / 100))}</td>
            </tr>
          </tfoot>
        </table>

        <div className="dist-footer">
          <span className="dist-note">
            {totalPct > 100
              ? 'La suma de porcentajes supera el 100%. Ajusta los valores.'
              : `Sin asignar: ${unassignedPct}% (${formatCOP(Math.round((incomeNum * unassignedPct) / 100))})`}
          </span>
          <button type="button" className="btn btn-primary" onClick={applyDistribution} disabled={!canApply || applying}>
            {applying ? 'Aplicando…' : 'Aplicar distribución'}
          </button>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <h3>{editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h3>

          <form onSubmit={handleSubmit} className="stack-form">
            {!editingId && (
              <label>
                Categoría
                <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                  {availableCategories.length === 0 && <option value="">(Todas las categorías tienen presupuesto)</option>}
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Límite mensual
              <input
                type="number"
                min="1"
                step="any"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="Ej: 400000"
                required
              />
            </label>

            <div className="modal-actions">
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingId(null);
                    setLimit('');
                  }}
                >
                  Cancelar edición
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving || (!editingId && availableCategories.length === 0)}>
                {saving ? 'Guardando…' : editingId ? 'Actualizar límite' : 'Crear presupuesto'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h3>Presupuestos del mes</h3>
          {loading ? (
            <p className="empty-note">Cargando…</p>
          ) : budgets.length === 0 ? (
            <p className="empty-note">
              Aún no tienes presupuestos. Usa la distribución del ingreso o crea uno manualmente.
            </p>
          ) : (
            <ul className="budget-list">
              {budgets.map((b) => (
                <li key={b.id} className="budget-item">
                  <div className="budget-header">
                    <strong>{b.category}</strong>
                    <span>
                      {formatCOP(b.spent)} / {formatCOP(b.limit)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${b.percent >= 100 ? 'danger' : b.percent >= 85 ? 'warning' : 'ok'}`}
                      style={{ width: `${Math.min(b.percent, 100)}%` }}
                    />
                  </div>
                  <div className="budget-footer">
                    <span className={b.percent >= 100 ? 'text-expense' : ''}>
                      {b.percent >= 100
                        ? `Presupuesto alcanzado (${b.percent}%)`
                        : `Has utilizado el ${b.percent}%`}
                    </span>
                    <span className="budget-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Editar límite"
                        onClick={() => {
                          setEditingId(b.id);
                          setLimit(b.limit);
                        }}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button type="button" className="btn-icon" title="Eliminar" onClick={() => handleDelete(b.id)}>
                        <Icon name="trash" size={15} />
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
