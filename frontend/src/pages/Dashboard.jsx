import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCOP, formatDate, formatMonth, currentMonth } from '../lib/format';
import StatCard from '../components/StatCard';
import CategoryDoughnut from '../components/CategoryDoughnut';
import Icon from '../components/Icon';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, recData] = await Promise.all([
          api.get(`/stats/summary?month=${currentMonth()}`),
          api.get('/finai/recommendations'),
        ]);
        setSummary(summaryData);
        setRecommendations(recData.recommendations || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Cargando tu información financiera…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p className="alert alert-error">{error}</p>
        <p className="empty-note">
          Verifica que el backend esté corriendo (<code>npm run dev</code> en <code>backend/</code>).
        </p>
      </div>
    );
  }

  const savingsRate =
    summary.totalIncome > 0 ? Math.round((summary.balance / summary.totalIncome) * 100) : 0;

  return (
    <div className="page">
      <header className="page-header">
        <h2>Dashboard</h2>
        <p className="page-subtitle">Resumen de {formatMonth(summary.month)}</p>
      </header>

      <section className="cards-grid">
        <StatCard title="Ingresos" value={formatCOP(summary.totalIncome)} icon="income" variant="income" />
        <StatCard title="Gastos" value={formatCOP(summary.totalExpense)} icon="expense" variant="expense" />
        <StatCard
          title="Balance"
          value={formatCOP(summary.balance)}
          icon={summary.balance >= 0 ? 'check' : 'alert'}
          variant={summary.balance >= 0 ? 'balance-positive' : 'balance-negative'}
        />
        <StatCard title="Tasa de ahorro" value={`${savingsRate}%`} icon="trendUp" variant="savings" />
      </section>

      <section className="grid-2">
        <div className="panel">
          <h3><Icon name="chart" size={16} /> Gastos por categoría</h3>
          <CategoryDoughnut data={summary.byCategory} />
        </div>

        <div className="panel">
          <h3><Icon name="bot" size={16} /> Recomendaciones FinAI</h3>
          <ul className="recommendation-list">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
          <p className="disclaimer">
            Recomendaciones orientativas generadas con IA. No constituyen asesoría financiera profesional.
          </p>
        </div>
      </section>

      <section className="panel">
        <h3>Últimos movimientos</h3>
        {summary.recent.length === 0 ? (
          <p className="empty-note">Aún no registras movimientos este mes.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th className="right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent.map((m) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
