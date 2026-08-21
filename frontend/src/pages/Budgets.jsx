import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCOP, CATEGORIES, currentMonth, formatMonth } from '../lib/format';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('Alimentación');
  const [limit, setLimit] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

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
  }, []);

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

      <div className="grid-2">
        <section className="panel">
          <h3>{editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h3>

          {error && <p className="alert alert-error">{error}</p>}

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
              Aún no tienes presupuestos. Crea uno para controlar tus gastos por categoría.
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
                        ? `⚠️ Presupuesto alcanzado (${b.percent}%)`
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
                        ✏️
                      </button>
                      <button type="button" className="btn-icon" title="Eliminar" onClick={() => handleDelete(b.id)}>
                        🗑️
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
