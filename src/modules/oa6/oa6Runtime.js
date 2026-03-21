// src/modules/oa6/oa6Runtime.js
// Pequeño “puente” para que OA10 pueda leer el estado actual de OA6
// sin complicarnos con contextos todavía.

let _snapshot = null;

export function getOA6RuntimeSnapshot() {
  if (_snapshot) return _snapshot;

  try {
    if (typeof window !== "undefined" && window.__LANGORA_OA6_RUNTIME__) {
      return window.__LANGORA_OA6_RUNTIME__;
    }
  } catch {}

  return null;
}

export function setOA6RuntimeSnapshot(payload) {
  _snapshot = payload;

  try {
    if (typeof window !== "undefined") {
      window.__LANGORA_OA6_RUNTIME__ = payload;
    }
  } catch {}
}