/**
 * tests.js — Suite de tests unitarios para calc.js.
 * Mini-framework incluido, sin dependencias externas.
 */

const resultados = [];

function assert(descripcion, condicion, detalles = '') {
    resultados.push({ descripcion, ok: !!condicion, detalles });
}

function assertAlmostEqual(descripcion, valor, esperado, tolerancia = 0.01) {
    const ok = Math.abs(valor - esperado) <= tolerancia;
    resultados.push({
        descripcion,
        ok,
        detalles: ok ? '' : `Obtenido: ${valor.toFixed(4)}, Esperado: ${esperado.toFixed(4)} (±${tolerancia})`,
    });
}

// Acceso al módulo (soporte navegador y Node.js)
const { calcularFV, calcularRMensual, calcularMesMeta, validarInputs } =
    typeof module !== 'undefined' ? require('./calc.js') : window.CalcAhorros;

// ─── Test 1: Tasa mensual ───────────────────────────────────────────────────
assertAlmostEqual(
    'calcularRMensual: 12% anual → 1% mensual',
    calcularRMensual(12),
    0.01,
    0.0001
);
assertAlmostEqual(
    'calcularRMensual: 0% anual → 0% mensual',
    calcularRMensual(0),
    0,
    0.0001
);

// ─── Test 2: r = 0 (sin interés) ───────────────────────────────────────────
{
    const res = calcularFV(10000, 0, 200, 10);
    const esperadoFV = 10000 + 200 * 120;
    assertAlmostEqual('r=0: FV correcto', res.FV, esperadoFV, 0.01);
    assertAlmostEqual('r=0: intereses = 0', res.intereses, 0, 0.01);
    assert('r=0: n = 120', res.n === 120);
}

// ─── Test 3: PV = 0 ────────────────────────────────────────────────────────
{
    const res = calcularFV(0, 7, 500, 20);
    assert('PV=0: FV > 0 (solo aportaciones con interés)', res.FV > 500 * 240);
    assert('PV=0: principal = PMT*n', Math.abs(res.principal - 500 * 240) < 0.01);
}

// ─── Test 4: PMT = 0 ───────────────────────────────────────────────────────
{
    const res = calcularFV(10000, 5, 0, 30);
    const r = 5 / 100 / 12;
    const n = 360;
    const esperadoFV = 10000 * Math.pow(1 + r, n);
    assertAlmostEqual('PMT=0: FV = PV*(1+r)^n', res.FV, esperadoFV, 0.10);
    assert('PMT=0: aportaciones = 0', res.aportaciones === 0);
}

// ─── Test 5: Valores típicos (sanity check) ─────────────────────────────────
{
    const res = calcularFV(10000, 7, 200, 30);
    // Con r=7% anual, PV=10000, PMT=200, n=30 años → FV debería ser ~240.000 aprox
    assert('Valores típicos: FV > principal', res.FV > res.principal);
    assert('Valores típicos: intereses > 0', res.intereses > 0);
    assert('Valores típicos: FV > 200000', res.FV > 200000);
    assert('Valores típicos: FV < 600000', res.FV < 600000);
}

// ─── Test 6: Validación – edad_actual >= edad_objetivo ──────────────────────
{
    const res = validarInputs({
        PV: 5000, edadActual: 65, rAnual: 5, PMT: 100, edadObjetivo: 65,
    });
    // Los valores numéricos son válidos; la lógica de "años=0" la maneja main.js
    // Pero si edadActual=65 y edadObjetivo=65, años=0 → resultado trivial
    assert('Validación edad=objetivo: pasa validación básica', res.valido === true);

    // Verifica que FV con años=0 = PV
    const calc = calcularFV(5000, 5, 100, 0);
    assertAlmostEqual('años=0: FV = PV', calc.FV, 5000, 0.01);
}

// ─── Test 7: Validación – valores fuera de rango ────────────────────────────
{
    const res = validarInputs({
        PV: -100, edadActual: 200, rAnual: 50, PMT: -50, edadObjetivo: 0,
    });
    assert('Validación: detecta PV negativo', !!res.errores.PV);
    assert('Validación: detecta edad fuera de rango', !!res.errores.edadActual);
    assert('Validación: detecta interés > 30', !!res.errores.rAnual);
    assert('Validación: detecta PMT negativo', !!res.errores.PMT);
    assert('Validación: detecta edadObjetivo=0', !!res.errores.edadObjetivo);
    assert('Validación: no válido', res.valido === false);
}

// ─── Test 8: Meta de ahorro – alcanzada ─────────────────────────────────────
{
    // Con PV=10000, r=7%, PMT=500, horizonte=30 años, meta=50000 → debería alcanzar
    const res = calcularMesMeta(10000, 7, 500, 50000, 30);
    assert('Meta alcanzada: alcanzada=true', res.alcanzada === true);
    assert('Meta alcanzada: mes > 0', res.mes > 0);
    assert('Meta alcanzada: año > 0', res.año > 0);
    assert('Meta alcanzada: diferencia=0', res.diferencia === 0);
}

// ─── Test 9: Meta de ahorro – NO alcanzada ──────────────────────────────────
{
    // Meta imposible: 999.999.999 €
    const res = calcularMesMeta(1000, 5, 100, 999999999, 10);
    assert('Meta NO alcanzada: alcanzada=false', res.alcanzada === false);
    assert('Meta NO alcanzada: diferencia > 0', res.diferencia > 0);
}

// ─── Test 10: calcularFV clampea intereses negativos ─────────────────────────
{
    // Caso artificial: sin interés, FV = PV + PMT*n exacto → intereses = 0, no negativo
    const res = calcularFV(1000, 0, 0, 5);
    assert('Clamp intereses: intereses >= 0', res.intereses >= 0);
}

// ─── Exportar resultados para tests.html ─────────────────────────────────────
if (typeof window !== 'undefined') {
    window.__testResultados = resultados;
}
if (typeof module !== 'undefined') {
    module.exports.resultados = resultados;
    // Print en Node.js
    let passed = 0, failed = 0;
    resultados.forEach(r => {
        if (r.ok) { passed++; console.log(`✅ ${r.descripcion}`); }
        else { failed++; console.error(`❌ ${r.descripcion}${r.detalles ? ' — ' + r.detalles : ''}`); }
    });
    console.log(`\n${passed} pasados, ${failed} fallidos de ${resultados.length} tests.`);
}
