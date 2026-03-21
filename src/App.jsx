import React, { useState } from "react";
import OA10Shell from "./components/OA10Shell";

// OA6
import OA6AcademicDashboard from "./modules/oa6/OA6AcademicDashboard.jsx";
import OA6GradesPanel from "./modules/oa6/OA6GradesPanel.jsx";
import OA6SessionsPanel from "./modules/oa6/OA6SessionsPanel.jsx";
import OA6GroupsPanel from "./modules/oa6/OA6GroupsPanel.jsx";
import OA6EnrollmentsPanel from "./modules/oa6/OA6EnrollmentsPanel.jsx";
import { exportOA6CSV } from "./modules/oa6/oa6Exports.js";
import { getOA6RuntimeSnapshot } from "./modules/oa6/oa6Runtime.js";
import { saveOA6Draft } from "./modules/oa6/oa6Storage.js";

// OA7
import OA7GroupAttendancePanel from "./modules/oa7/OA7GroupAttendancePanel.jsx";
import { getOA7RuntimeSnapshot } from "./modules/oa7/oa7Runtime.js";
import { saveOA7Draft } from "./modules/oa7/oa7Storage.js";
import { exportOA7CSV } from "./modules/oa7/oa7Exports.js";

/// OA9
import OA9SchedulePanel from "./modules/oa9/OA9SchedulePanel.jsx";

export default function App() {
  const [saveTick, setSaveTick] = useState(0);

  const actions = [
    {
      id: "save",
      label: "Guardar",
      variant: "primary",
      onClick: ({ activeTabId } = {}) => {
        if (activeTabId === "alumnos") {
          const snap = getOA6RuntimeSnapshot?.();
          if (!snap?.students?.length) {
            return alert("OA6: no hay datos para guardar.");
          }

          const res = saveOA6Draft({ students: snap.students, meta: snap.meta });
          if (!res?.ok) {
            return alert("Error guardando OA6: " + (res?.error || "desconocido"));
          }

          setSaveTick((x) => x + 1);
          return alert("✅ Guardado OA6");
        }

        if (activeTabId === "asistencias") {
          const snap = getOA7RuntimeSnapshot?.();
          if (!snap) {
            return alert("OA7: snapshot no disponible todavía.");
          }

          const res = saveOA7Draft(snap);
          if (!res?.ok) {
            return alert("Error guardando OA7: " + (res?.error || "desconocido"));
          }

          setSaveTick((x) => x + 1);
          return alert("✅ Guardado OA7");
        }

        return alert("Guardar: por ahora sólo OA6 y OA7.");
      },
    },
    {
      id: "export",
      label: "Exportar",
      variant: "ghost",
      onClick: ({ activeTabId } = {}) => {
        if (activeTabId === "alumnos") {
          try {
            exportOA6CSV("all");
          } catch (e) {
            alert("Error exportando OA6: " + String(e?.message || e));
          }
          return;
        }

        if (activeTabId === "asistencias") {
          try {
            let snap = getOA7RuntimeSnapshot?.();

            if (snap) {
              const res = saveOA7Draft(snap);
              if (!res?.ok) {
                alert("OA7: no se pudo persistir antes de exportar. " + (res?.error || ""));
              }
            }

            if (!snap) {
              try {
                const raw = localStorage.getItem("langora:oa7");
                if (raw) snap = JSON.parse(raw);
              } catch {
                // ignore
              }
            }

            if (!snap) {
              alert("Exportar OA7: no hay datos guardados aún.");
              return;
            }

            exportOA7CSV(snap);
          } catch (e) {
            alert("Error exportando OA7: " + String(e?.message || e));
          }
          return;
        }

        return alert("Exportar: por ahora sólo OA6 y OA7.");
      },
    },
    {
      id: "help",
      label: "Ayuda",
      variant: "soft",
      onClick: () =>
        alert(
          "OA10 Shell · OA6 Calificaciones · OA6 Sesiones · OA6 Grupos · OA6 Inscripciones · OA7 Asistencia por grupo · OA9 Horarios"
        ),
    },
  ];

  const tabs = [
  { id: "resumen", label: "Resumen" },
  { id: "alumnos", label: "Alumnos" },
  { id: "asistencias", label: "Asistencias" },
  { id: "config", label: "Config" },
  { id: "reportes", label: "Reportes" },
  { id: "horarios", label: "Horarios" },
  { id: "sesiones", label: "Sesiones" },
  { id: "grupos", label: "Grupos" },
  { id: "inscripciones", label: "Inscripciones" },
  { id: "dashboard", label: "Dashboard" },
];

  return (
    <OA10Shell
      title="Langora LMS"
      subtitle="OA10 — Shell base del sistema (acciones + tabs)"
      badge="Base"
      breadcrumbs={[{ label: "Inicio" }, { label: "Operaciones Académicas" }, { label: "OA10" }]}
      actions={actions}
      tabs={tabs}
      defaultTabId="resumen"
    >
      {({ activeTabId }) => {
        if (activeTabId === "resumen") {
          return (
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>✅ Shell listo</div>
              <div style={{ marginTop: 8, color: "#64748b" }}>
                - OA6: Exportar + Guardar conectados
                <br />
                - OA6 Sesiones: conectado a OA9
                <br />
                - OA6 Grupos: apertura y sesiones automáticas
                <br />
                - OA6 Inscripciones: alumnos por grupo
                <br />
                - OA7: asistencia por grupo y sesión
                <br />
                - OA9: horarios y generación de slots activa
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                Tip: prueba OA9 → Guardar → Grupos → Guardar grupo → Inscripciones → Asistencias.
              </div>
            </div>
          );
        }

        if (activeTabId === "alumnos") {
          return <OA6GradesPanel saveTick={saveTick} />;
        }

        if (activeTabId === "asistencias") {
          return <OA7GroupAttendancePanel />;
        }

        if (activeTabId === "horarios") {
          return <OA9SchedulePanel saveTick={saveTick} />;
        }

        if (activeTabId === "sesiones") {
          return <OA6SessionsPanel />;
        }

        if (activeTabId === "grupos") {
          return <OA6GroupsPanel />;
        }

        if (activeTabId === "inscripciones") {
          return <OA6EnrollmentsPanel />;
        }

        if (activeTabId === "dashboard") {
        return <OA6AcademicDashboard />;
        }

        if (activeTabId === "reportes") {
          return (
            <div className="p-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-lg font-semibold">Reportes</div>
                <div className="text-sm text-slate-600 mt-1">
                  Próximamente: reportes de asistencia, avance, calificaciones, ingresos, etc.
                </div>
              </div>
            </div>
          );
        }

        if (activeTabId === "config") {
          return <div style={{ padding: 14, color: "#64748b" }}>Config (próximo).</div>;
        }

        return null;
      }}
    </OA10Shell>
  );
  
}
