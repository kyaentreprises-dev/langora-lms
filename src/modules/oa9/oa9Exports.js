// src/modules/oa9/oa9Exports.js
import { dayLabel } from "./oa9Engine";

function downloadText(filename, text, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function esc(x) {
  const s = String(x ?? "");
  const needs = /[",\n]/.test(s);
  const safe = s.replace(/"/g, '""');
  return needs ? `"${safe}"` : safe;
}

export function exportOA9GroupsCSV(groups, filenameBase = "OA9_grupos") {
  const rows = Array.isArray(groups) ? groups : [];
  const header = [
    "id","courseId","courseLabel","groupLabel","programId","programLabel",
    "weeks","sessionsPerWeek","sessionMinutes","totalHours",
    "days","times","teacherName","roomOrLink","updatedAt"
  ];

  const lines = [header.join(",")];

  for (const g of rows) {
    const days = (g.days || []).map(dayLabel).join(" ");
    const times = (g.days || []).map((d) => `${dayLabel(d)} ${g.startHMByDay?.[d] || "—"}`).join(" | ");

    lines.push([
      esc(g.id),
      esc(g.courseId),
      esc(g.courseLabel),
      esc(g.groupLabel),
      esc(g.programId),
      esc(g.programLabel),
      esc(g.weeks),
      esc(g.sessionsPerWeek),
      esc(g.sessionMinutes),
      esc(g.totalHours),
      esc(days),
      esc(times),
      esc(g.teacherName),
      esc(g.roomOrLink),
      esc(new Date(g.updatedAt || Date.now()).toISOString()),
    ].join(","));
  }

  downloadText(`${filenameBase}.csv`, lines.join("\n"));
}
