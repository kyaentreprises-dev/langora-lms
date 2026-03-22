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
    const draft = loadOA9Draft();
    if (draft && typeof draft === "object") return sanitizeOA9Config(draft);

    if (window.__OA9_RUNTIME__?.config) {
      return sanitizeOA9Config(window.__OA9_RUNTIME__.config);
    }

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
    setToast(cfg ? "OA9 recargado ✅" : "No se encontró OA9");
    setTimeout(() => setToast(""), 1600);
  }

  const slotsByDay = useMemo(() => {
    if (!oa9Cfg) return {};
    const raw = generateSlots(oa9Cfg) || {};
    const out = {};

    for (const [K, label] of DAY_OPTIONS) {
      const day = raw?.[K] || raw?.[K.toLowerCase()] || {};
      out[K] = {
        label,
        s90: (day.s90 || []).map(toHumanSlot),
        s180: (day.s180 || []).map(toHumanSlot),
      };
    }
    return out;
  }, [oa9Cfg]);

  const slotOptions = useMemo(() => {
    const day = slotsByDay?.[dayKey] || { s90: [], s180: [] };
    return kind === "s180" ? day.s180 : day.s90;
  }, [slotsByDay, dayKey, kind]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, progress };
  }, [sessions]);

  function saveAll(next) {
    setSessions(next);
    saveOA6SessionsDraft(next);
  }

  function onCreateSession() {
    if (!slot) return;

    const newRange = parseSlotToMinutes(slot);
    const clash = sessions.some((s) => {
      if (s.dayKey !== dayKey) return false;
      const oldRange = parseSlotToMinutes(s.slot);
      return oldRange && overlaps(newRange, oldRange);
    });

    if (clash) {
      setToast("Choque de horario ⚠️");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    const s = {
      id: uid(),
      createdAt: new Date().toISOString(),
      dayKey,
      dayLabel: DAY_LABEL[dayKey],
      kind,
      slot,
      note,
      status: "scheduled",
    };

    saveAll([s, ...sessions]);
    setNote("");
  }

  function onDelete(id) {
    saveAll(sessions.filter((x) => x.id !== id));
  }

  function markCompleted(id) {
    saveAll(
      sessions.map((s) =>
        s.id === id ? { ...s, status: "completed" } : s
      )
    );
  }

  function markScheduled(id) {
    saveAll(
      sessions.map((s) =>
        s.id === id ? { ...s, status: "scheduled" } : s
      )
    );
  }

  return (
    <div className="p-4 space-y-4">

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border">
          <div className="text-xs">Total</div>
          <div className="text-lg font-semibold">{stats.total}</div>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 border">
          <div className="text-xs">Completadas</div>
          <div>{stats.completed}</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border">
          <div className="text-xs">Pendientes</div>
          <div>{stats.pending}</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border">
          <div className="text-xs">% Progreso</div>
          <div>{stats.progress}%</div>
        </div>
      </div>

      {/* CREAR */}
      <div className="border p-4 rounded-xl space-y-3">
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="s90">90 min</option>
          <option value="s180">180 min</option>
        </select>

        <select value={dayKey} onChange={(e) => setDayKey(e.target.value)}>
          {DAY_OPTIONS.map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>

        <select value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="">Selecciona</option>
          {slotOptions.map((s, i) => (
            <option key={i}>{s}</option>
          ))}
        </select>

        <input value={note} onChange={(e) => setNote(e.target.value)} />

        <button onClick={onCreateSession}>Crear sesión</button>
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="border p-3 rounded-xl flex justify-between">

            <div>
              {s.dayLabel} · {s.slot}
              <div className="text-xs">{s.status}</div>
            </div>

            <div className="flex gap-2">
              {s.status !== "completed" ? (
                <button onClick={() => markCompleted(s.id)}>Completar</button>
              ) : (
                <button onClick={() => markScheduled(s.id)}>Reabrir</button>
              )}

              <button onClick={() => onDelete(s.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}