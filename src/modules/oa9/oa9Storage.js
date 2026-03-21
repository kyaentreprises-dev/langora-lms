// src/modules/oa9/oa9Storage.js

const KEY = "langora_oa9_draft"; // si en tu proyecto ya usabas otra, pon aquí la misma

export function loadOA9Draft() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // extra guard: si no es objeto, lo ignoramos
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (err) {
    console.warn("[OA9] Draft corrupto. Se limpia automáticamente.", err);
    try {
      localStorage.removeItem(KEY);
    } catch (_) {}
    return null;
  }
}

export function saveOA9Draft(cfg) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
    return true;
  } catch (err) {
    console.warn("[OA9] No se pudo guardar draft", err);
    return false;
  }
}

export function clearOA9Draft() {
  try {
    localStorage.removeItem(KEY);
  } catch (_) {}
}