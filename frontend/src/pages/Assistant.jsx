import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const SUGGESTIONS = [
  '¿En qué estoy gastando más?',
  '¿Cuánto he gastado este mes?',
  '¿Cuánto dinero me queda?',
  '¿Cómo podría ahorrar?',
  '¿Estoy gastando demasiado?',
  '¿Cómo van mis presupuestos?',
];

const WELCOME = {
  role: 'assistant',
  content:
    '¡Hola! Soy FinAI, tu asistente financiero. 🤖 Puedo analizar tus ingresos y gastos registrados para responder tus preguntas y darte recomendaciones. ¿Qué quieres saber?',
};

export default function Assistant() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const question = (text ?? input).trim();
    if (!question || sending) return;

    setInput('');
    setSending(true);

    const history = messages
      .filter((m) => m !== WELCOME)
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: question }]);

    try {
      const data = await api.post('/finai/chat', { message: question, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Lo siento, hubo un problema: ${err.message}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="page chat-page">
      <header className="page-header">
        <h2>Asistente FinAI 🤖</h2>
        <p className="page-subtitle">
          Pregunta sobre tus finanzas: el sistema consulta tus datos reales y la IA los analiza.
        </p>
      </header>

      <div className="chat-window panel">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {sending && (
            <div className="chat-bubble assistant typing">
              FinAI está analizando tus datos…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={sending}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta…"
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
            Enviar
          </button>
        </form>
      </div>

      <p className="disclaimer center">
        Las respuestas son orientativas y generadas con IA a partir de tus datos. No constituyen asesoría financiera profesional.
      </p>
    </div>
  );
}
