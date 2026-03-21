// src/modules/oa9/oa9Policy.js
// OA9 Policy v1 — horarios base + programas + duración por defecto (F) y por nivel (G)

export const OA9_POLICY_V1 = {
  version: 1,
  timezone: "America/Monterrey",
  baseLanguage: "DE",

  // Ventanas típicas (institucional)
  days: {
    monday:    { enabled: true,  windows: [{ start: "07:00", end: "21:00" }] },
    tuesday:   { enabled: true,  windows: [{ start: "07:00", end: "21:00" }] },
    wednesday: { enabled: true,  windows: [{ start: "07:00", end: "21:00" }] },
    thursday:  { enabled: true,  windows: [{ start: "07:00", end: "21:00" }] },
    friday:    { enabled: false, windows: [{ start: "07:00", end: "21:00" }] },
    saturday:  { enabled: true,  windows: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "16:00" }] },
    sunday:    { enabled: false, windows: [{ start: "09:00", end: "14:00" }] },
  },

  // Granularidad de “grid”
  slotMinutes: 30,

  // Duraciones: F + G
  durations: {
    defaultWeeks: 16, // F ✅
    // G ✅ (puedes editar esto cuando definamos “por nivel” en serio)
    weeksByCourseId: {
      // ejemplo:
      // "de-a1-1": 8,
      // "de-a1-2": 8,
      // "de-a1": 16,
    },
  },

  programs: {
    regular_2x: {
      label: "Regular (2x semana)",
      sessionsPerWeek: 2,
      sessionMinutes: 90,
      defaultCombos: [
        ["monday", "wednesday"], // R1
        ["tuesday", "thursday"], // R2
      ],
      allowAnyCombo: true, // R4 ✅
    },

    intensive_4x: {
      label: "Intensivo (4x semana)",
      sessionsPerWeek: 4,
      sessionMinutes: 90,
      defaultDays: ["monday", "tuesday", "wednesday", "thursday"],
    },

    saturday_1x: {
      label: "Sabatino (1x semana)",
      sessionsPerWeek: 1,
      defaultDays: ["saturday"],
      defaultSessionMinutes: 180, // S2 default ✅
      allowedSessionMinutes: [90, 180], // S1+S2 ✅
      // C ✅: puede ser mañana o tarde (se elige en UI)
    },

    custom: {
      label: "Personalizado / Empresarial",
      sessionsPerWeek: null,
      allowAnyDay: true,
      allowedSessionMinutes: [30, 60, 90, 120, 150, 180],
    },
  },

  // Plantillas rápidas para tu catálogo público
  publicPresets: {
    regular: ["R1", "R2"], // tú ofreces por defecto, pero el admin puede hacer R4
    saturday: ["S2"],      // tu oferta principal
  },
};
