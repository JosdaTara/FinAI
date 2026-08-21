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
        maxBarThickness: 42,
      },
      {
        label: 'Gastos',
        data: series.map((s) => s.expense),
        backgroundColor: '#ef4444',
        borderRadius: 6,
        maxBarThickness: 42,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#9aa1ac', boxWidth: 12, padding: 16, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: '#1a1e25',
        borderColor: '#23272f',
        borderWidth: 1,
        titleColor: '#e8eaed',
        bodyColor: '#9aa1ac',
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${formatCOP(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9aa1ac', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        border: { display: false },
        ticks: {
          color: '#6b7280',
          font: { size: 11 },
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
