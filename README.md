# 💰 FinAI — Asistente Inteligente de Finanzas Personales

**Proyecto de aula — Nuevas Tecnologías**

FinAI es una aplicación web que permite registrar ingresos y gastos personales, visualizar estadísticas mediante gráficos y recibir recomendaciones de un asistente inteligente basado en Inteligencia Artificial (Google Gemini) que analiza los datos financieros reales del usuario.

> ⚠️ Prototipo académico: no maneja dinero real ni se conecta con cuentas bancarias.

---

## 🧱 Arquitectura

```
Usuario → Interfaz Web (React) → Backend (Node + Express) → Firestore + API Gemini
```

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + React Router + Chart.js |
| Backend | Node.js + Express |
| Base de datos | Firebase Firestore |
| Autenticación | Firebase Auth (correo/contraseña) |
| IA | Google Gemini API |

- El **frontend** gestiona el login/registro con Firebase Auth y envía el token al backend.
- El **backend** verifica cada token (`firebase-admin`), consulta Firestore y llama a Gemini inyectando los datos financieros como contexto.
- Si `GEMINI_API_KEY` no está configurada, el asistente responde con un **modo local simulado** (reglas propias), útil para demostrar sin internet.

---

## 📁 Estructura

```
FinAI/
├── backend/               # API Express
│   ├── src/
│   │   ├── index.js       # Servidor
│   │   ├── config/firebase.js
│   │   ├── middleware/auth.js
│   │   ├── routes/        # movements, budgets, stats, chat(IA)
│   │   └── services/      # finance.js (agregaciones), gemini.js, fallback.js
│   └── scripts/seed-demo.js  # Datos de demostración
├── frontend/              # App React
│   └── src/
│       ├── pages/         # Login, Register, Dashboard, Movements,
│       │                  # Budgets, Statistics, Assistant
│       ├── components/    # Layout, StatCard, gráficos Chart.js
│       ├── context/       # AuthContext
│       └── lib/           # api.js, firebase.js, format.js
└── firestore.rules        # Reglas de seguridad
```

---

## ⚙️ Configuración inicial

### 1. Firebase

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com)
2. **Authentication → Sign-in method → Correo electrónico/contraseña** → habilitar
3. **Firestore Database → Crear base de datos** (modo de prueba)
4. **Configuración del proyecto → Tus aplicaciones → Web `</>`**: copia los valores del objeto `firebaseConfig` → pégolos en `frontend/.env`
5. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**: guarda el JSON descargado como `backend/serviceAccountKey.json`
6. Publica las reglas de seguridad: copia `firestore.rules` en la pestaña *Reglas* de Firestore

### 2. Gemini

1. Ve a [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Crea una API key y pégala en `backend/.env` → `GEMINI_API_KEY`

### 3. Variables de entorno

```bash
# frontend/.env  (copiar desde frontend/.env.example)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:4000/api

# backend/.env  (copiar desde backend/.env.example)
PORT=4000
CORS_ORIGIN=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
```

---

## ▶️ Ejecución

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev          # http://localhost:4000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Datos de demostración (opcional)

```bash
cd backend
npm run seed
```

Crea el usuario `demo@finai.com` / `demo1234` con movimientos de dos meses y presupuestos, ideal para la presentación.

Verifica el estado del backend en: `http://localhost:4000/api/health`

---

## 🔌 Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor |
| GET/POST | `/api/movements` | Listar / crear movimientos |
| PUT/DELETE | `/api/movements/:id` | Editar / eliminar movimiento |
| GET/POST | `/api/budgets` | Presupuestos por categoría |
| PUT/DELETE | `/api/budgets/:id` | Editar / eliminar presupuesto |
| GET | `/api/stats/summary?month=` | Resumen del mes (totales, categorías, recientes) |
| GET | `/api/stats/monthly?months=6` | Serie mensual ingresos/gastos |
| POST | `/api/finai/chat` | Pregunta al asistente IA |
| GET | `/api/finai/recommendations` | Recomendaciones para el dashboard |

Todas las rutas (excepto `/health`) requieren el header `Authorization: Bearer <token>`.

---

## 🔒 Seguridad

- Contraseñas gestionadas íntegramente por Firebase Auth (nunca se almacenan en nuestra base de datos).
- Cada petición al backend valida el token de sesión; los datos siempre se filtran por `userId`.
- Las reglas de Firestore bloquean el acceso directo del cliente a movimientos/presupuestos.
- Secretos (`.env`, clave de cuenta de servicio) excluidos del repositorio vía `.gitignore`.
