import React, { useMemo, useState } from "react";

const alumnosRiesgoMock = [
  {
    id: "stu-3",
    nombre: "Ana Rodríguez",
    matricula: "A003",
    curso: "Inglés A1 – Grupo 1",
    periodo: "Ene–Mar 2025",
    asistencia: 70,
    tareasCriticasTotal: 3,
    tareasCriticasNoEntregadas: 2,
    tareasCriticasTarde: 1,
    examenesTotales: 2,
    examenesNoPresentados: 1,
    promedioOA6: 6.4,
    nivelRiesgo: "ALTO",
    riesgoScore: 88,
    senales: [
      "Faltó a 1 examen parcial",
      "2 tareas críticas sin entregar",
      "Asistencia por debajo del 80%",
    ],
  },
  {
    id: "stu-2",
    nombre: "María López",
    matricula: "A002",
    curso: "Inglés A1 – Grupo 1",
    periodo: "Ene–Mar 2025",
    asistencia: 88,
    tareasCriticasTotal: 3,
    tareasCriticasNoEntregadas: 0,
    tareasCriticasTarde: 1,
    examenesTotales: 2,
    examenesNoPresentados: 0,
    promedioOA6: 8.3,
    nivelRiesgo: "MEDIO",
    riesgoScore: 56,
    senales: [
      "1 tarea crítica entregada tarde",
      "Promedio ligeramente por debajo de la media del grupo",
    ],
  },
  {
    id: "stu-4",
    nombre: "Sofía Martínez",
    matricula: "A004",
    curso: "Inglés A1 – Grupo 1",
    periodo: "Ene–Mar 2025",
    asistencia: 82,
    tareasCriticasTotal: 3,
    tareasCriticasNoEntregadas: 1,
    tareasCriticasTarde: 0,
    examenesTotales: 2,
    examenesNoPresentados: 0,
    promedioOA6: 7.2,
    nivelRiesgo: "MEDIO",
    riesgoScore: 49,
    senales: ["1 tarea crítica sin entregar"],
  },
  {
    id: "stu-1",
    nombre: "Juan Pérez",
    matricula: "A001",
    curso: "Inglés A1 – Grupo 1",
    periodo: "Ene–Mar 2025",
    asistencia: 95,
    tareasCriticasTotal: 3,
    tareasCriticasNoEntregadas: 0,
    tareasCriticasTarde: 0,
    examenesTotales: 2,
    examenesNoPresentados: 0,
    promedioOA6: 9.1,
    nivelRiesgo: "BAJO",
    riesgoScore: 18,
    senales: ["En regla en tareas críticas", "Buena asistencia"],
  },
];

function badgeRiesgoStyles(nivel) {
  switch (nivel) {
    case "ALTO":
      return "border-red-500/70 bg-red-500/10 text-red-300";
    case "MEDIO":
      return "border-amber-500/70 bg-amber-500/10 text-amber-300";
    default:
      return "border-emerald-500/70 bg-emerald-500/10 text-emerald-300";
  }
}

function nivelToLabel(n) {
  if (n === "ALTO") return "Alto";
  if (n === "MEDIO") return "Medio";
  return "Bajo";
}

