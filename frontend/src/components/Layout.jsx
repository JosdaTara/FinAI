import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/movements', label: 'Movimientos', icon: '💳' },
  { to: '/budgets', label: 'Presupuesto', icon: '🎯' },
  { to: '/statistics', label: 'Estadísticas', icon: '📈' },
  { to: '/assistant', label: 'Asistente FinAI', icon: '🤖' },
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
          <span className="brand-logo">💰</span>
          <h1>FinAI</h1>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="user-name">{user?.displayName || 'Usuario'}</p>
          <p className="user-email">{user?.email}</p>
          <button type="button" className="btn btn-outline btn-small" onClick={handleLogout}>
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
