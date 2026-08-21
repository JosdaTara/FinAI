import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCOP, formatMonth, currentMonth } from '../lib/format';
import CategoryDoughnut from '../components/CategoryDoughnut';
import MonthlyBarChart from '../components/MonthlyBarChart';

export default function Statistics() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [summaryData, seriesData] = await Promise.all([
          api.get(`/stats/summary?month=${month}`),
          api.get('/stats/monthly?months=6'),
        ]);
        setSummary(summaryData);
        setSeries(seriesData.series);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [month]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Calculando estadísticas…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h2>Estadísticas</h2>
          <p className="page-subtitle">Análisis visual de tus finanzas</p>
        </div>
        <label className="inline-label">
          Mes
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
      </header>

      {error && <p className="alert alert-error">{error}</p>}

      <section className="cards-grid">
        <div className="stat-card income">
          <div className="stat-icon">📥</div>
          <div>
            <p className="stat-title">Ingresos de {formatMonth(month)}</p>
            <p className="stat-value">{formatCOP(summary.totalIncome)}</p>
          </div>
        </div>
        <div className="stat-card expense">
          <div className="stat-icon">📤</div>
          <div>
            <p className="stat-title">Gastos de {formatMonth(month)}</p>
            <p className="stat-value">{formatCOP(summary.totalExpense)}</p>
          </div>
        </div>
        <div className={`stat-card ${summary.balance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
          <div className="stat-icon">{summary.balance >= 0 ? '✅' : '⚠️'}</div>
          <div>
            <p className="stat-title">Balance</p>
            <p className="stat-value">{formatCOP(summary.balance)}</p>
          </div>
        </div>
        <div className="stat-card savings">
          <div className="stat-icon">🏆</div>
          <div>
            <p className="stat-title">Categoría top</p>
            <p className="stat-value small">
              {summary.topCategory
                ? `${summary.topCategory.category} (${formatCOP(summary.topCategory.total)})`
                : 'Sin gastos'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <h3>Gastos por categoría — {formatMonth(month)}</h3>
          <CategoryDoughnut data={summary.byCategory} />
        </div>

        <div className="panel">
          <h3>Ingresos vs Gastos — últimos 6 meses</h3>
          <MonthlyBarChart series={series} />
        </div>
      </section>

      <section className="panel">
        <h3>Detalle por categoría</h3>
        {summary.byCategory.length === 0 ? (
          <p className="empty-note">No hay gastos registrados en este mes.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th className="right">Total gastado</th>
                <th className="right">% del total</th>
              </tr>
            </thead>
            <tbody>
              {summary.byCategory.map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td className="right">{formatCOP(c.total)}</td>
                  <td className="right">
                    {Math.round((c.total / summary.totalExpense) * 100)}%
                  </td>
                </tr>
              ))}
              <tr className="table-total">
                <td><strong>Total</strong></td>
                <td className="right"><strong>{formatCOP(summary.totalExpense)}</strong></td>
                <td className="right"><strong>100%</strong></td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