export default function OA9PanelGrupo() {
  const [nivelFiltro, setNivelFiltro] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");

  const alumnosOrdenados = useMemo(() => {
    return [...alumnosRiesgoMock].sort((a, b) => b.riesgoScore - a.riesgoScore);
  }, []);

  const alumnosFiltrados = useMemo(() => {
    return alumnosOrdenados.filter((a) => {
      if (nivelFiltro !== "TODOS" && a.nivelRiesgo !== nivelFiltro) return false;
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        const hay =
          a.nombre.toLowerCase().includes(q) ||
          a.matricula.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  }, [alumnosOrdenados, nivelFiltro, busqueda]);

  const total = alumnosRiesgoMock.length;
  const totalAlto = alumnosRiesgoMock.filter((a) => a.nivelRiesgo === "ALTO").length;
  const totalMedio = alumnosRiesgoMock.filter((a) => a.nivelRiesgo === "MEDIO").length;
  const totalBajo = alumnosRiesgoMock.filter((a) => a.nivelRiesgo === "BAJO").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col gap-4">
      <header className="space-y-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide">OA9 · Riesgo académico</p>
        <h1 className="text-xl md:text-2xl font-semibold text-emerald-400">
          Panel de riesgo – Inglés A1 · Grupo 1
        </h1>
        <p className="text-[11px] text-slate-400 max-w-xl">
          Radar de alumnos en riesgo (mock). Combina asistencia, tareas críticas (OA7) y evaluaciones (OA6).
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-slate-400">Alumnos</p>
          <p className="text-2xl font-semibold text-slate-50">{total}</p>
        </div>
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3">
          <p className="text-slate-200">Riesgo alto</p>
          <p className="text-2xl font-semibold text-red-300">{totalAlto}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-slate-200">Riesgo medio</p>
          <p className="text-2xl font-semibold text-amber-300">{totalMedio}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3">
          <p className="text-slate-200">Riesgo bajo</p>
          <p className="text-2xl font-semibold text-emerald-300">{totalBajo}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 md:p-4 text-[11px] space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Nivel</p>
            <select
              className="rounded-xl bg-slate-950 border border-slate-700 px-2 py-1.5"
              value={nivelFiltro}
              onChange={(e) => setNivelFiltro(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="ALTO">Solo alto</option>
              <option value="MEDIO">Solo medio</option>
              <option value="BAJO">Solo bajo</option>
            </select>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 mb-1">Buscar</p>
            <input
              className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-[11px]"
              placeholder="Nombre o matrícula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="flex-1">
        {!alumnosFiltrados.length ? (
          <div className="mt-2 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-4 text-[11px] text-slate-400">
            Sin resultados.
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {alumnosFiltrados.map((a, idx) => (
              <article
                key={a.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[11px] flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                      <h2 className="text-[12px] font-semibold text-slate-50">{a.nombre}</h2>
                    </div>
                    <p className="text-[10px] text-slate-400">Matrícula {a.matricula}</p>
                    <p className="text-[10px] text-slate-500">
                      Promedio OA6:{" "}
                      <span className="font-semibold text-slate-200">{a.promedioOA6.toFixed(1)} / 10</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full border text-[10px] ${badgeRiesgoStyles(a.nivelRiesgo)}`}>
                      Riesgo {nivelToLabel(a.nivelRiesgo)}
                    </span>
                    <p className="text-[10px] text-slate-500">Score OA9: {a.riesgoScore}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-300">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2">
                    <p className="text-slate-400">Asistencia</p>
                    <p className="text-sm font-semibold">{a.asistencia}%</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2">
                    <p className="text-slate-400">Tareas críticas</p>
                    <p>
                      {a.tareasCriticasTotal - a.tareasCriticasNoEntregadas} / {a.tareasCriticasTotal} entregadas
                    </p>
                    {a.tareasCriticasNoEntregadas > 0 && (
                      <p className="text-[10px] text-red-300">{a.tareasCriticasNoEntregadas} sin entregar</p>
                    )}
                    {a.tareasCriticasTarde > 0 && (
                      <p className="text-[10px] text-amber-300">{a.tareasCriticasTarde} tarde</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2">
                    <p className="text-slate-400">Exámenes</p>
                    <p>
                      {a.examenesTotales - a.examenesNoPresentados} / {a.examenesTotales} presentados
                    </p>
                    {a.examenesNoPresentados > 0 && (
                      <p className="text-[10px] text-red-300">{a.examenesNoPresentados} sin presentar</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2">
                    <p className="text-slate-400">Acción sugerida</p>
                    <p className="text-[10px] text-slate-300">
                      {a.nivelRiesgo === "ALTO"
                        ? "Contactar y agendar 1:1."
                        : a.nivelRiesgo === "MEDIO"
                        ? "Revisar tareas/exámenes."
                        : "Seguimiento regular."}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400">Señales</p>
                  <ul className="list-disc pl-4 text-[10px] text-slate-300 space-y-0.5">
                    {a.senales.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
