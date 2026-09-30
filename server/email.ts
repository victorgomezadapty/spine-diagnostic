import * as brevo from "@getbrevo/brevo";

// Sender/reply-to for Brevo emails. Set SENDER_EMAIL to an address verified in Brevo.
const SENDER_EMAIL = process.env.SENDER_EMAIL || "contacto@victorgomezcoach.com";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

interface Recommendation {
  id: string;
  title: string;
  action: string;
  rationale: string;
  category: "mechanical" | "recovery" | "psychosocial";
  icon: string;
  priority: "high" | "medium" | "low";
}

interface EmailData {
  email: string;
  assessmentId: string;
  riskLevel: "low" | "medium" | "high";
  totalScore: number;
  mechanicalRisk: number;
  recoveryRisk: number;
  psychosocialRisk: number;
  recommendations: Recommendation[];
  personalizedAlert: string;
  language: "es" | "en";
  realAge?: number;
  spineAge?: number;
}

const translations = {
  es: {
    subject: "Tu Informe de Evaluación de Riesgo Lumbar - ADAPTY",
    greeting: "Hola,",
    intro: "Gracias por completar tu evaluación de riesgo funcional. Aquí tienes un resumen de tus resultados:",
    riskLevel: "Nivel de Riesgo",
    riskLow: "Bajo",
    riskMedium: "Moderado",
    riskHigh: "Elevado",
    score: "Puntuación Total",
    breakdown: "Desglose por Categoría",
    mechanical: "Factores Mecánicos",
    recovery: "Capacidad de Recuperación",
    psychosocial: "Factores Psicosociales",
    alert: "Alerta Personalizada",
    recommendations: "Recomendaciones Principales",
    viewFull: "Ver Informe Completo",
    footer: "Este informe es informativo y no sustituye el diagnóstico médico profesional.",
    team: "El equipo de ADAPTY",
    spineAge: "Edad de tu Espalda",
    realAge: "Tu edad real",
    years: "años",
    spineAgeMessage: {
      excellent: "Tu espalda está en excelente forma",
      attention: "Tu espalda necesita algo de atención",
      priority: "Tu espalda requiere cuidado prioritario",
      urgent: "Tu espalda necesita atención urgente",
    },
  },
  en: {
    subject: "Your Lower Back Risk Assessment Report - ADAPTY",
    greeting: "Hello,",
    intro: "Thank you for completing your functional risk assessment. Here is a summary of your results:",
    riskLevel: "Risk Level",
    riskLow: "Low",
    riskMedium: "Moderate",
    riskHigh: "High",
    score: "Total Score",
    breakdown: "Category Breakdown",
    mechanical: "Mechanical Factors",
    recovery: "Recovery Capacity",
    psychosocial: "Psychosocial Factors",
    alert: "Personalized Alert",
    recommendations: "Key Recommendations",
    viewFull: "View Full Report",
    footer: "This report is informational and does not replace professional medical diagnosis.",
    team: "The ADAPTY Team",
    spineAge: "Your Spine Age",
    realAge: "Your real age",
    years: "years",
    spineAgeMessage: {
      excellent: "Your spine is in excellent shape",
      attention: "Your spine needs some attention",
      priority: "Your spine requires priority care",
      urgent: "Your spine needs urgent attention",
    },
  },
};

