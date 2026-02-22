/**
 * main.js — Coordinador de UI para la Calculadora de Ahorros.
 * Depende de: calc.js (window.CalcAhorros) y Chart.js (window.Chart).
 */

'use strict';

// ─── Constantes ──────────────────────────────────────────────────────────────
const LS_KEY = 'calculadora-ahorros-v1';

const DEFAULTS = {
    pv: 10000,
    edad: 30,
    interes: 7,
    pmt: 200,
    objetivo: 65,
    meta: '',
    años: 10,
};

// Colores de las donuts (con variante semitransparente para hover)
const COLORS = {
    principal: '#7c3aed',
    intereses: '#10b981',
    dineroInicial: '#2563eb',
    aportaciones: '#f59e0b',
};

// ─── Estado de gráficos ───────────────────────────────────────────────────────
let chartPI = null; // Donut 1: Principal vs Intereses
let chartDA = null; // Donut 2: Dinero inicial vs Aportaciones

// ─── Utilidades de formato ────────────────────────────────────────────────────
const fmt = new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
});

function formatEur(n) { return fmt.format(n); }
function formatPct(n, total) {
    if (total === 0) return '0,00 %';
    return ((n / total) * 100).toFixed(1).replace('.', ',') + ' %';
}

// ─── Referencias DOM ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const inpPV = $('inp-pv');
const inpEdad = $('inp-edad');
const inpInteres = $('inp-interes');
const inpPMT = $('inp-pmt');
const inpObjetivo = $('inp-objetivo');
const inpMeta = $('inp-meta');
const inpAños = $('inp-años');
const btnCalc = $('btn-calcular');
const btnReset = $('btn-reset');
const fallbackSec = $('fallback-section');
const resultsArea = $('results-area');

const cardFV = $('card-fv');
const cardPrincipal = $('card-principal');
const cardIntereses = $('card-intereses');
const cardAportaciones = $('card-aportaciones');
const cardAños = $('card-años');

const metaBadgeRow = $('meta-badge-row');
const metaBadge = $('meta-badge');
const metaDetail = $('meta-detail');

const tablaBody = $('tabla-body');

// ─── localStorage ─────────────────────────────────────────────────────────────
function guardarEnLocalStorage() {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify({
            pv: inpPV.value,
            edad: inpEdad.value,
            interes: inpInteres.value,
            pmt: inpPMT.value,
            objetivo: inpObjetivo.value,
            meta: inpMeta.value,
            años: inpAños.value,
        }));
    } catch (e) { /* silent */ }
}

function cargarDesdeLocalStorage() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const datos = JSON.parse(raw);
        if (datos.pv !== undefined) inpPV.value = datos.pv;
        if (datos.edad !== undefined) inpEdad.value = datos.edad;
        if (datos.interes !== undefined) inpInteres.value = datos.interes;
        if (datos.pmt !== undefined) inpPMT.value = datos.pmt;
        if (datos.objetivo !== undefined) inpObjetivo.value = datos.objetivo;
        if (datos.meta !== undefined) inpMeta.value = datos.meta;
        if (datos.años !== undefined) inpAños.value = datos.años;
    } catch (e) { /* silent */ }
}

function restablecerDefaults() {
    inpPV.value = DEFAULTS.pv;
    inpEdad.value = DEFAULTS.edad;
    inpInteres.value = DEFAULTS.interes;
    inpPMT.value = DEFAULTS.pmt;
    inpObjetivo.value = DEFAULTS.objetivo;
    inpMeta.value = DEFAULTS.meta;
    inpAños.value = DEFAULTS.años;
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* silent */ }
    limpiarErrores();
    calcular();
}

// ─── Validación y errores inline ─────────────────────────────────────────────
function limpiarErrores() {
    ['pv', 'edad', 'interes', 'pmt', 'objetivo', 'meta'].forEach(id => {
        const el = $(`err-${id}`);
        if (el) el.textContent = '';
        const inp = $(`inp-${id}`);
        if (inp) inp.classList.remove('input--error');
    });
}

