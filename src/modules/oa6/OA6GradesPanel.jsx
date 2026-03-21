import React from "react";

export default function OA6GradesPanel() {
  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-semibold">OA6 — Calificaciones</div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold">Panel temporal de recuperación</div>
        <div className="text-sm text-slate-600 mt-2">
          Este módulo se restauró temporalmente para que Langora vuelva a arrancar.
        </div>
        <div className="text-sm text-slate-600 mt-1">
          El panel completo de calificaciones lo recuperamos después desde historial o lo reconstruimos.
        </div>
      </div>
    </div>
  );
}