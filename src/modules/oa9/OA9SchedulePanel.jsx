// src/modules/oa9/OA9SchedulePanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { makeDefaultOA9Config } from "./oa9Engine";
import { loadOA9Draft, saveOA9Draft } from "./oa9Storage";
import { setOA9RuntimeSnapshot } from "./oa9Runtime";
import { generateSlots, validateWeekWindows } from "./oa9Engine";

const DAYS = [
  ["mon", "Lunes"],
  ["tue", "Martes"],
  ["wed", "Miércoles"],
  ["thu", "Jueves"],
  ["fri", "Viernes"],
  ["sat", "Sábado"],
  ["sun", "Domingo"],
];

// Limpia bloques inválidos (sin start/end) para evitar “pantallas raras”
function sanitizeConfig(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const cfg = structuredClone(raw);
  const ww = cfg.weekWindows || {};
  const nextWW = {};

  for (const [dayKey, blocks] of Object.entries(ww)) {
    const arr = Array.isArray(blocks) ? blocks : [];
    nextWW[dayKey] = arr.filter((b) => b && b.start && b.end);
  }

  cfg.weekWindows = nextWW;
  return cfg;
}
function toHumanSlot(s) {
  // Acepta string o {start,end}
  if (!s) return "";
  if (typeof s === "string") return s;
  if (typeof s === "object") {
    const a = s.start || "";
    const b = s.end || "";
    if (a && b) return `${a}–${b}`;
    return a || b || "";
  }
  return String(s);
}

function dayLabelFromKey(key) {
  const map = {
    Mon: "Lunes",
    Tue: "Martes",
    Wed: "Miércoles",
    Thu: "Jueves",
    Fri: "Viernes",
    Sat: "Sábado",
    Sun: "Domingo",
    mon: "Lunes",
    tue: "Martes",
    wed: "Miércoles",
    thu: "Jueves",
    fri: "Viernes",
    sat: "Sábado",
    sun: "Domingo",
  };
  return map[key] || key;
}

