// src/modules/oa6/oa6Exports.js
import { OA6_COURSES } from "./oa6MockData";

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

/**
 * Export CANÓNICO que App.jsx debe importar:
 *   import { exportOA6CSV } from "./modules/oa6/oa6Exports";
 */
export function exportOA6CSV(runtimeSnapshot) {
  // runtimeSnapshot esperado: { students, meta }
  const students = runtimeSnapshot?.students || [];

  // Columnas dinámicas por evaluaciones del curso (según OA6_COURSES)
  // Para hacerlo robusto: juntamos TODOS los labels de evaluaciones de todos los cursos
  const evalColumns = [];
  const evalKeyToLabel = {};
  for (const c of OA6_COURSES) {
    for (const ev of c.evaluations) {
      if (!evalKeyToLabel[ev.id]) {
        evalKeyToLabel[ev.id] = ev.label;
        evalColumns.push(ev.id);
      }
    }
  }

  const header = [
    "Alumno",
    "Curso",
    "Estatus",
    "Promedio",
    ...evalColumns.map((id) => evalKeyToLabel[id] || id),
  ];

  // computeWeightedAverage “mini” (para no depender de otros imports)
  function computeWeightedAverage(course, scores) {
    if (!course) return 0;
    const byType = {};
    for (const ev of course.evaluations) {
      const v = scores?.[ev.id];
      if (typeof v === "number") {
        byType[ev.type] ||= [];
        byType[ev.type].push(v);
      }
    }
    let total = 0;
    let usedWeight = 0;
    for (const t of course.evaluationTypes) {
      const arr = byType[t.type] || [];
      if (!arr.length) continue;
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      total += avg * t.weight;
      usedWeight += t.weight;
    }
    if (!usedWeight) return 0;
    return Math.round(total / usedWeight);
  }

  const rows = [header];

  for (const s of students) {
    const course = OA6_COURSES.find((c) => c.id === s.courseId);
    const avg = computeWeightedAverage(course, s.scores);
    rows.push([
      s.name,
      course?.name || s.courseId || "",
      s.publishStatus || "draft",
      avg,
      ...evalColumns.map((id) => (s.scores?.[id] ?? "")),
    ]);
  }

  const csv = toCSV(rows);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(`langora_OA6_calificaciones_${stamp}.csv`, csv);
}
