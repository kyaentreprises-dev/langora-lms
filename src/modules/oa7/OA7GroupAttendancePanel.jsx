import React, { useMemo, useState } from "react";
import { loadOA6GroupsDraft, loadOA6EnrollmentsDraft } from "../oa6/oa6Storage";
import { loadGroupAttendance, saveGroupAttendance } from "./oa7Storage";

const STATUS = [
  { id: "present", label: "Presente ✅" },
  { id: "absent", label: "Ausente ❌" },
  { id: "late", label: "Tarde ⏰" },
  { id: "justified", label: "Justificado ⚠️" },
];

export default function OA7GroupAttendancePanel() {
  const groups = useMemo(() => loadOA6GroupsDraft() || [], []);
  const enrollments = useMemo(() => loadOA6EnrollmentsDraft() || {}, []);
  const [attendance, setAttendance] = useState(() => loadGroupAttendance() || {});
  const [groupId, setGroupId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [toast, setToast] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === groupId) || null,
    [groups, groupId]
  );

  const students = useMemo(() => {
    if (!groupId) return [];
    return enrollments[groupId] || [];
  }, [groupId, enrollments]);

  const sessions = selectedGroup?.sessions || [];

  function setStudentStatus(studentId, status) {
    if (!groupId || !sessionId) return;

    const key = `${groupId}_${sessionId}`;
    const next = { ...attendance };

    if (!next[key]) next[key] = {};
    next[key][studentId] = status;

    setAttendance(next);
    saveGroupAttendance(next);

    setToast("Asistencia guardada ✅");
    setTimeout(() => setToast(""), 1200);
  }

  function getStatus(studentId) {
    const key = `${groupId}_${sessionId}`;
    return attendance?.[key]?.[studentId] || "";
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-semibold">OA7 — Asistencia por grupo</div>

      {toast ? (
        <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
          {toast}
        </div>
      ) : null}

      <div className="rounded-xl border p-4 space-y-3 bg-white">
        <div className="font-semibold">Seleccionar grupo</div>

        <select
          className="border rounded-lg px-3 py-2 w-full"
          value={groupId}
          onChange={(e) => {
            setGroupId(e.target.value);
            setSessionId("");
          }}
        >
          <option value="">Selecciona grupo</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.groupName} · {g.course}
            </option>
          ))}
        </select>

        {groupId && (
          <>
            <div className="font-semibold">Seleccionar sesión</div>

            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              <option value="">Selecciona sesión</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.dateLabel} — {s.slot}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {groupId && sessionId && (
        <div className="rounded-xl border p-4 space-y-3 bg-white">
          <div className="font-semibold">Lista de alumnos</div>

          {students.length === 0 ? (
            <div className="text-sm text-slate-500">
              No hay alumnos inscritos en este grupo.
            </div>
          ) : (
            students.map((s) => (
              <div key={s.id} className="border rounded-lg p-3 flex flex-col gap-2">
                <div className="font-medium">{s.name}</div>

                <div className="flex flex-wrap gap-2">
                  {STATUS.map((st) => {
                    const selected = getStatus(s.id) === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStudentStatus(s.id, st.id)}
                        className={`px-3 py-1 rounded-lg border ${
                          selected
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}