export default function OA9SchedulePanel() {
  const [cfg, setCfg] = useState(() => {
    const loaded = loadOA9Draft();
    const base = loaded || makeDefaultOA9Config();
    return sanitizeConfig(base);
  });

  const [savedToast, setSavedToast] = useState("");

  // Mantener snapshot runtime
  useEffect(() => {
    setOA9RuntimeSnapshot({
      module: "OA9",
      version: cfg?.version ?? 1,
      savedAt: Date.now(),
      config: cfg,
    });
  }, [cfg]);

  // Validación de ventanas (errores)
  const validationErrors = useMemo(() => {
    return validateWeekWindows(cfg);
  }, [cfg]);

    // Preview rápido de slots (solo para confirmar que genera)
  const slotsPreview = useMemo(() => {
    const slots = generateSlots(cfg);

    // helper: soporta Mon/mon, Sat/sat, etc.
    const pickDay = (dayTitle) => {
      const lower =
        dayTitle === "Mon" ? "mon" :
        dayTitle === "Tue" ? "tue" :
        dayTitle === "Wed" ? "wed" :
        dayTitle === "Thu" ? "thu" :
        dayTitle === "Fri" ? "fri" :
        dayTitle === "Sat" ? "sat" :
        dayTitle === "Sun" ? "sun" : dayTitle.toLowerCase();

      return slots?.[dayTitle] || slots?.[lower] || {};
    };

    const mon = pickDay("Mon");
    const sat = pickDay("Sat");

    return {
      Mon: { s90: (mon.s90 || []).slice(0, 12) },
      Sat: {
        s90: (sat.s90 || []).slice(0, 12),
        s180: (sat.s180 || []).slice(0, 12),
      },
      __debugKeys: Object.keys(slots || {}),
    };
  }, [cfg]);

    const slotsByDay = useMemo(() => {
    // generateSlots suele regresar keys tipo "Mon", "Tue"... (por eso usamos esas)
    const raw = generateSlots(cfg) || {};
const order = [
  ["Mon", "mon"],
  ["Tue", "tue"],
  ["Wed", "wed"],
  ["Thu", "thu"],
  ["Fri", "fri"],
  ["Sat", "sat"],
];

const out = {};
for (const [K1, K2] of order) {
  const day = raw[K1] || raw[K2] || {};
  out[K1] = {
    s90: (day.s90 || []).map(toHumanSlot),
    s180: (day.s180 || []).map(toHumanSlot),
  };
}
return out;

  }, [cfg]);

  // Resumen (cuántos días tienen bloques)
  const windowsSummary = useMemo(() => {
    const onDays = Object.entries(cfg.weekWindows || {}).filter(([, arr]) => (arr || []).length);
    return `${onDays.length}/7 días activos`;
  }, [cfg]);

  function onSave() {
    const next = { ...cfg, updatedAt: new Date().toISOString() };
    const ok = saveOA9Draft(next);
    setCfg(next);
    setSavedToast(ok ? "Guardado ✅" : "No se pudo guardar ❌");
    setTimeout(() => setSavedToast(""), 1200);
  }

  function onReset() {
    const next = makeDefaultOA9Config();
    next.updatedAt = new Date().toISOString();
    setCfg(sanitizeConfig(next));
    setSavedToast("Reset ✅");
    setTimeout(() => setSavedToast(""), 1200);
  }

  function onExportJSON() {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `langora_oa9_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-semibold">OA9 — Horarios (V1)</div>
          <div className="text-sm text-slate-600">
            Idioma base: <span className="font-medium">{cfg?.baseLanguage || "—"}</span>{" "}
            · {windowsSummary} ·{" "}
            <span className="text-slate-500">
              Última act.: {cfg?.updatedAt ? new Date(cfg.updatedAt).toLocaleString() : "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            onClick={onSave}
          >
            Guardar
          </button>

          <button
            className="px-3 py-2 rounded-lg bg-white border text-sm hover:bg-slate-50"
            onClick={onExportJSON}
          >
            Exportar JSON
          </button>

          <button
            className="px-3 py-2 rounded-lg bg-white border text-sm hover:bg-slate-50"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Toast */}
      {savedToast ? (
        <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
          {savedToast}
        </div>
      ) : null}

      {/* Advertencias */}
      {Array.isArray(validationErrors) && validationErrors.length ? (
        <div className="rounded-2xl border bg-amber-50 p-4">
          <div className="font-semibold text-amber-900 mb-2">Advertencias:</div>
          <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
            {validationErrors.map((e, idx) => (
              <li key={idx}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Preview Slots */}
      <div className="rounded-2xl border bg-white p-4 space-y-2">
        <div className="font-semibold">Preview Slots (test interno)</div>
        <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto">
          {JSON.stringify(slotsPreview, null, 2)}
        </pre>
      </div>
      {/* OA9.3 — Vista semanal visual */}
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Vista semanal (visual)</div>
            <div className="text-xs text-slate-500">
              Slots generados a partir de ventanas (90 min; sábado también 180 min si aplica).
            </div>
          </div>
        </div>

        <div className="overflow-auto border rounded-xl">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-3 w-40">Tipo</th>
                {Object.keys(slotsByDay).map((k) => (
                  <th key={k} className="text-left p-3 whitespace-nowrap">
                    {dayLabelFromKey(k)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* 90 min */}
              <tr className="border-b">
                <td className="p-3 font-medium text-slate-700">90 min</td>
                {Object.keys(slotsByDay).map((k) => (
                  <td key={k} className="p-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {(slotsByDay[k].s90 || []).length ? (
                        slotsByDay[k].s90.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                            title={`Slot ${k}`}
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* 180 min (solo sábado generalmente) */}
              <tr>
                <td className="p-3 font-medium text-slate-700">180 min</td>
                {Object.keys(slotsByDay).map((k) => (
                  <td key={k} className="p-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {(slotsByDay[k].s180 || []).length ? (
                        slotsByDay[k].s180.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-800 ring-1 ring-indigo-200"
                            title={`Slot 180 ${k}`}
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna A */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 space-y-3">
            <div className="font-semibold">Reglas base</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1">
                <div className="text-sm text-slate-600">Idioma base</div>
                <input
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={cfg.baseLanguage || ""}
                  onChange={(e) =>
                    setCfg({ ...cfg, baseLanguage: e.target.value.toUpperCase(), updatedAt: new Date().toISOString() })
                  }
                  placeholder="DE / EN / ES"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm text-slate-600">Zona horaria</div>
                <input
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={cfg.timezone || ""}
                  onChange={(e) =>
                    setCfg({ ...cfg, timezone: e.target.value, updatedAt: new Date().toISOString() })
                  }
                  placeholder="America/Mexico_City"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 space-y-3">
            <div className="font-semibold">Plantillas (modalidades)</div>
            <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
              <li>Regular 2x/sem: cualquier combinación (90 min)</li>
              <li>Intensivo 4x/sem: 90 min</li>
              <li>Sabatino: 3h (principal) + 90m opcional</li>
            </ul>
            <div className="text-xs text-slate-500">
              (Luego lo haremos editable desde UI; por ahora está fijo para avanzar rápido.)
            </div>
          </div>
        </div>

        {/* Columna B */}
        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Ventanas de operación</div>
            <div className="text-xs text-slate-500">L-V (default), Sáb (doble), Dom apagado</div>
          </div>

          <div className="space-y-3">
            {Object.entries(cfg.weekWindows || {}).map(([dayKey, blocks]) => (
              <div key={dayKey} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium uppercase text-sm">{dayKey}</div>

                  <button
                    className="text-sm px-2 py-1 rounded-lg border hover:bg-slate-50"
                    onClick={() => {
                      const nextWW = { ...(cfg.weekWindows || {}) };
                      const arr = Array.isArray(nextWW[dayKey]) ? [...nextWW[dayKey]] : [];

                      // Defaults pro:
                      // Semana: 07:00–21:00
                      // Sábado: 09:00–12:00 y luego 13:00–16:00 (doble jornada)
                      let start = "07:00";
                      let end = "21:00";
                      if (dayKey === "sat") {
                        if (arr.length === 0) {
                          start = "09:00";
                          end = "12:00";
                        } else {
                          start = "13:00";
                          end = "16:00";
                        }
                      }
                      if (dayKey === "sun") {
                        start = "09:00";
                        end = "12:00";
                      }

                      arr.push({ start, end });
                      nextWW[dayKey] = arr;

                      setCfg({ ...cfg, weekWindows: nextWW, updatedAt: new Date().toISOString() });
                    }}
                  >
                    + Agregar bloque
                  </button>
                </div>

                <div className="mt-2 space-y-2">
                  {(blocks || []).length ? (
                    blocks.map((b, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <input
                          className="px-3 py-2 rounded-lg border text-sm w-24"
                          value={b.start || ""}
                          onChange={(e) => {
                            const nextWW = { ...(cfg.weekWindows || {}) };
                            const arr = [...(nextWW[dayKey] || [])];
                            arr[idx] = { ...arr[idx], start: e.target.value };
                            nextWW[dayKey] = arr;
                            setCfg({ ...cfg, weekWindows: nextWW, updatedAt: new Date().toISOString() });
                          }}
                        />
                        <span className="text-slate-500 text-sm">a</span>
                        <input
                          className="px-3 py-2 rounded-lg border text-sm w-24"
                          value={b.end || ""}
                          onChange={(e) => {
                            const nextWW = { ...(cfg.weekWindows || {}) };
                            const arr = [...(nextWW[dayKey] || [])];
                            arr[idx] = { ...arr[idx], end: e.target.value };
                            nextWW[dayKey] = arr;
                            setCfg({ ...cfg, weekWindows: nextWW, updatedAt: new Date().toISOString() });
                          }}
                        />
                        <button
                          className="ml-auto text-sm px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          onClick={() => {
                            const nextWW = { ...(cfg.weekWindows || {}) };
                            const arr = [...(nextWW[dayKey] || [])];
                            arr.splice(idx, 1);
                            nextWW[dayKey] = arr;
                            setCfg({ ...cfg, weekWindows: nextWW, updatedAt: new Date().toISOString() });
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">Sin bloques (día apagado).</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            Tip: si te sale una advertencia de “falta start/end”, elimina ese bloque o complétalo.
          </div>
        </div>
      </div>
    </div>
  );
}