function getRiskColor(level: string): string {
  switch (level) {
    case "low":
      return "#22c55e";
    case "medium":
      return "#f59e0b";
    case "high":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function getRiskLabel(level: string, lang: "es" | "en"): string {
  const t = translations[lang];
  switch (level) {
    case "low":
      return t.riskLow;
    case "medium":
      return t.riskMedium;
    case "high":
      return t.riskHigh;
    default:
      return level;
  }
}

function getBarColor(score: number): string {
  if (score <= 30) return "#22c55e";
  if (score <= 60) return "#f59e0b";
  return "#ef4444";
}

function getCategoryColor(category: string): { bg: string; border: string; title: string; text: string } {
  switch (category) {
    case "mechanical":
      return { bg: "#eff6ff", border: "#3b82f6", title: "#1d4ed8", text: "#1e40af" };
    case "recovery":
      return { bg: "#faf5ff", border: "#a855f7", title: "#7c3aed", text: "#6b21a8" };
    case "psychosocial":
      return { bg: "#fff7ed", border: "#f97316", title: "#ea580c", text: "#c2410c" };
    default:
      return { bg: "#f0fdf4", border: "#22c55e", title: "#166534", text: "#15803d" };
  }
}

function generateEmailHtml(data: EmailData): string {
  const t = translations[data.language];
  const riskColor = getRiskColor(data.riskLevel);
  const riskLabel = getRiskLabel(data.riskLevel, data.language);
  const reportUrl = `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : (process.env.PUBLIC_URL ?? "https://adapty.replit.app")}/results/${data.assessmentId}`;

  const highPriority = data.recommendations.filter((r) => r.priority === "high");
  const mediumPriority = data.recommendations.filter((r) => r.priority === "medium");
  const topRecommendations = highPriority.length >= 3 
    ? highPriority.slice(0, 3) 
    : [...highPriority, ...mediumPriority].slice(0, 3);

  const mechanicalBarColor = getBarColor(data.mechanicalRisk);
  const recoveryBarColor = getBarColor(data.recoveryRisk);
  const psychosocialBarColor = getBarColor(data.psychosocialRisk);

  return `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">ADAPTY</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #a1a1aa;">${data.language === "es" ? "Evaluación de Riesgo Funcional" : "Functional Risk Assessment"}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">${t.intro}</p>
              
              <!-- Risk Level Card -->
              <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%); border-radius: 12px; margin-bottom: 28px; border: 1px solid #e4e4e7;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <p style="margin: 0 0 12px; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">${t.riskLevel}</p>
                    <p style="margin: 0; font-size: 36px; font-weight: 800; color: ${riskColor}; letter-spacing: -1px;">${riskLabel}</p>
                    <p style="margin: 12px 0 0; font-size: 14px; color: #71717a;">${t.score}: <strong style="color: #18181b;">${data.totalScore}/100</strong></p>
                  </td>
                </tr>
              </table>
              
              ${data.spineAge && data.realAge ? `
              <!-- Spine Age Section -->
              <table role="presentation" style="width: 100%; background: linear-gradient(135deg, ${riskColor}15 0%, ${riskColor}08 100%); border-radius: 12px; margin-bottom: 28px; border: 1px solid ${riskColor}30;">
                <tr>
                  <td style="padding: 28px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="text-align: center; vertical-align: middle; width: 50%; border-right: 1px solid ${riskColor}30; padding-right: 20px;">
                          <p style="margin: 0 0 8px; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">${t.spineAge}</p>
                          <p style="margin: 0; font-size: 48px; font-weight: 800; color: ${riskColor}; letter-spacing: -2px;">${data.spineAge}</p>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">${t.years}</p>
                        </td>
                        <td style="text-align: center; vertical-align: middle; width: 50%; padding-left: 20px;">
                          <p style="margin: 0 0 8px; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">${t.realAge}</p>
                          <p style="margin: 0; font-size: 36px; font-weight: 700; color: #52525b; letter-spacing: -1px;">${data.realAge}</p>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">${t.years}</p>
                        </td>
                      </tr>
                    </table>
                    ${data.spineAge > data.realAge ? `
                    <p style="margin: 20px 0 0; text-align: center; font-size: 14px; color: ${riskColor}; font-weight: 600;">
                      +${data.spineAge - data.realAge} ${data.language === 'es' ? 'años vs tu edad real' : 'years vs your real age'}
                    </p>
                    ` : ''}
                    <p style="margin: 12px 0 0; text-align: center; font-size: 13px; color: #52525b; line-height: 1.5;">
                      ${(() => {
                        const diff = data.spineAge! - data.realAge!;
                        if (diff <= 0) return t.spineAgeMessage.excellent;
                        if (diff <= 5) return t.spineAgeMessage.attention;
                        if (diff <= 10) return t.spineAgeMessage.priority;
                        return t.spineAgeMessage.urgent;
                      })()}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Breakdown with Progress Bars -->
              <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #18181b;">${t.breakdown}</p>
              <table role="presentation" style="width: 100%; margin-bottom: 28px;">
                <!-- Mechanical -->
                <tr>
                  <td style="padding: 16px; background-color: #fafafa; border-radius: 8px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="font-size: 14px; color: #52525b; font-weight: 500;">${t.mechanical}</td>
                        <td style="text-align: right; font-size: 14px; font-weight: 700; color: ${mechanicalBarColor};">${data.mechanicalRisk}%</td>
                      </tr>
                    </table>
                    <div style="margin-top: 10px; height: 8px; background-color: #e4e4e7; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${data.mechanicalRisk}%; height: 100%; background-color: ${mechanicalBarColor}; border-radius: 4px;"></div>
                    </div>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <!-- Recovery -->
                <tr>
                  <td style="padding: 16px; background-color: #fafafa; border-radius: 8px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="font-size: 14px; color: #52525b; font-weight: 500;">${t.recovery}</td>
                        <td style="text-align: right; font-size: 14px; font-weight: 700; color: ${recoveryBarColor};">${data.recoveryRisk}%</td>
                      </tr>
                    </table>
                    <div style="margin-top: 10px; height: 8px; background-color: #e4e4e7; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${data.recoveryRisk}%; height: 100%; background-color: ${recoveryBarColor}; border-radius: 4px;"></div>
                    </div>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <!-- Psychosocial -->
                <tr>
                  <td style="padding: 16px; background-color: #fafafa; border-radius: 8px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="font-size: 14px; color: #52525b; font-weight: 500;">${t.psychosocial}</td>
                        <td style="text-align: right; font-size: 14px; font-weight: 700; color: ${psychosocialBarColor};">${data.psychosocialRisk}%</td>
                      </tr>
                    </table>
                    <div style="margin-top: 10px; height: 8px; background-color: #e4e4e7; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${data.psychosocialRisk}%; height: 100%; background-color: ${psychosocialBarColor}; border-radius: 4px;"></div>
                    </div>
                  </td>
                </tr>
              </table>
              
              ${data.personalizedAlert ? `
              <!-- Alert -->
              <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">${t.alert}</p>
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">${data.personalizedAlert}</p>
                  </td>
                </tr>
              </table>
              ` : ""}
              
              ${topRecommendations.length > 0 ? `
              <!-- Recommendations -->
              <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #18181b;">${t.recommendations}</p>
              <table role="presentation" style="width: 100%; margin-bottom: 28px;">
                ${topRecommendations.map((rec) => {
                  const colors = getCategoryColor(rec.category);
                  return `
                <tr>
                  <td style="padding: 16px 18px; background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: ${colors.title};">${rec.title}</p>
                    <p style="margin: 0; font-size: 13px; color: ${colors.text}; line-height: 1.5;">${rec.action}</p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                `;
                }).join("")}
              </table>
              ` : ""}
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin-bottom: 28px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${reportUrl}" style="display: inline-block; padding: 16px 40px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">${t.viewFull}</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.5; text-align: center;">${t.team}</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5;">${t.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendAssessmentEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  if (!process.env.BREVO_API_KEY) {
    console.error("BREVO_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  const t = translations[data.language];

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = t.subject;
    sendSmtpEmail.htmlContent = generateEmailHtml(data);
    sendSmtpEmail.sender = { 
      name: "ADAPTY - Victor Gomez Coach", 
      email: SENDER_EMAIL 
    };
    sendSmtpEmail.to = [{ email: data.email }];
    sendSmtpEmail.replyTo = { email: SENDER_EMAIL };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent successfully to ${data.email}, messageId: ${result.body.messageId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Brevo email send error:", err?.body || err);
    return { success: false, error: err?.body?.message || err?.message || "Unknown error" };
  }
}

interface PlanLeadNotificationData {
  name: string;
  email: string;
  phone?: string | null;
  spineAge?: number | null;
  realAge?: number | null;
  riskLevel?: string | null;
  createdAt: Date | null;
}

export async function sendPlanLeadNotification(lead: PlanLeadNotificationData): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  
  if (!process.env.BREVO_API_KEY) {
    console.error("BREVO_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  if (!adminEmail) {
    console.error("ADMIN_NOTIFICATION_EMAIL not configured");
    return { success: false, error: "Admin email not configured" };
  }

  const riskLabels: Record<string, string> = {
    low: "Bajo",
    medium: "Moderado", 
    high: "Elevado"
  };

  const riskColors: Record<string, string> = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444"
  };

  const riskLevel = lead.riskLevel || "unknown";
  const riskLabel = riskLabels[riskLevel] || "No especificado";
  const riskColor = riskColors[riskLevel] || "#6b7280";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">🎯 Nuevo Lead - Plan Personalizado</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                    ${(lead.createdAt ? new Date(lead.createdAt) : new Date()).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Datos del interesado:</h2>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #6b7280; font-size: 14px;">Nombre:</span><br>
                        <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${lead.name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #6b7280; font-size: 14px;">Email:</span><br>
                        <a href="mailto:${lead.email}" style="color: #4f46e5; font-size: 16px; font-weight: 600; text-decoration: none;">${lead.email}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #6b7280; font-size: 14px;">Teléfono:</span><br>
                        <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${lead.phone || 'No proporcionado'}</span>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Risk and Age Info -->
                  <h2 style="color: #1f2937; margin: 30px 0 20px 0; font-size: 18px; font-weight: 600;">Resultados de la evaluación:</h2>
                  
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; text-align: center; width: 33%;">
                        <span style="color: #6b7280; font-size: 12px; display: block;">Nivel de Riesgo</span>
                        <span style="color: ${riskColor}; font-size: 18px; font-weight: 700; display: block; margin-top: 5px;">${riskLabel}</span>
                      </td>
                      <td style="width: 10px;"></td>
                      <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; text-align: center; width: 33%;">
                        <span style="color: #6b7280; font-size: 12px; display: block;">Edad Real</span>
                        <span style="color: #1f2937; font-size: 18px; font-weight: 700; display: block; margin-top: 5px;">${lead.realAge ? lead.realAge + ' años' : 'N/A'}</span>
                      </td>
                      <td style="width: 10px;"></td>
                      <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; text-align: center; width: 33%;">
                        <span style="color: #6b7280; font-size: 12px; display: block;">Edad Espalda</span>
                        <span style="color: ${riskColor}; font-size: 18px; font-weight: 700; display: block; margin-top: 5px;">${lead.spineAge ? lead.spineAge + ' años' : 'N/A'}</span>
                      </td>
                    </tr>
                  </table>
                  
                  ${lead.spineAge && lead.realAge && lead.spineAge > lead.realAge ? `
                  <div style="margin-top: 15px; padding: 12px 20px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <span style="color: #991b1b; font-size: 14px;">
                      ⚠️ Su espalda aparenta <strong>${lead.spineAge - lead.realAge} años más</strong> de su edad real
                    </span>
                  </div>
                  ` : ''}
                  
                  <!-- CTA -->
                  <div style="margin-top: 30px; text-align: center;">
                    <a href="mailto:${lead.email}?subject=Tu%20Plan%20Personalizado%20ADAPTY" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Contactar ahora
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; margin: 0; font-size: 12px;">
                    Este lead fue capturado desde ADAPTY - Evaluación de Riesgo Lumbar
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `🎯 Nuevo Lead: ${lead.name} - Plan Personalizado ADAPTY`;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { 
      name: "ADAPTY Leads", 
      email: SENDER_EMAIL 
    };
    sendSmtpEmail.to = [{ email: adminEmail }];
    sendSmtpEmail.replyTo = { email: lead.email };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Lead notification sent to ${adminEmail}, messageId: ${result.body.messageId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Brevo lead notification error:", err?.body || err);
    return { success: false, error: err?.body?.message || err?.message || "Unknown error" };
  }
}
