import Icon from './Icon';

export default function StatCard({ title, value, icon, variant = '' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-icon">
        <Icon name={icon} size={21} />
      </div>
      <div>
        <p className="stat-title">{title}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}
