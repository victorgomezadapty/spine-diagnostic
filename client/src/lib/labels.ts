// Human-readable labels for enum values

export const occupationLabels: Record<string, string> = {
  office: "Trabajo de oficina",
  remote: "Trabajo remoto",
  healthcare: "Sector salud",
  education: "Educación",
  manufacturing: "Industria/Manufactura",
  retail: "Comercio/Ventas",
  other: "Otro",
};

export const painDurationLabels: Record<string, string> = {
  less_week: "Menos de 1 semana",
  "1_4_weeks": "1-4 semanas",
  "1_3_months": "1-3 meses",
  more_3_months: "Más de 3 meses",
};

export const painLocationLabels: Record<string, string> = {
  lower: "Lumbar (espalda baja)",
  middle: "Dorsal (espalda media)",
  upper: "Cervical (cuello)",
  multiple: "Múltiples zonas",
};

export const physicalActivityLabels: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Actividad ligera",
  moderate: "Actividad moderada",
  active: "Muy activo",
};

export const movementBreaksLabels: Record<string, string> = {
  never: "Nunca",
  rarely: "Raramente",
  sometimes: "A veces",
  frequently: "Frecuentemente",
};

export const sleepQualityLabels: Record<string, string> = {
  poor: "Mala",
  fair: "Regular",
  good: "Buena",
  excellent: "Excelente",
};

export const workIntensityLabels: Record<string, string> = {
  low: "Baja (pocas reuniones)",
  moderate: "Moderada (carga normal)",
  high: "Alta (muchos plazos)",
  very_high: "Muy alta (estrés constante)",
};

export function getLabel(value: string | null | undefined, labels: Record<string, string>): string {
  if (!value) return "No especificado";
  return labels[value] || value;
}
