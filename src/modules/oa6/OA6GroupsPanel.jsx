import React, { useMemo, useState } from "react";
import { loadOA9Draft } from "../oa9/oa9Storage";
import { generateSlots } from "../oa9/oa9Engine";
import { loadOA6GroupsDraft, saveOA6GroupsDraft } from "./oa6Storage";

const COURSES = [
  "Alemán A1.1",
  "Alemán A1.2",
  "Alemán A2.1",
  "Inglés A1",
  "Inglés A2",
  "Español B1",
];

const DAYS = [
  ["Mon", "Lunes"],
  ["Tue", "Martes"],
  ["Wed", "Miércoles"],
  ["Thu", "Jueves"],
  ["Fri", "Viernes"],
  ["Sat", "Sábado"],
];

const DAY_LABEL = {
  Mon: "Lunes",
  Tue: "Martes",
  Wed: "Miércoles",
  Thu: "Jueves",
  Fri: "Viernes",
  Sat: "Sábado",
};

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

function uid(prefix = "grp") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function generateSessions({ days, slot, start, end }) {
  const sessions = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  const dayMap = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const jsDay = d.getDay();

    for (const dk of days) {
      if (jsDay === dayMap[dk]) {
        sessions.push({
          id: uid("sess"),
          dateISO: new Date(d).toISOString(),
          dateLabel: new Date(d).toLocaleDateString(),
          dayKey: dk,
          dayLabel: DAY_LABEL[dk] || dk,
          slot,
          status: "scheduled",
        });
      }
    }
  }

  return sessions;
}

