import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/movements', label: 'Movimientos', icon: 'card' },
  { to: '/budgets', label: 'Presupuesto', icon: 'target' },
  { to: '/statistics', label: 'Estadísticas', icon: 'chart' },
  { to: '/assistant', label: 'Asistente FinAI', icon: 'bot' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <h1>FinAI</h1>
            <p className="brand-tag">FINANZAS + IA</p>
          </div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="user-name">{user?.displayName || 'Usuario'}</p>
          <p className="user-email">{user?.email}</p>
          <button type="button" className="btn btn-outline btn-small" onClick={handleLogout}>
            <Icon name="logout" size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
