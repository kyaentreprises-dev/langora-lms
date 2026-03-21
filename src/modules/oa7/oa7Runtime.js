// src/modules/oa7/oa7Runtime.js
// Runtime snapshot CANÓNICO de OA7 (para export/tabular y guardado)
// Objetivo: SIEMPRE exponer attendanceByStudentId cuando exista en window.__OA7_STATE__

function safeParse(x) {
  try {
    return JSON.parse(x);
  } catch {
    return null;
  }
}

function deepPick(obj, keys) {
  // busca keys directas
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  // busca 1 nivel adentro
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      for (const kk of keys) {
        if (v && typeof v === "object" && v[kk] != null) return v[kk];
      }
    }
  }
  return undefined;
}

function isPlainObject(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function buildAttendanceByStudentId(state) {
  // 1) Si ya existe con ese nombre, listo
  const direct = state?.attendanceByStudentId;
  if (isPlainObject(direct)) return direct;

  // 2) Intentar encontrarlo con nombres comunes
  const candidate = deepPick(state, ["attendance", "asistencias", "matrix", "grid", "byStudent"]);
  if (isPlainObject(candidate)) {
    // Validar que sea objeto id->obj
    const ids = Object.keys(candidate);
    if (ids.length && isPlainObject(candidate[ids[0]])) return candidate;
  }

  // 3) No se encontró
  return null;
}

/**
 * Setter CANÓNICO: lo que el panel va construyendo durante runtime.
 * Guardamos el estado en window.__OA7_STATE__ (fuente de verdad).
 */
export function setOA7RuntimeSnapshot(nextState) {
  try {
    // aceptamos: objeto state directo (recomendado)
    // si te pasan un "snapshot" completo, intentamos extraer .state
    const state = (nextState && nextState.state) ? nextState.state : nextState;

    if (state && typeof state === "object") {
      window.__OA7_STATE__ = state;
    } else {
      window.__OA7_STATE__ = null;
    }
  } catch {
    // ignore
  }
}

/**
 * Getter CANÓNICO: lo usa export/tabular y cualquier reporte.
 */
export function getOA7RuntimeSnapshot() {
  // Fuente 1: runtime global (lo usa el panel)
  const state = window.__OA7_STATE__ || null;

  // Si no hay runtime, cae a localStorage (por si exportan sin entrar al panel)
  if (!state) {
    const fromLS = safeParse(localStorage.getItem("langora:oa7"));
    return fromLS || null;
  }

  const attendanceByStudentId = buildAttendanceByStudentId(state);

  // Snapshot canónico
  return {
    module: "OA7",
    version: 3,
    savedAt: Date.now(),
    attendanceByStudentId: attendanceByStudentId || undefined, // CLAVE para export tabular
    state: {
      ...state,
      ...(attendanceByStudentId ? { attendanceByStudentId } : {}),
      _savedAt: new Date().toISOString(),
      _schema: "oa7_v1",
    },
  };
}