export default function OA6GroupsPanel() {
  const oa9 = useMemo(() => loadOA9Draft(), []);
  const [groups, setGroups] = useState(() => loadOA6GroupsDraft() || []);

  const slotsByDay = useMemo(() => {
    if (!oa9) return {};

    const raw = generateSlots(oa9) || {};
    const out = {};

    for (const [k] of DAYS) {
      const lower = k.toLowerCase();
      const day = raw?.[k] || raw?.[lower] || {};
      out[k] = {
        s90: (day.s90 || []).map(toHumanSlot),
        s180: (day.s180 || []).map(toHumanSlot),
      };
    }

    return out;
  }, [oa9]);

  const [course, setCourse] = useState("");
  const [group, setGroup] = useState("");
  const [days, setDays] = useState([]);
  const [kind, setKind] = useState("s90");
  const [slot, setSlot] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [sessionsPreview, setSessionsPreview] = useState([]);
  const [toast, setToast] = useState("");

  function toggleDay(dayKey) {
    setDays((prev) => {
      const exists = prev.includes(dayKey);
      const next = exists ? prev.filter((x) => x !== dayKey) : [...prev, dayKey];
      return next;
    });
    setSlot("");
    setSessionsPreview([]);
  }

  const availableSlots = useMemo(() => {
    if (!days.length) return [];

    const all = [];
    for (const d of days) {
      const list = slotsByDay?.[d]?.[kind] || [];
      all.push(...list);
    }

    const unique = [...new Set(all)];

    function toMinutes(slotStr) {
      if (!slotStr || typeof slotStr !== "string") return 99999;
      const cleaned = slotStr.replace("–", "-").trim();
      const [startPart] = cleaned.split("-");
      if (!startPart) return 99999;

      const [hh, mm] = startPart.trim().split(":").map((n) => parseInt(n, 10));
      if (Number.isNaN(hh) || Number.isNaN(mm)) return 99999;

      return hh * 60 + mm;
    }

    return unique.sort((a, b) => toMinutes(a) - toMinutes(b));
  }, [days, kind, slotsByDay]);

  function createGroupPreview() {
    if (!course) {
      setToast("Elige un curso.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!days.length) {
      setToast("Elige al menos un día.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!slot) {
      setToast("Selecciona un horario.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!start || !end) {
      setToast("Selecciona fecha de inicio y fin.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    const list = generateSessions({ days, slot, start, end });
    setSessionsPreview(list);

    setToast("Sesiones generadas ✅");
    setTimeout(() => setToast(""), 1500);
  }

  function saveGroup() {
    if (!course) {
      setToast("Elige un curso.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!group.trim()) {
      setToast("Escribe un nombre de grupo.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!days.length) {
      setToast("Elige al menos un día.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!slot) {
      setToast("Selecciona un horario.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!start || !end) {
      setToast("Selecciona fecha de inicio y fin.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    const sessions =
      sessionsPreview.length > 0
        ? sessionsPreview
        : generateSessions({ days, slot, start, end });

    const exists = groups.some(
      (g) => g.groupName.trim().toLowerCase() === group.trim().toLowerCase()
    );

    if (exists) {
      setToast("Ya existe un grupo con ese nombre ⚠️");
      setTimeout(() => setToast(""), 1800);
      return;
    }

    const newGroup = {
      id: uid("group"),
      createdAt: new Date().toISOString(),
      course,
      groupName: group.trim(),
      kind,
      days,
      daysLabel: days.map((d) => DAY_LABEL[d] || d),
      slot,
      startDate: start,
      endDate: end,
      sessions,
      sessionsCount: sessions.length,
      status: "draft",
    };

    const next = [newGroup, ...groups];
    setGroups(next);
    saveOA6GroupsDraft(next);

    setToast("Grupo guardado ✅");
    setTimeout(() => setToast(""), 1500);

    setCourse("");
    setGroup("");
    setDays([]);
    setKind("s90");
    setSlot("");
    setStart("");
    setEnd("");
    setSessionsPreview([]);
  }

  function deleteGroup(id) {
    const next = groups.filter((g) => g.id !== id);
    setGroups(next);
    saveOA6GroupsDraft(next);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-semibold">OA6 — Apertura de Grupo</div>

      {toast ? (
        <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
          {toast}
        </div>
      ) : null}

      {!oa9 ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          No se encontró OA9. Ve a <b>Horarios</b>, guarda la configuración y vuelve aquí.
        </div>
      ) : null}

      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="font-semibold">Datos del grupo</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option value="">Curso</option>
            {COURSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Nombre del grupo (ej. A1.2-LM)"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          />
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Días del curso</div>

          <div className="flex gap-2 flex-wrap">
            {DAYS.map(([k, l]) => {
              const selected = days.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleDay(k)}
                  className={`px-4 py-2 border rounded-lg font-medium transition ${
                    selected
                      ? "bg-slate-900 text-white border-slate-900 shadow"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {selected ? `✓ ${l}` : l}
                </button>
              );
            })}
          </div>

          {!days.length ? (
            <div className="text-xs text-slate-500 mt-2">
              Primero elige uno o más días para que aparezcan los horarios disponibles.
            </div>
          ) : (
            <div className="text-xs text-emerald-700 mt-2">
              Días elegidos: {days.map((d) => DAY_LABEL[d]).join(" / ")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <div className="text-sm font-medium">Tipo de sesión</div>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setSlot("");
                setSessionsPreview([]);
              }}
            >
              <option value="s90">90 min</option>
              <option value="s180">180 min</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Horario</div>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              disabled={!days.length}
            >
              <option value="">
                {!days.length ? "Primero elige días" : "Selecciona slot"}
              </option>
              {availableSlots.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="text-xs text-slate-500">
          Los horarios salen automáticamente de OA9 según los días elegidos y el tipo de sesión.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <div className="text-sm font-medium">Fecha inicio</div>
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Fecha fin</div>
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createGroupPreview}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            Generar sesiones
          </button>

          <button
            type="button"
            onClick={saveGroup}
            className="px-4 py-2 bg-white border rounded-lg"
          >
            Guardar grupo
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-2">
        <div className="font-semibold">Sesiones generadas</div>

        {sessionsPreview.length === 0 ? (
          <div className="text-sm text-slate-500">Aún no hay sesiones generadas.</div>
        ) : (
          <div className="space-y-1">
            {sessionsPreview.map((s) => (
              <div key={s.id} className="text-sm rounded border px-3 py-2 bg-white">
                {s.dateLabel} — {s.slot}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-semibold">Grupos creados</div>

        {groups.length === 0 ? (
          <div className="text-sm text-slate-500">Aún no hay grupos guardados.</div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.id} className="rounded-xl border p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800">
                      {g.groupName} · {g.course}
                    </div>
                    <div className="text-sm text-slate-600">
                      {g.daysLabel.join(" / ")} · {g.kind === "s180" ? "180 min" : "90 min"} · {g.slot}
                    </div>
                    <div className="text-xs text-slate-500">
                      {g.startDate} → {g.endDate} · Sesiones: {g.sessionsCount}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteGroup(g.id)}
                    className="text-sm px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  >
                    Eliminar
                  </button>
                </div>

                {Array.isArray(g.sessions) && g.sessions.length > 0 ? (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-slate-700">
                      Ver sesiones ({g.sessions.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {g.sessions.map((s) => (
                        <div key={s.id} className="rounded border px-2 py-1 bg-slate-50">
                          {s.dateLabel} — {s.slot}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}