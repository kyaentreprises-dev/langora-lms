// src/modules/oa9/oa9Engine.js
export function makeDefaultOA9Config() {
  return {
    module: "OA9",
    version: 1,
    baseLanguage: "DE",
    timezone: "America/Mexico_City",
    weekWindows: {
      mon: [{ start: "07:00", end: "21:00" }],
      tue: [{ start: "07:00", end: "21:00" }],
      wed: [{ start: "07:00", end: "21:00" }],
      thu: [{ start: "07:00", end: "21:00" }],
      fri: [], // apagado por default
      sat: [
        { start: "09:00", end: "12:00" },
        { start: "13:00", end: "16:00" },
      ],
      sun: [], // apagado por default
    },
    templates: {
      regular_2x: { label: "Regular (2x/sem)", sessionsPerWeek: 2, sessionMinutes: 90, allowAnyDays: true },
      intensive_4x: { label: "Intensivo (4x/sem)", sessionsPerWeek: 4, sessionMinutes: 90, allowAnyDays: true },
      sabatino_3h: { label: "Sabatino (3h)", sessionsPerWeek: 1, sessionMinutes: 180, day: "sat" },
      sabatino_90: { label: "Sabatino (90m opcional)", sessionsPerWeek: 1, sessionMinutes: 90, day: "sat" },
    },
    flags: {
      allowFriIfEnabledLater: true,
      allowSunIfEnabledLater: true,
    },
    updatedAt: new Date().toISOString(),
  };
}
// ===============================
// OA9.3 — Slot generator (V1)
// ===============================

function toMin(hhmm) {
  const [h, m] = (hhmm || "00:00").split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

function toHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const pad = (x) => String(x).padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

function addMinutes(hhmm, delta) {
  return toHHMM(toMin(hhmm) + delta);
}

function normalizeBlocks(blocks) {
  return (blocks || [])
    .filter((b) => b?.start && b?.end)
    .map((b) => ({ start: b.start, end: b.end }))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}

function makeSlotsFromBlock(block, durationMin, stepMin) {
  const out = [];
  const start = toMin(block.start);
  const end = toMin(block.end);

  for (let t = start; t + durationMin <= end; t += stepMin) {
    out.push({ start: toHHMM(t), end: toHHMM(t + durationMin) });
  }
  return out;
}

const DAY_TO_TITLE = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function normalizeWeekWindows(weekWindows = {}) {
  // Convierte Mon/Tue... a mon/tue... si llegara a venir mezclado
  const out = {};
  for (const [k, v] of Object.entries(weekWindows || {})) {
    const key = String(k).toLowerCase();
    out[key] = Array.isArray(v) ? v : [];
  }
  return out;
}
/**
 * Genera slots por día en base a cfg.weekWindows y plantillas.
 * - Regular/Intensivo: 90m
 * - Sabatino: 180m (principal) + 90m opcional
 */
export function generateSlots(cfg) {
  const weekWindows = cfg?.weekWindows || {};
  const slotsByDay = {};

  const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const Title = (d) => d.charAt(0).toUpperCase() + d.slice(1);

  for (const day of DAY_KEYS) {
    const blocks = normalizeBlocks(weekWindows[day] || weekWindows[Title(day)] || []);
    const out = { s90: [], s180: [] };

    // 90 min (step 30)
    for (const b of blocks) {
      out.s90.push(...makeSlotsFromBlock(b, 90, 30));
    }

    // 180 min solo sábado (step 30)
    if (day === "sat") {
      for (const b of blocks) {
        const dur = minutesBetween(b.start, b.end);
        if (dur >= 180) {
          out.s180.push(...makeSlotsFromBlock(b, 180, 30));
        }
      }
    }

    // Guardar en ambos estilos de llave para compatibilidad UI
    slotsByDay[day] = out;           // sat
    slotsByDay[Title(day)] = out;    // Sat
  }

  return slotsByDay;
}

/** Helpers */

function minutesBetween(a, b) {
  const toMin = (hhmm) => {
    const [h, m] = String(hhmm).split(":").map((x) => parseInt(x, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };
  const A = toMin(a);
  const B = toMin(b);
  if (Number.isNaN(A) || Number.isNaN(B)) return NaN;
  return B - A;
}

/**
 * Validación básica: start < end, formato HH:MM, y duración lógica.
 */
export function validateWeekWindows(cfg) {
  const weekWindows = cfg?.weekWindows || {};
  const errors = [];

  const re = /^\d{2}:\d{2}$/;

  Object.entries(weekWindows).forEach(([day, blocks]) => {
    (blocks || []).forEach((b, idx) => {
      if (!b?.start || !b?.end) {
        errors.push(`${day} bloque #${idx + 1}: falta start/end`);
        return;
      }
      if (!re.test(b.start) || !re.test(b.end)) {
        errors.push(`${day} bloque #${idx + 1}: formato inválido (HH:MM)`);
        return;
      }
      const s = toMin(b.start);
      const e = toMin(b.end);
      if (e <= s) errors.push(`${day} bloque #${idx + 1}: end debe ser > start`);
      if (e - s < 90) errors.push(`${day} bloque #${idx + 1}: ventana < 90 min (muy corta)`);
    });
  });

  return errors;
}
