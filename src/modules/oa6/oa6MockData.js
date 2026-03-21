export const OA6_COURSES = [
  {
    id: "C-ENG-A1",
    name: "Inglés A1",
    evaluationTypes: [
      { type: "unit", label: "Unidades", weight: 0.55 },
      { type: "exam", label: "Exámenes", weight: 0.35 },
      { type: "participation", label: "Participación", weight: 0.10 },
    ],
    evaluations: [
      { id: "ENG-U1", type: "unit", label: "Unidad 1" },
      { id: "ENG-U2", type: "unit", label: "Unidad 2" },
      { id: "ENG-EX1", type: "exam", label: "Examen 1" },
      { id: "ENG-PART", type: "participation", label: "Participación" },
    ],
  },
  {
    id: "C-GER-A11",
    name: "Alemán A1.1",
    evaluationTypes: [
      { type: "unit", label: "Lektionen", weight: 0.60 },
      { type: "exam", label: "Tests", weight: 0.30 },
      { type: "participation", label: "Mitarbeit", weight: 0.10 },
    ],
    evaluations: [
      { id: "GER-L1", type: "unit", label: "Lektion 1" },
      { id: "GER-L2", type: "unit", label: "Lektion 2" },
      { id: "GER-T1", type: "exam", label: "Test 1" },
      { id: "GER-PART", type: "participation", label: "Mitarbeit" },
    ],
  },
];

// Fase 3: agregamos publishStatus + auditLog
export const OA6_STUDENTS = [
  {
    id: "S-001",
    name: "Ana López",
    courseId: "C-ENG-A1",
    attendance: 92,
    lastUpdated: "2026-01-29",
    publishStatus: "draft", // "draft" | "published"
    auditLog: [],
    scores: {
      "ENG-U1": 90,
      "ENG-U2": 85,
      "ENG-EX1": 88,
      "ENG-PART": 95,
    },
  },
  {
    id: "S-002",
    name: "Carlos Martínez",
    courseId: "C-ENG-A1",
    attendance: 78,
    lastUpdated: "2026-01-28",
    publishStatus: "draft",
    auditLog: [],
    scores: {
      "ENG-U1": 70,
      "ENG-U2": 76,
      "ENG-EX1": 75,
      "ENG-PART": 72,
    },
  },
  {
    id: "S-003",
    name: "Sofía Hernández",
    courseId: "C-GER-A11",
    attendance: 96,
    lastUpdated: "2026-01-29",
    publishStatus: "published",
    auditLog: [
      {
        at: "2026-01-29T09:10:00.000Z",
        actor: "Admin",
        action: "publish",
        details: "Publicado por defecto en demo",
      },
    ],
    scores: {
      "GER-L1": 95,
      "GER-L2": 92,
      "GER-T1": 93,
      "GER-PART": 98,
    },
  },
];
