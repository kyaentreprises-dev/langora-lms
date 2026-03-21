// src/modules/oa7/oa7Exports.js
// OA7 Exports PRO (robusto): siempre genera 2 archivos:
// 1) Resumen
// 2) Detalle TABULAR si detecta matriz, si no -> Detalle_RAW

/** Helpers CSV */
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCSV(rows) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}
function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
function isObj(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

/**
 * Heurística: detectar "matriz" tipo { studentId: { dayKey: value, ... }, ... }
 * donde value puede ser boolean / "P" / "A" / 1/0 / etc.
 */
function looksLikeMatrixCandidate(obj) {
  if (!isObj(obj)) return false;
  const ids = Object.keys(obj);
  if (ids.length < 1) return false;

  // muchas veces ids son "s1", "S-001", etc. pero no forzamos
  const first = obj[ids[0]];
  if (!isObj(first)) return false;

  const dayKeys = Object.keys(first);
  if (dayKeys.length < 3) return false; // semana típico 5-6 días

  // revisar valores: boolean / string corta / number
  let okVals = 0;
  let total = 0;
  for (const k of dayKeys.slice(0, 6)) {
    const v = first[k];
    total++;
    const t = typeof v;
    if (
      t === "boolean" ||
      t === "number" ||
      (t === "string" && v.length <= 5) ||
      v == null
    ) okVals++;
  }
  return okVals / Math.max(1, total) >= 0.6;
}

/** DFS para encontrar la mejor matriz dentro de cualquier snapshot/state */
function findBestMatrix(root) {
  const seen = new Set();
  let best = null;
  let bestScore = -1;

  function scoreMatrix(m) {
    const ids = Object.keys(m || {});
    const nStudents = ids.length;
    const first = ids.length ? m[ids[0]] : null;
    const nDays = first && isObj(first) ? Object.keys(first).length : 0;
    return nStudents * 10 + nDays; // peso a cantidad de alumnos
  }

  function walk(node, depth) {
    if (!node || depth > 6) return;
    if (typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (looksLikeMatrixCandidate(node)) {
      const s = scoreMatrix(node);
      if (s > bestScore) {
        bestScore = s;
        best = node;
      }
    }

    // seguir recorriendo
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
    } else {
      for (const k of Object.keys(node)) walk(node[k], depth + 1);
    }
  }

  walk(root, 0);
  return best;
}

function normalizeMark(v) {
  // queremos algo consistente: P / A / ""
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "P" : "A";
  if (typeof v === "number") return v ? "P" : "A";
  const s = String(v).trim().toLowerCase();
  if (!s) return "";
  if (["p", "presente", "present", "ok", "✓", "si", "sí", "1", "true"].includes(s)) return "P";
  if (["a", "ausente", "absent", "x", "no", "0", "false"].includes(s)) return "A";
  // si ya trae algo raro, lo dejamos
  return String(v);
}

/**
 * Export canónico
 * - Acepta runtimeSnapshot opcional
 * - Si no llega, intenta window.__OA7_STATE__ o localStorage langora:oa7
 */
export function exportOA7CSV(runtimeSnapshot) {
  const stamp = new Date().toISOString().slice(0, 10);

  // 1) Resolver snapshot/state desde donde sea
  const fromRuntime = runtimeSnapshot || null;
  const fromWindow = (typeof window !== "undefined" && window.__OA7_STATE__) ? window.__OA7_STATE__ : null;
  const fromLS = safeJsonParse(localStorage.getItem("langora:oa7"));

  const snap = fromRuntime || fromLS || null;
  const state = snap?.state || fromWindow || snap || fromLS || null;

  // 2) Buscar matriz
  // Intentos directos primero
  let matrix =
    (snap?.attendanceByStudentId && isObj(snap.attendanceByStudentId) ? snap.attendanceByStudentId : null) ||
    (state?.attendanceByStudentId && isObj(state.attendanceByStudentId) ? state.attendanceByStudentId : null) ||
    (state?.attendance && isObj(state.attendance) ? state.attendance : null) ||
    null;

  // Si no, DFS (pro)
  if (!matrix) matrix = findBestMatrix(snap) || findBestMatrix(state);

  // 3) Export Resumen (siempre)
  const resumen = [];
  resumen.push(["exportedAt", new Date().toISOString()]);
  resumen.push(["module", "OA7"]);
  resumen.push(["hasMatrix", matrix ? "yes" : "no"]);
  resumen.push(["studentsCount", matrix ? Object.keys(matrix).length : ""]);
  // weekStartISO si existe
  const weekStartISO = state?.weekStartISO || snap?.weekStartISO || state?.meta?.weekStartISO || "";
  if (weekStartISO) resumen.push(["weekStartISO", weekStartISO]);

  downloadTextFile(`Langora_OA7_Resumen_${stamp}.csv`, toCSV(resumen));

  // 4) Export Detalle
  if (matrix && isObj(matrix)) {
    const studentIds = Object.keys(matrix);
    const firstRow = studentIds.length ? matrix[studentIds[0]] : {};
    const dayKeys = isObj(firstRow) ? Object.keys(firstRow) : [];

    // Header tabular
    const rows = [];
    rows.push(["studentId", ...dayKeys, "presentCount", "absentCount", "pct"]);

    for (const sid of studentIds) {
      const rowObj = matrix[sid] || {};
      let p = 0, a = 0;

      const marks = dayKeys.map((dk) => {
        const m = normalizeMark(rowObj[dk]);
        if (m === "P") p++;
        else if (m === "A") a++;
        return m;
      });

      const total = dayKeys.length || 0;
      const pct = total ? Math.round((p / total) * 100) : "";

      rows.push([sid, ...marks, p, a, pct]);
    }

    downloadTextFile(`Langora_OA7_Detalle_${stamp}.csv`, toCSV(rows));
    alert("OA7 exportado en modo TABULAR ✅ (Resumen + Detalle).");
    return;
  }

  // 5) Fallback RAW (si no encontramos matriz)
  const raw = [];
  raw.push(["exportedAt", new Date().toISOString()]);
  raw.push(["module", "OA7"]);
  raw.push(["note", "RAW (no se detectó estructura tabular)"]);
  raw.push(["raw_json"]);
  raw.push([JSON.stringify(snap || state || fromLS || {})]);

  downloadTextFile(`Langora_OA7_Detalle_RAW_${stamp}.csv`, toCSV(raw));
  alert("OA7 exportado en modo RAW (no se detectó estructura tabular). Se generaron 2 archivos (Resumen + Detalle RAW).");
}
