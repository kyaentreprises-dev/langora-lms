import React, { useMemo, useState } from "react";
import { loadOA6GroupsDraft, loadOA6EnrollmentsDraft } from "../oa6/oa6Storage";
import { loadGroupAttendance } from "../oa7/oa7Storage";

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase().trim();

  if (value === "present" || value === "presente" || value === "p") return "present";
  if (value === "late" || value === "tarde" || value === "l") return "late";
  if (value === "justified" || value === "justificado" || value === "j") return "justified";
  if (value === "absent" || value === "ausente" || value === "a") return "absent";

  return value;
}

function getPctTone(pct) {
  if (pct >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (pct >= 80) return "text-sky-700 bg-sky-50 border-sky-200";
  if (pct >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

function getRiskLabel(pct) {
  if (pct >= 90) return "Excelente";
  if (pct >= 80) return "Bien";
  if (pct >= 60) return "Atención";
  return "En riesgo";
}

function StatCard({ title, value, helper, tone = "slate" }) {
  const toneMap = {
    slate: "border-slate-200 bg-white text-slate-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneMap[tone]}`}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {helper && <div className="mt-2 text-xs opacity-75">{helper}</div>}
    </div>
  );
}

/* 🔥 ALERTAS */
function AlertBox({ tone = "slate", title, children }) {
  const toneMap = {
    slate: "border-slate-200 bg-slate-50 text-slate-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneMap[tone]}`}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function buildDashboardAlerts({ stats, selectedGroup }) {
  if (!selectedGroup || !stats) return [];

  const alerts = [];

  if (stats.totalStudents === 0) {
    alerts.push({
      id: "no-students",
      tone: "amber",
      title: "⚠️ Grupo sin alumnos",
      message: "Aún no hay alumnos inscritos.",
    });
  }

  if (stats.totalSessions === 0) {
    alerts.push({
      id: "no-sessions",
      tone: "amber",
      title: "⚠️ Sin sesiones",
      message: "Este grupo no tiene sesiones definidas.",
    });
  }

  if (stats.coveredSessions === 0 && stats.totalSessions > 0) {
    alerts.push({
      id: "no-attendance",
      tone: "blue",
      title: "📌 Sin asistencia",
      message: "Aún no se ha capturado asistencia.",
    });
  }

  if (stats.coveredSessions < stats.totalSessions) {
    alerts.push({
      id: "missing",
      tone: "amber",
      title: "📌 Faltan sesiones",
      message: `${stats.totalSessions - stats.coveredSessions} sesiones sin capturar.`,
    });
  }

  if (stats.avg < 80 && stats.avg > 0) {
    alerts.push({
      id: "low",
      tone: "rose",
      title: "🚨 Asistencia baja",
      message: `Promedio actual: ${stats.avg}%`,
    });
  }

  if (stats.atRisk.length > 0) {
    alerts.push({
      id: "risk",
      tone: "rose",
      title: "🚨 Alumnos en riesgo",
      message: `${stats.atRisk.length} alumno(s) en riesgo.`,
    });
  }

  if (
    stats.totalStudents > 0 &&
    stats.avg >= 80 &&
    stats.atRisk.length === 0 &&
    stats.coveredSessions > 0
  ) {
    alerts.push({
      id: "ok",
      tone: "green",
      title: "✅ Grupo sano",
      message: "Todo en orden académico.",
    });
  }

  return alerts;
}

export default function OA6AcademicDashboard() {
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const groups = useMemo(() => loadOA6GroupsDraft() || [], []);
  const enrollmentsByGroup = useMemo(() => loadOA6EnrollmentsDraft() || {}, []);
  const attendance = useMemo(() => loadGroupAttendance() || {}, []);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const students = useMemo(() => {
    return enrollmentsByGroup[selectedGroupId] || [];
  }, [selectedGroupId, enrollmentsByGroup]);

  const sessions = useMemo(() => {
    return selectedGroup?.sessions || [];
  }, [selectedGroup]);

  const stats = useMemo(() => {
    if (!selectedGroupId) return null;

    let totalAttendanceMarks = 0;
    let totalPresentMarks = 0;

    const studentRows = students.map((student) => {
      let presents = 0;
      let taken = 0;

      sessions.forEach((session) => {
        const key = `${selectedGroupId}_${session.id}`;
        const raw = attendance?.[key]?.[student.id];
        if (!raw) return;

        const status = normalizeStatus(raw);
        taken++;

        if (["present", "late", "justified"].includes(status)) {
          presents++;
          totalPresentMarks++;
        }

        totalAttendanceMarks++;
      });

      const pct = taken ? Math.round((presents / taken) * 100) : 0;

      return {
        id: student.id,
        name: student.name,
        presents,
        taken,
        pct,
      };
    });

    const avg =
      studentRows.length > 0
        ? Math.round(studentRows.reduce((a, b) => a + b.pct, 0) / studentRows.length)
        : 0;

    const coveredSessions = sessions.filter((s) => {
      const key = `${selectedGroupId}_${s.id}`;
      return attendance?.[key];
    }).length;

    return {
      totalStudents: students.length,
      totalSessions: sessions.length,
      coveredSessions,
      avg,
      atRisk: studentRows.filter((s) => s.pct < 80 && s.taken > 0),
      students: studentRows,
    };
  }, [students, sessions, attendance, selectedGroupId]);

  const alerts = useMemo(() => {
    return buildDashboardAlerts({ stats, selectedGroup });
  }, [stats, selectedGroup]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">📊 Dashboard Académico</h2>

      <select
        className="border rounded-lg px-3 py-2 w-full"
        value={selectedGroupId}
        onChange={(e) => setSelectedGroupId(e.target.value)}
      >
        <option value="">Selecciona grupo</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.groupName} · {g.course}
          </option>
        ))}
      </select>

      {alerts.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {alerts.map((a) => (
            <AlertBox key={a.id} tone={a.tone} title={a.title}>
              {a.message}
            </AlertBox>
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="grid md:grid-cols-4 gap-3">
            <StatCard title="Alumnos" value={stats.totalStudents} />
            <StatCard title="Sesiones" value={stats.totalSessions} />
            <StatCard title="Capturadas" value={stats.coveredSessions} />
            <StatCard title="Promedio" value={`${stats.avg}%`} />
          </div>
        </>
      )}
    </div>
  );
}