import type { Assessment, Recommendation } from "@shared/schema";

type Lang = "es" | "en";

const L = {
  es: {
    title: "Informe de Riesgo Funcional de Espalda",
    generated: "Generado el",
    risk: { low: "Riesgo Bajo", medium: "Riesgo Moderado", high: "Riesgo Elevado" },
    score: "Puntuación global",
    spineAge: "Edad de tu espalda",
    realAge: "edad real",
    years: "años",
    profile: "Perfil de riesgo",
    mechanical: "Riesgo mecánico",
    recovery: "Riesgo de recuperación",
    psychosocial: "Riesgo psicosocial",
    alert: "Alerta personalizada",
    recs: "Recomendaciones personalizadas",
    why: "¿Por qué?",
    disclaimer:
      "Aviso importante: esta es una Evaluación de Riesgo Funcional con fines informativos. No constituye diagnóstico médico ni sustituye la consulta profesional. Si experimentas dolor severo o persistente, consulta con un profesional de salud.",
    file: "ADAPTY-informe-espalda",
    page: "Página",
  },
  en: {
    title: "Functional Back Risk Report",
    generated: "Generated on",
    risk: { low: "Low Risk", medium: "Moderate Risk", high: "High Risk" },
    score: "Global score",
    spineAge: "Your spine age",
    realAge: "real age",
    years: "years",
    profile: "Risk profile",
    mechanical: "Mechanical risk",
    recovery: "Recovery risk",
    psychosocial: "Psychosocial risk",
    alert: "Personalized alert",
    recs: "Personalized recommendations",
    why: "Why?",
    disclaimer:
      "Important notice: this is a Functional Risk Assessment for informational purposes only. It is not a medical diagnosis and does not replace professional consultation. If you experience severe or persistent pain, consult a healthcare professional.",
    file: "ADAPTY-back-report",
    page: "Page",
  },
} as const;

const COLORS = {
  low: [34, 197, 94],
  medium: [234, 179, 8],
  high: [239, 68, 68],
  brand: [37, 99, 235],
  text: [30, 41, 59],
  muted: [100, 116, 139],
  track: [226, 232, 240],
} as const;

export function calculateSpineAge(realAge: number, totalScore: number, riskLevel: string): number {
  if (riskLevel === "low") return Math.max(18, realAge - Math.floor((100 - totalScore) / 20));
  if (riskLevel === "medium") return realAge + 5 + Math.floor(totalScore / 20);
  return realAge + 10 + Math.floor(totalScore / 10);
}

const barColor = (v: number) => (v <= 30 ? COLORS.low : v <= 60 ? COLORS.medium : COLORS.high);

export async function downloadReportPdf(assessment: Assessment, language?: string | null) {
  const { jsPDF } = await import("jspdf");
  const lang: Lang = (language ?? assessment.language) === "en" ? "en" : "es";
  const t = L[lang];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  let y = M;

  const color = (c: readonly number[]) => doc.setTextColor(c[0], c[1], c[2]);
  const ensure = (h: number) => {
    if (y + h > H - M - 16) {
      doc.addPage();
      y = M;
    }
  };
  const text = (
    str: string,
    size: number,
    opts: { bold?: boolean; color?: readonly number[]; gap?: number } = {},
  ) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    color(opts.color ?? COLORS.text);
    const lines = doc.splitTextToSize(str, CW) as string[];
    const lh = size * 1.35;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, M, y + size);
      y += lh;
    }
    y += opts.gap ?? 0;
  };

  const riskLevel = (assessment.riskLevel as "low" | "medium" | "high") || "medium";
  const totalScore = assessment.totalScore ?? 0;

  // Header
  doc.setFillColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  doc.rect(0, 0, W, 6, "F");
  text("ADAPTY", 12, { bold: true, color: COLORS.brand });
  text(t.title, 20, { bold: true, gap: 2 });
  const date = (assessment.createdAt ? new Date(assessment.createdAt) : new Date()).toLocaleDateString(
    lang === "es" ? "es-ES" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );
  text(`${t.generated} ${date}`, 9, { color: COLORS.muted, gap: 14 });

  // Result banner
  ensure(80);
  const rc = COLORS[riskLevel];
  doc.setFillColor(rc[0], rc[1], rc[2]);
  doc.roundedRect(M, y, CW, 64, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(t.risk[riskLevel], M + 16, y + 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${t.score}: ${totalScore}/100`, M + 16, y + 48);
  y += 64 + 16;

  // Spine age
  if (assessment.age) {
    const spine = calculateSpineAge(assessment.age, totalScore, riskLevel);
    const diff = spine - assessment.age;
    text(t.spineAge, 13, { bold: true, gap: 2 });
    const detail =
      diff > 0
        ? `(+${diff} ${t.years} vs ${t.realAge}: ${assessment.age})`
        : `(${t.realAge}: ${assessment.age})`;
    text(`${spine} ${t.years}  ${detail}`, 11, { gap: 14 });
  }

  // Alert
  if (assessment.personalizedAlert) {
    text(t.alert, 13, { bold: true, gap: 2 });
    text(assessment.personalizedAlert, 10.5, { color: COLORS.muted, gap: 14 });
  }

  // Risk profile bars
  text(t.profile, 13, { bold: true, gap: 6 });
  const bars: [string, number][] = [
    [t.mechanical, assessment.mechanicalRisk ?? 0],
    [t.recovery, assessment.recoveryRisk ?? 0],
    [t.psychosocial, assessment.psychosocialRisk ?? 0],
  ];
  for (const [label, value] of bars) {
    ensure(30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    color(COLORS.text);
    doc.text(label, M, y + 10);
    doc.text(`${value}%`, M + CW, y + 10, { align: "right" });
    y += 16;
    doc.setFillColor(COLORS.track[0], COLORS.track[1], COLORS.track[2]);
    doc.roundedRect(M, y, CW, 7, 3, 3, "F");
    const bc = barColor(value);
    doc.setFillColor(bc[0], bc[1], bc[2]);
    doc.roundedRect(M, y, Math.max(6, (CW * Math.min(100, value)) / 100), 7, 3, 3, "F");
    y += 7 + 10;
  }
  y += 6;

  // Recommendations
  const recs = (assessment.recommendations as Recommendation[] | null) ?? [];
  if (recs.length) {
    text(t.recs, 13, { bold: true, gap: 6 });
    for (const r of recs) {
      ensure(60);
      text(r.title, 11.5, { bold: true, gap: 1 });
      text(r.action, 10.5, { gap: 2 });
      text(`${t.why} ${r.rationale}`, 9.5, { color: COLORS.muted, gap: 10 });
    }
  }

  // Disclaimer
  y += 4;
  text(t.disclaimer, 8.5, { color: COLORS.muted });

  // Footer with page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    color(COLORS.muted);
    doc.text(`ADAPTY  -  ${t.page} ${i}/${pages}`, W / 2, H - 24, { align: "center" });
  }

  doc.save(`${t.file}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
