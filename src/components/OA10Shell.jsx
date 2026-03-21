import React from "react";

function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    red: "bg-rose-100 text-rose-700 border-rose-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    violet: "bg-violet-100 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        tones[tone] || tones.slate
      }`}
    >
      {children}
    </span>
  );
}

function Tabs({ tabs, activeId, onChange }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={
              "rounded-full px-4 py-2 text-sm font-medium border transition " +
              (active
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ActionButton({ variant = "primary", children, onClick }) {
  const map = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 border-slate-900",
    ghost: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    soft: "bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold border transition ${
        map[variant] || map.primary
      }`}
    >
      {children}
    </button>
  );
}

/**
 * OA10Shell (base)
 * - Renderiza header + acciones + tabs
 * - IMPORTANTE: ahora SIEMPRE pasa { activeTabId } a los handlers.
 */
export default function OA10Shell({
  title,
  subtitle,
  badge = "Base",
  breadcrumbs = [],
  actions = [],
  tabs = [],
  defaultTabId,
  children,
}) {
  const [activeTabId, setActiveTabId] = React.useState(
    defaultTabId || (tabs[0]?.id ?? "resumen")
  );

  const breadcrumbText = breadcrumbs?.length
    ? breadcrumbs.map((b) => b.label).join(" / ")
    : "";

  const handleAction = (a) => {
    const ctx = { activeTabId };

    // Si quieres, aquí podemos interceptar "save" en el futuro.
    // Por ahora: delegamos al handler que viene desde App.jsx
    if (typeof a?.onClick === "function") {
      return a.onClick(ctx);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {breadcrumbText ? (
          <div className="text-sm text-slate-500 mb-3">{breadcrumbText}</div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {title || "Langora LMS"}
                </h1>
                <Pill tone="slate">{badge}</Pill>
              </div>
              {subtitle ? (
                <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {(actions || []).map((a) => (
                <ActionButton
                  key={a.id}
                  variant={a.variant || "primary"}
                  onClick={() => handleAction(a)}
                >
                  {a.label}
                </ActionButton>
              ))}
            </div>
          </div>

          {tabs?.length ? (
            <Tabs tabs={tabs} activeId={activeTabId} onChange={setActiveTabId} />
          ) : null}
        </div>

        <div className="mt-6">
          {typeof children === "function"
            ? children({ activeTabId })
            : children}
        </div>
      </div>
    </div>
  );
}
