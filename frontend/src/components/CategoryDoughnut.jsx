import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatCOP } from '../lib/format';

ChartJS.register(ArcElement, Tooltip, Legend);

export const CHART_COLORS = [
  '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa',
  '#f472b6', '#2dd4bf', '#fb923c', '#94a3b8',
];

export default function CategoryDoughnut({ data }) {
  if (!data || data.length === 0) {
    return <p className="empty-note">No hay gastos registrados en este periodo.</p>;
  }

  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 3,
        borderColor: '#14171c',
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#9aa1ac', boxWidth: 12, padding: 14, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: '#1a1e25',
        borderColor: '#23272f',
        borderWidth: 1,
        titleColor: '#e8eaed',
        bodyColor: '#9aa1ac',
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${formatCOP(ctx.parsed)}`,
        },
      },
    },
    cutout: '62%',
  };

  return (
    <div className="chart-container">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
