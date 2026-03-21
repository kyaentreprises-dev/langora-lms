// src/modules/oa9/oa9Runtime.js
// Runtime mínimo para OA9 (horarios). Similar a OA7 pero simple.

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
