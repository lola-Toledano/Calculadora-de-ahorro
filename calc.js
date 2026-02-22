/**
 * calc.js — Módulo puro de cálculo para la Calculadora de Ahorros.
 * Sin efectos secundarios. Exporta funciones testeables.
 */

/**
 * Convierte tasa anual a mensual.
 * @param {number} r_anual - Interés anual en porcentaje (ej. 7 para 7%).
 * @returns {number} Tasa mensual decimal.
 */
function calcularRMensual(r_anual) {
  return (r_anual / 100) / 12;
}

/**
 * Calcula el Valor Futuro con interés compuesto y aportaciones mensuales.
 *
 * Fórmula:
 *   r > 0: FV = PV*(1+r)^n + PMT * ((1+r)^n - 1) / r
 *   r = 0: FV = PV + PMT*n
 *
 * Intereses negativos por redondeo se clampean a 0.
 *
 * @param {number} PV  - Capital inicial (€).
 * @param {number} r_anual - Interés anual en porcentaje.
 * @param {number} PMT - Aportación mensual (€).
 * @param {number} años - Número de años a simular.
 * @returns {{ FV: number, principal: number, intereses: number, aportaciones: number, n: number }}
 */
function calcularFV(PV, r_anual, PMT, años) {
  const r = calcularRMensual(r_anual);
  const n = Math.round(años * 12);
  let FV;

  if (r > 0) {
    const factor = Math.pow(1 + r, n);
    FV = PV * factor + PMT * ((factor - 1) / r);
  } else {
    FV = PV + PMT * n;
  }

  const aportaciones = PMT * n;
  const principal = PV + aportaciones;
  const intereses = Math.max(FV - principal, 0); // clamp: nunca negativo por redondeo

  return { FV, principal, intereses, aportaciones, n };
}

/**
 * Calcula en qué mes/año se alcanza una meta de ahorro dentro del horizonte.
 *
 * @param {number} PV - Capital inicial (€).
 * @param {number} r_anual - Interés anual en porcentaje.
 * @param {number} PMT - Aportación mensual (€).
 * @param {number} meta - Meta de ahorro en € a alcanzar.
 * @param {number} añosHorizonte - Años máximos del horizonte.
 * @returns {{ alcanzada: boolean, mes: number|null, año: number|null, diferencia: number }}
 */
function calcularMesMeta(PV, r_anual, PMT, meta, añosHorizonte) {
  if (!meta || meta <= 0) {
    return { alcanzada: false, mes: null, año: null, diferencia: 0 };
  }

  const r = calcularRMensual(r_anual);
  const nTotal = Math.round(añosHorizonte * 12);
  let saldo = PV;

  for (let m = 1; m <= nTotal; m++) {
    if (r > 0) {
      saldo = saldo * (1 + r) + PMT;
    } else {
      saldo = saldo + PMT;
    }

    if (saldo >= meta) {
      return {
        alcanzada: true,
        mes: ((m - 1) % 12) + 1,
        año: Math.floor((m - 1) / 12) + 1,
        mesAbsoluto: m,
        diferencia: 0,
      };
    }
  }

  // No se alcanza dentro del horizonte
  const resultado = calcularFV(PV, r_anual, PMT, añosHorizonte);
  return {
    alcanzada: false,
    mes: null,
    año: null,
    mesAbsoluto: null,
    diferencia: Math.max(meta - resultado.FV, 0),
  };
}

/**
 * Valida los inputs del formulario.
 *
 * @param {{ PV: number, edadActual: number, rAnual: number, PMT: number, edadObjetivo: number, meta?: number }} datos
 * @returns {{ valido: boolean, errores: Record<string, string> }}
 */
function validarInputs(datos) {
  const errores = {};

  if (isNaN(datos.PV) || datos.PV < 0) {
    errores.PV = 'El dinero actual debe ser ≥ 0 €.';
  }
  if (isNaN(datos.edadActual) || datos.edadActual < 0 || datos.edadActual > 120) {
    errores.edadActual = 'La edad actual debe estar entre 0 y 120.';
  }
  if (isNaN(datos.rAnual) || datos.rAnual < 0 || datos.rAnual > 30) {
    errores.rAnual = 'El interés anual debe estar entre 0 % y 30 %.';
  }
  if (isNaN(datos.PMT) || datos.PMT < 0) {
    errores.PMT = 'La aportación mensual debe ser ≥ 0 €.';
  }
  if (isNaN(datos.edadObjetivo) || datos.edadObjetivo < 1 || datos.edadObjetivo > 120) {
    errores.edadObjetivo = 'La edad objetivo debe estar entre 1 y 120.';
  }
  if (datos.meta !== undefined && datos.meta !== null && datos.meta !== '' && (isNaN(datos.meta) || datos.meta < 0)) {
    errores.meta = 'La meta de ahorro debe ser ≥ 0 €.';
  }

  return { valido: Object.keys(errores).length === 0, errores };
}

// Exporta para uso en módulo ES o como globales en navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcularFV, calcularRMensual, calcularMesMeta, validarInputs };
} else {
  window.CalcAhorros = { calcularFV, calcularRMensual, calcularMesMeta, validarInputs };
}
