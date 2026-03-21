// src/modules/oa7/oa7Storage.js

const OA7_KEY = "langora:oa7";
const OA7_GROUP_ATT_KEY = "langora:oa7_group_att";

// ===== OA7 clásico =====
export function loadOA7Draft() {
  try {
    const raw = localStorage.getItem(OA7_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveOA7Draft(data) {
  try {
    localStorage.setItem(OA7_KEY, JSON.stringify(data || {}));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

// ===== OA7 asistencia por grupo =====
export function loadGroupAttendance() {
  try {
    const raw = localStorage.getItem(OA7_GROUP_ATT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveGroupAttendance(data) {
  try {
    localStorage.setItem(OA7_GROUP_ATT_KEY, JSON.stringify(data || {}));
    return true;
  } catch {
    return false;
  }
}
