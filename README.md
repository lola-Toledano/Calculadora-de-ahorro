# Calculadora de Ahorros 📈

Aplicación web **SPA** (Single Page Application) que estima la evolución de tus ahorros con **interés compuesto** y **aportaciones mensuales**, con visualización mediante gráficos **donut** interactivos.

---

## 🚀 Cómo ejecutar

### Opción A — Abrir directamente en el navegador (sin servidor)

```
1. Clona o descarga el repositorio.
2. Abre el archivo index.html con cualquier navegador moderno (Chrome, Firefox, Edge, Safari).
   → Doble clic en el archivo, o desde la barra de direcciones: file:///ruta/a/index.html
3. ¡Listo! La app carga los datos de tu última sesión automáticamente.
```

> **Nota**: Chart.js se carga desde CDN (cdn.jsdelivr.net). Necesitas conexión a internet para los gráficos.

### Opción B — Con servidor local (recomendado para desarrollo)

```bash
# Python 3
python -m http.server 8080
# Luego abre: http://localhost:8080

# Node.js (npx)
npx serve .
```

---

## 🧪 Correr los tests unitarios

Abre `tests.html` en el navegador:

```
file:///ruta/a/Calculadora-de-ahorro/tests.html
```

Verás una tabla con cada test y su estado **PASS ✅** / **FAIL ❌**.

También puedes ejecutarlos en Node.js:

```bash
node tests.js
```

---

## 📁 Árbol de archivos

```
Calculadora-de-ahorro/
├── index.html     # Shell SPA: inputs, tarjetas, gráficos
├── style.css      # Diseño premium (Inter, variables CSS, responsive)
├── calc.js        # 🧮 Módulo puro de cálculo (testeable, sin UI)
├── main.js        # Coordinador de UI + Chart.js + localStorage
├── tests.html     # Runner de tests en navegador
├── tests.js       # Suite de 10 tests unitarios
└── README.md      # Este archivo
```

---

## 🔢 Fórmulas utilizadas

| Variable | Fórmula |
|---|---|
| `r_mensual` | `(interés_anual / 100) / 12` |
| `n` | `años_simulados × 12` |
| FV (r > 0) | `PV×(1+r)^n + PMT×((1+r)^n − 1)/r` |
| FV (r = 0) | `PV + PMT×n` |
| Principal | `PV + PMT×n` |
| Intereses | `max(FV − Principal, 0)` |

---

## ✨ Funcionalidades

- **Interés compuesto mensual** con aportaciones periódicas
- **2 gráficos donut** (Principal vs Intereses · Dinero inicial vs Aportaciones)
- **5 tarjetas** de resumen con formato €
- **Meta de ahorro** opcional: calcula en qué mes/año se alcanza + badge
- **Persistencia** con `localStorage` (carga automática + botón "Restablecer")
- **Validaciones** en tiempo real con mensajes de error inline
- **Fallback** cuando `edad actual ≥ edad objetivo`
- **Accesible**: labels semánticos, `aria-live`, tabla alternativa, navegación por teclado

---

## ⚠️ Aviso legal

Esta aplicación es meramente orientativa. No constituye asesoramiento financiero.