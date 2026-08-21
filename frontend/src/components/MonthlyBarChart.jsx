import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatCOP, formatMonth } from '../lib/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function MonthlyBarChart({ series }) {
  if (!series || series.length === 0) {
    return <p className="empty-note">No hay datos suficientes para el gráfico.</p>;
  }

  const chartData = {
    labels: series.map((s) => formatMonth(s.month)),
    datasets: [
      {
        label: 'Ingresos',
        data: series.map((s) => s.income),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Gastos',
        data: series.map((s) => s.expense),
        backgroundColor: '#ef4444',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatCOP(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${Number(value).toLocaleString('es-CO')}`,
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Bar data={chartData} options={options} />
    </div>
  );
}
