import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCOP, formatMonth, currentMonth } from '../lib/format';
import CategoryDoughnut from '../components/CategoryDoughnut';
import MonthlyBarChart from '../components/MonthlyBarChart';
import StatCard from '../components/StatCard';

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
        <StatCard title={`Ingresos de ${formatMonth(month)}`} value={formatCOP(summary.totalIncome)} icon="income" variant="income" />
        <StatCard title={`Gastos de ${formatMonth(month)}`} value={formatCOP(summary.totalExpense)} icon="expense" variant="expense" />
        <StatCard
          title="Balance"
          value={formatCOP(summary.balance)}
          icon={summary.balance >= 0 ? 'check' : 'alert'}
          variant={summary.balance >= 0 ? 'balance-positive' : 'balance-negative'}
        />
        <StatCard
          title="Categoría top"
          value={summary.topCategory
            ? `${summary.topCategory.category} (${formatCOP(summary.topCategory.total)})`
            : 'Sin gastos'}
          icon="trophy"
          variant="savings"
        />
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
