// src/modules/oa6/OA6SessionsPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { loadOA9Draft } from "../oa9/oa9Storage";
import { generateSlots } from "../oa9/oa9Engine";
import { loadOA6SessionsDraft, saveOA6SessionsDraft } from "./oa6Storage";
import { setOA6RuntimeSnapshot } from "./oa6Runtime";

const DAY_LABEL = {
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

const DAY_OPTIONS = [
  ["Mon", "Lunes"],
  ["Tue", "Martes"],
  ["Wed", "Miércoles"],
  ["Thu", "Jueves"],
  ["Fri", "Viernes"],
  ["Sat", "Sábado"],
];

function toHumanSlot(s) {
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

function uid(prefix = "sess") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sanitizeOA9Config(raw) {
  if (!raw || typeof raw !== "object") return null;

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

function safeLoadOA9FromAnywhere() {
  try {
    // 1) Draft persistido
    const draft = loadOA9Draft();
    if (draft && typeof draft === "object") {
      return sanitizeOA9Config(draft);
    }

    // 2) Runtime snapshot estilo __OA9_RUNTIME__
    if (window.__OA9_RUNTIME__?.config) {
      return sanitizeOA9Config(window.__OA9_RUNTIME__.config);
    }

    // 3) Runtime snapshot estilo __OA9_STATE__
    if (window.__OA9_STATE__) {
      return sanitizeOA9Config(window.__OA9_STATE__);
    }

    return null;
  } catch {
    return null;
  }
}

function parseSlotToMinutes(slotStr) {
  if (!slotStr || typeof slotStr !== "string") return null;
  const cleaned = slotStr.replace("–", "-").trim();
  const [a, b] = cleaned.split("-").map((x) => x.trim());
  if (!a || !b) return null;

  const toMin = (hhmm) => {
    const [hh, mm] = hhmm.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const start = toMin(a);
  const end = toMin(b);
  if (start == null || end == null) return null;
  return { start, end };
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

export default function OA6SessionsPanel() {
  const [oa9Cfg, setOA9Cfg] = useState(() => safeLoadOA9FromAnywhere());
  const [sessions, setSessions] = useState(() => loadOA6SessionsDraft() || []);

  const [kind, setKind] = useState("s90");
  const [dayKey, setDayKey] = useState("Mon");
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");

  function refreshOA9() {
    const cfg = safeLoadOA9FromAnywhere();
    setOA9Cfg(cfg);

    if (cfg) {
      setToast("OA9 recargado ✅");
    } else {
      setToast("No se encontró OA9. Ve a Horarios (OA9) y guarda con el botón interno.");
    }

    setTimeout(() => setToast(""), 1600);
  }

  const slotsByDay = useMemo(() => {
    if (!oa9Cfg) return {};

    try {
      const raw = generateSlots(oa9Cfg) || {};
      const out = {};

      for (const [K, label] of DAY_OPTIONS) {
        const lower = K.toLowerCase();
        const day = raw?.[K] || raw?.[lower] || {};
        out[K] = {
          label,
          s90: (day.s90 || []).map(toHumanSlot),
          s180: (day.s180 || []).map(toHumanSlot),
        };
      }

      return out;
    } catch (e) {
      console.warn("[OA6Sessions] Error generando slots desde OA9:", e);
      return {};
    }
  }, [oa9Cfg]);

  const slotOptions = useMemo(() => {
    const day = slotsByDay?.[dayKey] || { s90: [], s180: [] };
    return kind === "s180" ? day.s180 : day.s90;
  }, [slotsByDay, dayKey, kind]);

  useEffect(() => {
    setOA6RuntimeSnapshot({
      module: "OA6",
      version: 1,
      savedAt: Date.now(),
      sessionsCount: sessions.length,
      hasOA9: !!oa9Cfg,
      dayKey,
      kind,
    });
  }, [sessions.length, oa9Cfg, dayKey, kind]);

  function saveAll(nextSessions) {
    setSessions(nextSessions);
    try {
      saveOA6SessionsDraft(nextSessions);
    } catch {
      // ignore
    }
  }

  function onCreateSession() {
    if (!oa9Cfg) {
      setToast("No hay configuración OA9 cargada. Abre Horarios (OA9), guarda y luego 'Recargar OA9'.");
      setTimeout(() => setToast(""), 2000);
      return;
    }

    if (!slot) {
      setToast("Elige un slot primero.");
      setTimeout(() => setToast(""), 1200);
      return;
    }

    const exists = sessions.some(
      (s) => s.dayKey === dayKey && s.kind === kind && s.slot === slot
    );

    if (exists) {
      setToast("Ya existe una sesión en ese slot ⚠️");
      setTimeout(() => setToast(""), 1600);
      return;
    }

    const newRange = parseSlotToMinutes(slot);
    if (!newRange) {
      setToast("Slot inválido. Revisa formato (ej. 09:00–10:30).");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    const clash = sessions.some((s) => {
      if (s.dayKey !== dayKey) return false;
      if (typeof s.slot !== "string") return false;

      const oldRange = parseSlotToMinutes(s.slot);
      if (!oldRange) return false;

      return overlaps(newRange, oldRange);
    });

    if (clash) {
      setToast("Choque de horario (traslape) ⚠️");
      setTimeout(() => setToast(""), 1600);
      return;
    }

    const s = {
      id: uid(),
      createdAt: new Date().toISOString(),
      dayKey,
      dayLabel: DAY_LABEL[dayKey] || dayKey,
      kind,
      slot,
      note: note.trim(),
      status: "scheduled",
    };

    const next = [s, ...sessions];
    saveAll(next);

    setToast("Sesión creada ✅");
    setTimeout(() => setToast(""), 1200);

    setNote("");
  }

  function onDelete(id) {
    const next = sessions.filter((x) => x.id !== id);
    saveAll(next);
  }

  function onResetAll() {
    if (!confirm("¿Borrar TODAS las sesiones?")) return;
    saveAll([]);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-semibold">OA6 — Sesiones (MVP)</div>
          <div className="text-sm text-slate-600">
            Fuente de slots: <span className="font-medium">OA9</span>{" "}
            · Sesiones guardadas: <span className="font-medium">{sessions.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-white border text-sm hover:bg-slate-50"
            onClick={refreshOA9}
          >
            Recargar OA9
          </button>

          <button
            className="px-3 py-2 rounded-lg bg-white border text-sm hover:bg-slate-50"
            onClick={onResetAll}
          >
            Reset sesiones
          </button>
        </div>
      </div>

      {toast ? (
        <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
          {toast}
        </div>
      ) : null}

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-semibold">Crear sesión</div>

        {!oa9Cfg ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
            No se encontró configuración OA9. Ve a <b>Horarios</b> (OA9), ajusta y presiona{" "}
            <b>Guardar</b>. Luego regresa aquí y presiona <b>Recargar OA9</b>.
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="space-y-1">
            <div className="text-sm text-slate-600">Tipo</div>
            <select
              className="w-full px-3 py-2 rounded-lg border bg-white"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setSlot("");
              }}
            >
              <option value="s90">90 min</option>
              <option value="s180">180 min</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm text-slate-600">Día</div>
            <select
              className="w-full px-3 py-2 rounded-lg border bg-white"
              value={dayKey}
              onChange={(e) => {
                setDayKey(e.target.value);
                setSlot("");
              }}
            >
              {DAY_OPTIONS.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-sm text-slate-600">Slot</div>
            <select
              className="w-full px-3 py-2 rounded-lg border bg-white"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              disabled={!oa9Cfg}
            >
              <option value="">— Selecciona —</option>
              {slotOptions.map((s, idx) => (
                <option key={`${dayKey}_${kind}_${idx}`} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-500">
              Si aquí no aparece nada: revisa que en OA9 ese día tenga bloques válidos y que hayas guardado.
            </div>
          </label>
        </div>

        <label className="space-y-1">
          <div className="text-sm text-slate-600">Nota (opcional)</div>
          <input
            className="w-full px-3 py-2 rounded-lg border"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Grupo A1.1 / Examen parcial / etc."
          />
        </label>

        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            onClick={onCreateSession}
            disabled={!oa9Cfg}
          >
            Crear sesión
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-semibold">Sesiones</div>

        {sessions.length === 0 ? (
          <div className="text-sm text-slate-500">Aún no hay sesiones. Crea la primera arriba.</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {s.dayLabel} · {s.kind === "s180" ? "180 min" : "90 min"} ·{" "}
                    <span className="font-semibold">{s.slot}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {s.note ? `Nota: ${s.note} · ` : ""}
                    Creada: {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                    {s.status || "draft"}
                  </span>
                  <button
                    className="text-sm px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    onClick={() => onDelete(s.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        <div className="font-semibold">Debug rápido (OA9 → slots)</div>
        <div className="text-xs text-slate-500">
          Si aquí ves arrays vacíos, el problema está en OA9 o en la generación de slots.
        </div>
        <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto">
          {JSON.stringify(
            {
              hasOA9: !!oa9Cfg,
              oa9Loaded: oa9Cfg,
              slotsByDay,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}