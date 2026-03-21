// src/modules/oa6/oa6Storage.js

const OA6_LOCAL_KEY = "langora:oa6";
const OA6_LOCAL_KEY_LEGACY = "langora_oa6";

const OA6_SESSIONS_KEY = "langora:oa6_sessions";
const OA6_SESSIONS_KEY_LEGACY = "langora_oa6_sessions";

const OA6_GROUPS_KEY = "langora:oa6_groups";
const OA6_GROUPS_KEY_LEGACY = "langora_oa6_groups";

const OA6_ENROLLMENTS_KEY = "langora:oa6_enrollments";
const OA6_ENROLLMENTS_KEY_LEGACY = "langora_oa6_enrollments";

function safeParse(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readFirstAvailable(keys, fallback) {
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    const parsed = safeParse(raw, fallback);

    if (parsed !== fallback) {
      return { key, value: parsed };
    }

    if (raw) {
      return { key, value: parsed };
    }
  }

  return { key: null, value: fallback };
}

function writeBoth(primaryKey, legacyKey, value) {
  const serialized = JSON.stringify(value);
  localStorage.setItem(primaryKey, serialized);
  localStorage.setItem(legacyKey, serialized);
}

// ===== OA6 Draft =====
export function loadOA6Draft() {
  try {
    const { value } = readFirstAvailable(
      [OA6_LOCAL_KEY, OA6_LOCAL_KEY_LEGACY],
      null
    );

    if (!value || typeof value !== "object") return null;

    return value;
  } catch (e) {
    console.warn("OA6: no se pudo cargar draft", e);
    return null;
  }
}

export function saveOA6Draft(payload) {
  try {
    writeBoth(OA6_LOCAL_KEY, OA6_LOCAL_KEY_LEGACY, payload || {});
    return true;
  } catch (e) {
    console.warn("OA6: no se pudo guardar draft", e);
    return false;
  }
}

export function clearOA6Draft() {
  try {
    localStorage.removeItem(OA6_LOCAL_KEY);
    localStorage.removeItem(OA6_LOCAL_KEY_LEGACY);
    return true;
  } catch (e) {
    console.warn("OA6: no se pudo borrar draft", e);
    return false;
  }
}

// ===== OA6 Sessions =====
export function loadOA6SessionsDraft() {
  try {
    const { value } = readFirstAvailable(
      [OA6_SESSIONS_KEY, OA6_SESSIONS_KEY_LEGACY],
      []
    );

    if (Array.isArray(value)) return value;
    return [];
  } catch {
    return [];
  }
}

export function saveOA6SessionsDraft(sessions) {
  try {
    writeBoth(
      OA6_SESSIONS_KEY,
      OA6_SESSIONS_KEY_LEGACY,
      Array.isArray(sessions) ? sessions : []
    );
    return true;
  } catch {
    return false;
  }
}

// ===== OA6 Groups =====
export function loadOA6GroupsDraft() {
  try {
    const { value } = readFirstAvailable(
      [OA6_GROUPS_KEY, OA6_GROUPS_KEY_LEGACY],
      []
    );

    if (Array.isArray(value)) return value;

    if (value && Array.isArray(value.items)) return value.items;

    return [];
  } catch {
    return [];
  }
}

export function saveOA6GroupsDraft(groups) {
  try {
    const normalized = Array.isArray(groups) ? groups : [];
    writeBoth(OA6_GROUPS_KEY, OA6_GROUPS_KEY_LEGACY, normalized);
    return true;
  } catch {
    return false;
  }
}

// ===== OA6 Group Enrollments =====
export function loadOA6EnrollmentsDraft() {
  try {
    const { value } = readFirstAvailable(
      [OA6_ENROLLMENTS_KEY, OA6_ENROLLMENTS_KEY_LEGACY],
      {}
    );

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }

    return {};
  } catch {
    return {};
  }
}

export function saveOA6EnrollmentsDraft(enrollments) {
  try {
    const normalized =
      enrollments && typeof enrollments === "object" && !Array.isArray(enrollments)
        ? enrollments
        : {};

    writeBoth(OA6_ENROLLMENTS_KEY, OA6_ENROLLMENTS_KEY_LEGACY, normalized);
    return true;
  } catch {
    return false;
  }
}