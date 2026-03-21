// src/modules/oa9/oa9Runtime.js
// Snapshot canónico para “Exportar / Guardar / Reportes”

export function setOA9RuntimeSnapshot(snapshot) {
  try {
    window.__OA9_RUNTIME__ = snapshot ?? null;
  } catch {}
}

export function getOA9RuntimeSnapshot() {
  try {
    return window.__OA9_RUNTIME__ ?? null;
  } catch {
    return null;
  }
}
