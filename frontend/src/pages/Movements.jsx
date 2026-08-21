import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  formatCOP,
  formatDate,
  currentMonth,
  todayISO,
  CATEGORIES,
} from '../lib/format';

const EMPTY_FORM = {
  type: 'gasto',
  amount: '',
  date: todayISO(),
  category: 'Alimentación',
  description: '',
};

export default function Movements() {
  const [month, setMonth] = useState(currentMonth());
  const [typeFilter, setTypeFilter] = useState('');
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ month });
      if (typeFilter) params.set('type', typeFilter);
      const data = await api.get(`/movements?${params}`);
      setMovements(data.movements);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, typeFilter]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: todayISO() });
    setShowForm(true);
  }

  function openEdit(movement) {
    setEditingId(movement.id);
    setForm({
      type: movement.type,
      amount: movement.amount,
      date: movement.date,
      category: movement.category,
      description: movement.description || '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/movements/${editingId}`, form);
      } else {
        await api.post('/movements', form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try {
      await api.delete(`/movements/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalIncome = movements
    .filter((m) => m.type === 'ingreso')
    .reduce((sum, m) => sum + Number(m.amount), 0);
  const totalExpense = movements
    .filter((m) => m.type === 'gasto')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h2>Movimientos</h2>
          <p className="page-subtitle">Historial de ingresos y gastos</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Agregar movimiento
        </button>
      </header>

      <section className="filters">
        <label>
          Mes
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label>
          Tipo
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
        </label>
        <div className="filters-summary">
          <span className="text-income">Ingresos: {formatCOP(totalIncome)}</span>
          <span className="text-expense">Gastos: {formatCOP(totalExpense)}</span>
        </div>
      </section>

      {error && <p className="alert alert-error">{error}</p>}

      <section className="panel">
        {loading ? (
          <p className="empty-note">Cargando movimientos…</p>
        ) : movements.length === 0 ? (
          <p className="empty-note">No hay movimientos registrados en este periodo.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th className="right">Valor</th>
                <th className="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{formatDate(m.date)}</td>
                  <td>
                    <span className={`badge ${m.type === 'ingreso' ? 'badge-income' : 'badge-expense'}`}>
                      {m.type}
                    </span>
                  </td>
                  <td>{m.category}</td>
                  <td>{m.description || '—'}</td>
                  <td className={`right ${m.type === 'ingreso' ? 'text-income' : 'text-expense'}`}>
                    {m.type === 'ingreso' ? '+' : '−'}{formatCOP(m.amount)}
                  </td>
                  <td className="right">
                    <button type="button" className="btn-icon" title="Editar" onClick={() => openEdit(m)}>
                      ✏️
                    </button>
                    <button type="button" className="btn-icon" title="Eliminar" onClick={() => handleDelete(m.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3>{editingId ? 'Editar movimiento' : 'Nuevo movimiento'}</h3>

            <div className="type-toggle">
              <button
                type="button"
                className={`btn ${form.type === 'gasto' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setForm({ ...form, type: 'gasto', category: 'Alimentación' })}
              >
                Gasto
              </button>
              <button
                type="button"
                className={`btn ${form.type === 'ingreso' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => setForm({ ...form, type: 'ingreso', category: '' })}
              >
                Ingreso
              </button>
            </div>

            <label>
              Valor
              <input
                type="number"
                min="1"
                step="any"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Ej: 25000"
                required
              />
            </label>

            <label>
              Fecha
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>

            <label>
              {form.type === 'gasto' ? 'Categoría' : 'Fuente del ingreso'}
              {form.type === 'gasto' ? (
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ej: Salario"
                  required
                />
              )}
            </label>

            <label>
              Descripción
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Almuerzo"
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