function mostrarError(campo, msg) {
    const errEl = $(`err-${campo}`);
    const inpEl = $(`inp-${campo}`);
    if (errEl) errEl.textContent = msg;
    if (inpEl) inpEl.classList.add('input--error');
}

function leerInputs() {
    return {
        PV: parseFloat(inpPV.value),
        edadActual: parseFloat(inpEdad.value),
        rAnual: parseFloat(inpInteres.value),
        PMT: parseFloat(inpPMT.value),
        edadObjetivo: parseFloat(inpObjetivo.value),
        meta: inpMeta.value.trim() === '' ? null : parseFloat(inpMeta.value),
        añosFallback: parseFloat(inpAños.value) || DEFAULTS.años,
    };
}

// ─── Lógica de cálculo y render ───────────────────────────────────────────────
function calcular() {
    limpiarErrores();

    const datos = leerInputs();
    const { calcularFV, calcularMesMeta, validarInputs } = window.CalcAhorros;

    // Validar
    const { valido, errores } = validarInputs({
        PV: datos.PV,
        edadActual: datos.edadActual,
        rAnual: datos.rAnual,
        PMT: datos.PMT,
        edadObjetivo: datos.edadObjetivo,
        meta: datos.meta,
    });

    if (!valido) {
        Object.entries(errores).forEach(([campo, msg]) => {
            const mapaId = { PV: 'pv', edadActual: 'edad', rAnual: 'interes', PMT: 'pmt', edadObjetivo: 'objetivo', meta: 'meta' };
            mostrarError(mapaId[campo] || campo, msg);
        });
        return;
    }

    // Determinar años simulados
    let años;
    const diferencia = datos.edadObjetivo - datos.edadActual;
    const usarFallback = diferencia <= 0;

    fallbackSec.hidden = !usarFallback;
    años = usarFallback ? datos.añosFallback : diferencia;

    // Guardar
    guardarEnLocalStorage();

    // Calcular FV
    const res = calcularFV(datos.PV, datos.rAnual, datos.PMT, años);

    // Renderizar tarjetas
    cardFV.textContent = formatEur(res.FV);
    cardPrincipal.textContent = formatEur(res.principal);
    cardIntereses.textContent = formatEur(res.intereses);
    cardAportaciones.textContent = formatEur(res.aportaciones);
    cardAños.textContent = `${años} año${años !== 1 ? 's' : ''}`;

    // Meta de ahorro
    if (datos.meta !== null && datos.meta > 0) {
        const meta = calcularMesMeta(datos.PV, datos.rAnual, datos.PMT, datos.meta, años);
        metaBadgeRow.hidden = false;
        metaBadge.className = `meta-badge ${meta.alcanzada ? 'badge--si' : 'badge--no'}`;
        metaBadge.textContent = `Meta alcanzada: ${meta.alcanzada ? '✅ Sí' : '❌ No'}`;

        if (meta.alcanzada) {
            metaDetail.textContent = `Alcanzarás ${formatEur(datos.meta)} en el año ${meta.año}, mes ${meta.mes} (mes ${meta.mesAbsoluto} del horizonte).`;
        } else {
            metaDetail.textContent = `Al final del horizonte te faltarían ${formatEur(meta.diferencia)} para alcanzar la meta.`;
        }
    } else {
        metaBadgeRow.hidden = true;
    }

    // Tabla accesible
    renderizarTabla(datos.PV, res, años);

    // Gráficos donuts
    renderizarDonuts(datos.PV, res);

    // Mostrar área de resultados
    resultsArea.hidden = false;
}

