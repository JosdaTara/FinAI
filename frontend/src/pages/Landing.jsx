import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

const FEATURES = [
  {
    icon: 'card',
    title: 'Registro sencillo',
    text: 'Anota tus ingresos y gastos en segundos, clasificados por categoría: alimentación, transporte, educación y más.',
  },
  {
    icon: 'grid',
    title: 'Dashboard claro',
    text: 'Tu balance se calcula automáticamente y lo ves junto a gráficos que resumen tu mes de un vistazo.',
  },
  {
    icon: 'target',
    title: 'Presupuestos',
    text: 'Define límites de gasto por categoría y recibe alertas cuando te acerques al límite.',
  },
  {
    icon: 'chart',
    title: 'Estadísticas visuales',
    text: 'Gráficos de gastos por categoría y comparativos mensuales para entender tus hábitos.',
  },
  {
    icon: 'bot',
    title: 'Asistente con IA',
    text: 'Gemini analiza tus datos reales y responde tus preguntas en lenguaje natural, sin tecnicismos.',
  },
  {
    icon: 'check',
    title: 'Seguro y privado',
    text: 'Tu cuenta protegida con Firebase y tus datos financieros aislados por usuario.',
  },
];

const STEPS = [
  { n: '1', title: 'Crea tu cuenta', text: 'Regístrate con tu nombre, correo y contraseña.' },
  { n: '2', title: 'Registra tus movimientos', text: 'Anota ingresos y gastos del día a día en segundos.' },
  { n: '3', title: 'Habla con FinAI', text: 'Pregunta lo que quieras sobre tu dinero y recibe recomendaciones.' },
];

export default function Landing() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="landing">
      <header className="land-nav">
        <div className="land-nav-inner">
          <Link to="/" className="brand land-brand">
            <div className="brand-mark">F</div>
            <h1>FinAI</h1>
          </Link>
          <nav className="land-links">
            <a href="#caracteristicas">Características</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#asistente">Asistente IA</a>
          </nav>
          <div className="land-nav-actions">
            <Link to="/login" className="btn btn-outline btn-small land-login">Iniciar sesión</Link>
            <Link to="/register" className="btn btn-primary btn-small">Crear cuenta</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="hero-badge">Nuevas Tecnologías · Proyecto académico</span>
          <h2>
            Tus finanzas personales,<br />
            <span className="text-gradient">explicadas por la IA</span>
          </h2>
          <p>
            FinAI registra tus ingresos y gastos, los convierte en estadísticas claras y un
            asistente inteligente te explica qué significan y cómo puedes mejorar tus hábitos.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-big">
              Crear cuenta gratis
              <Icon name="expense" size={16} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-big">Ya tengo cuenta</Link>
          </div>
          <ul className="hero-points">
            <li><Icon name="check" size={14} /> Gratis</li>
            <li><Icon name="check" size={14} /> Sin datos bancarios</li>
            <li><Icon name="check" size={14} /> Pensado para estudiantes</li>
          </ul>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="mock-panel">
            <div className="mock-title">Agosto 2026</div>
            <div className="mock-cards">
              <div className="mock-chip up">
                <Icon name="income" size={13} />
                <div><span>Ingresos</span><strong>$1.500.000</strong></div>
              </div>
              <div className="mock-chip down">
                <Icon name="expense" size={13} />
                <div><span>Gastos</span><strong>$1.050.000</strong></div>
              </div>
              <div className="mock-chip bal">
                <Icon name="activity" size={13} />
                <div><span>Balance</span><strong>$450.000</strong></div>
              </div>
            </div>
            <div className="mock-chart">
              {[42, 68, 35, 80, 55, 30].map((h, i) => (
                <div key={i} className={`mock-bar ${i % 2 === 0 ? 'b-in' : 'b-out'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="mock-chat">
              <div className="mock-q">¿En qué estoy gastando más?</div>
              <div className="mock-a">
                Tu mayor gasto es <strong>Alimentación</strong>, con $450.000 (~43% del total).
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="land-section" id="caracteristicas">
        <h3 className="land-heading">Todo lo que necesitas para controlar tu dinero</h3>
        <p className="land-subheading">
          Herramientas sencillas de finanzas personales combinadas con análisis inteligente.
        </p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature-card">
              <div className="feature-icon"><Icon name={f.icon} size={20} /></div>
              <h4>{f.title}</h4>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="land-section alt" id="como-funciona">
        <h3 className="land-heading">Empieza en 3 pasos</h3>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <article key={s.n} className="step-card">
              <div className="step-num">{s.n}</div>
              <h4>{s.title}</h4>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="land-section" id="asistente">
        <div className="ai-demo">
          <div className="ai-demo-text">
            <h3 className="land-heading left">No solo veas números.<br />Entiéndelos.</h3>
            <p>
              Una aplicación tradicional te dice cuánto gastaste. FinAI va más allá: interpreta
              tus datos y te sugiere qué hacer con ellos.
            </p>
            <ul className="ai-list">
              <li><Icon name="check" size={15} /> Respuestas basadas en tus movimientos reales</li>
              <li><Icon name="check" size={15} /> Recomendaciones personalizadas de ahorro</li>
              <li><Icon name="check" size={15} /> Alertas sobre tus presupuestos</li>
            </ul>
            <Link to="/register" className="btn btn-primary">Probar el asistente</Link>
          </div>

          <div className="chat-preview">
            <div className="chat-head">
              <Icon name="bot" size={16} />
              Asistente FinAI
            </div>
            <div className="chat-body">
              <div className="cp-msg user">¿En qué estoy gastando más?</div>
              <div className="cp-msg bot">
                Tu categoría con mayor gasto este mes es <strong>Alimentación</strong>, con
                $450.000 — aproximadamente el 43% de tus gastos totales.
              </div>
              <div className="cp-msg user">¿Cómo podría ahorrar?</div>
              <div className="cp-msg bot">
                Puedes establecer un presupuesto mensual de $400.000 para Alimentación y revisar
                tus compras frecuentes. También tienes un balance positivo de $450.000 que podrías
                destinar a ahorro.
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="brand land-brand">
            <div className="brand-mark small">F</div>
            <strong>FinAI</strong>
          </div>
          <p>
            Prototipo académico — Proyecto de Aula, Nuevas Tecnologías. FinAI no maneja dinero real,
            no realiza transacciones y no se conecta con cuentas bancarias. Las recomendaciones son
            orientativas y no constituyen asesoría financiera profesional.
          </p>
          <span>© 2026 FinAI</span>
        </div>
      </footer>
    </div>
  );
}
