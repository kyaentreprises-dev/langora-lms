import React, { useMemo, useState } from "react";
import {
  loadOA6GroupsDraft,
  loadOA6EnrollmentsDraft,
  saveOA6EnrollmentsDraft,
} from "./oa6Storage";

function uid(prefix = "stu") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function OA6EnrollmentsPanel() {
  const groups = useMemo(() => loadOA6GroupsDraft() || [], []);
  const [enrollments, setEnrollments] = useState(() => loadOA6EnrollmentsDraft() || {});
  const [groupId, setGroupId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [toast, setToast] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === groupId) || null,
    [groups, groupId]
  );

  const currentStudents = useMemo(() => {
    if (!groupId) return [];
    return enrollments[groupId] || [];
  }, [enrollments, groupId]);

  function saveAll(next) {
    setEnrollments(next);
    saveOA6EnrollmentsDraft(next);
  }

  function addStudent() {
    if (!groupId) {
      setToast("Primero elige un grupo.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!studentName.trim()) {
      setToast("Escribe el nombre del alumno.");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    const next = { ...enrollments };
    const list = Array.isArray(next[groupId]) ? [...next[groupId]] : [];

    const exists = list.some(
      (s) =>
        s.name.trim().toLowerCase() === studentName.trim().toLowerCase() ||
        (studentCode.trim() &&
          s.code?.trim().toLowerCase() === studentCode.trim().toLowerCase())
    );

    if (exists) {
      setToast("Ese alumno ya está inscrito en el grupo ⚠️");
      setTimeout(() => setToast(""), 1700);
      return;
    }

    list.push({
      id: uid(),
      name: studentName.trim(),
      code: studentCode.trim(),
      email: studentEmail.trim(),
      phone: studentPhone.trim(),
      enrolledAt: new Date().toISOString(),
      status: "active",
    });

    next[groupId] = list;
    saveAll(next);

    setStudentName("");
    setStudentCode("");
    setStudentEmail("");
    setStudentPhone("");

    setToast("Alumno inscrito ✅");
    setTimeout(() => setToast(""), 1500);
  }

  function removeStudent(studentId) {
    if (!groupId) return;

    const next = { ...enrollments };
    const list = Array.isArray(next[groupId]) ? [...next[groupId]] : [];
    next[groupId] = list.filter((s) => s.id !== studentId);
    saveAll(next);

    setToast("Alumno eliminado.");
    setTimeout(() => setToast(""), 1200);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-semibold">OA6 — Inscripción de alumnos</div>

      {toast ? (
        <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
          {toast}
        </div>
      ) : null}

      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="font-semibold">Seleccionar grupo</div>

        {groups.length === 0 ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
            No hay grupos guardados todavía. Ve primero a <b>Grupos</b> y crea uno.
          </div>
        ) : (
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">Selecciona un grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.groupName} · {g.course}
              </option>
            ))}
          </select>
        )}

        {selectedGroup ? (
          <div className="text-sm text-slate-600 rounded-lg bg-slate-50 border p-3">
            <div>
              <b>Grupo:</b> {selectedGroup.groupName}
            </div>
            <div>
              <b>Curso:</b> {selectedGroup.course}
            </div>
            <div>
              <b>Días:</b> {selectedGroup.daysLabel?.join(" / ")}
            </div>
            <div>
              <b>Horario:</b> {selectedGroup.slot}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="font-semibold">Inscribir alumno</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Nombre completo"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />

          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Matrícula / ID"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
          />

          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Correo (opcional)"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          />

          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Teléfono / WhatsApp (opcional)"
            value={studentPhone}
            onChange={(e) => setStudentPhone(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={addStudent}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg"
        >
          Inscribir alumno
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-semibold">Alumnos inscritos</div>

        {!groupId ? (
          <div className="text-sm text-slate-500">
            Selecciona un grupo para ver y administrar sus alumnos.
          </div>
        ) : currentStudents.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aún no hay alumnos inscritos en este grupo.
          </div>
        ) : (
          <div className="space-y-2">
            {currentStudents.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="font-medium text-slate-800">{s.name}</div>
                  <div className="text-sm text-slate-600">
                    {s.code ? `Matrícula: ${s.code}` : "Sin matrícula"}
                    {s.email ? ` · ${s.email}` : ""}
                    {s.phone ? ` · ${s.phone}` : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeStudent(s.id)}
                  className="text-sm px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}