// ─── Tabla accesible ──────────────────────────────────────────────────────────
function renderizarTabla(PV, res, años) {
    const rows = [
        { concepto: 'Capital final estimado', importe: res.FV, pct: 100 },
        { concepto: 'Principal total (invertido/aportado)', importe: res.principal, pct: (res.principal / res.FV) * 100 },
        { concepto: 'Intereses ganados', importe: res.intereses, pct: (res.intereses / res.FV) * 100 },
        { concepto: 'Dinero inicial (PV)', importe: PV, pct: (PV / Math.max(res.FV, 1)) * 100 },
        { concepto: 'Aportaciones mensuales acumuladas', importe: res.aportaciones, pct: (res.aportaciones / Math.max(res.FV, 1)) * 100 },
        { concepto: 'Años simulados', importe: años, pct: null, esAños: true },
    ];

    tablaBody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.concepto}</td>
      <td>${r.esAños ? `${r.importe} año${r.importe !== 1 ? 's' : ''}` : formatEur(r.importe)}</td>
      <td>${r.pct !== null ? r.pct.toFixed(1).replace('.', ',') + ' %' : '—'}</td>
    </tr>
  `).join('');
}

// ─── Gráficos Chart.js ────────────────────────────────────────────────────────
const tooltipFormatter = (context) => {
    const label = context.label || '';
    const val = context.raw;
    const total = context.dataset.data.reduce((a, b) => a + b, 0);
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
    return ` ${label}: ${formatEur(val)} (${pct} %)`;
};

const chartOptions = (titulo) => ({
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 14,
                font: { family: "'Inter', sans-serif", size: 12, weight: '600' },
                usePointStyle: true,
                pointStyleWidth: 10,
            },
        },
        tooltip: {
            callbacks: {
                label: tooltipFormatter,
            },
            bodyFont: { family: "'Inter', sans-serif", size: 13 },
            padding: 10,
        },
    },
    animation: {
        animateRotate: true,
        duration: 600,
    },
});

function crearOActualizarDonut(canvasId, instancia, labels, data, backgroundColors, titulo) {
    const canvas = $(canvasId);
    if (!canvas) return null;

    // Filtrar segmentos con valor 0 para no confundir
    const filtrado = labels
        .map((l, i) => ({ label: l, value: data[i], color: backgroundColors[i] }))
        .filter(item => item.value > 0);

    const labelsF = filtrado.map(i => i.label);
    const dataF = filtrado.map(i => i.value);
    const colsF = filtrado.map(i => i.color);

    if (instancia) {
        instancia.data.labels = labelsF;
        instancia.data.datasets[0].data = dataF;
        instancia.data.datasets[0].backgroundColor = colsF;
        instancia.data.datasets[0].hoverOffset = 10;
        instancia.update();
        return instancia;
    }

    return new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labelsF,
            datasets: [{
                data: dataF,
                backgroundColor: colsF,
                hoverOffset: 10,
                borderWidth: 2,
                borderColor: '#ffffff',
            }],
        },
        options: chartOptions(titulo),
    });
}

function renderizarDonuts(PV, res) {
    // Donut 1: Principal vs Intereses
    chartPI = crearOActualizarDonut(
        'chart-pi',
        chartPI,
        ['Principal (invertido)', 'Intereses (ganancia)'],
        [res.principal, res.intereses],
        [COLORS.principal, COLORS.intereses],
        'Principal vs Intereses',
    );

    // Donut 2: Dinero inicial vs Aportaciones
    chartDA = crearOActualizarDonut(
        'chart-da',
        chartDA,
        ['Dinero inicial', 'Aportaciones mensuales'],
        [PV, res.aportaciones],
        [COLORS.dineroInicial, COLORS.aportaciones],
        'Desglose del Principal',
    );
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
function init() {
    // Cargar última sesión
    cargarDesdeLocalStorage();

    // Calcular en tiempo real
    [inpPV, inpEdad, inpInteres, inpPMT, inpObjetivo, inpMeta, inpAños].forEach(inp => {
        inp.addEventListener('input', debounce(calcular, 350));
    });

    btnCalc.addEventListener('click', calcular);
    btnReset.addEventListener('click', restablecerDefaults);

    // Calcular al iniciar con valores cargados
    calcular();
}

// Debounce para no disparar en cada tecla
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ─── Arranque ─────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
