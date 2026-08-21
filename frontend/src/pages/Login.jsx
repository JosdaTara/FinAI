import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(correo, contraseña);
      navigate('/dashboard');
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <div className="brand-mark">F</div>
          <h1>FinAI</h1>
          <p>Asistente Inteligente de Finanzas Personales</p>
        </div>

        <h2>Iniciar sesión</h2>

        {error && <p className="alert alert-error">{error}</p>}

        <label>
          Correo electrónico
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>

        <p className="auth-home">
          <Link to="/">← Volver al inicio</Link>
        </p>
      </form>
    </div>
  );
}
