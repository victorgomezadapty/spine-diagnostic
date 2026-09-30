import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssessmentSchema, insertCompanySchema, insertPlanLeadSchema } from "@shared/schema";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { sendAssessmentEmail } from "./email";
import { sendToGoogleSheet } from "./googleSheets";

interface Recommendation {
  id: string;
  title: string;
  action: string;
  rationale: string;
  category: "mechanical" | "recovery" | "psychosocial";
  icon: string;
  priority: "high" | "medium" | "low";
}

interface RiskScores {
  totalScore: number;
  mechanicalRisk: number;
  recoveryRisk: number;
  psychosocialRisk: number;
  riskLevel: "low" | "medium" | "high";
  recommendations: Recommendation[];
  personalizedAlert: string;
}

type Language = "es" | "en";

const i18n = {
  es: {
    recommendations: {
      movementBreaksNever: {
        title: "Pausas de movimiento",
        action: "Levántate y camina 2-3 minutos cada hora. Usa alarmas o apps para recordártelo.",
        rationale: "Estar sentado más de 1 hora sin moverse comprime los discos intervertebrales y reduce el flujo sanguíneo a los músculos de soporte. Las micropausas reducen esta carga acumulativa hasta un 40%.",
      },
      movementBreaksRarely: {
        title: "Más pausas activas",
        action: "Aumenta tus pausas de movimiento a cada 45-60 minutos. Incorpora estiramientos suaves.",
        rationale: "La frecuencia de las pausas es tan importante como la duración. Pausas cortas pero frecuentes son más efectivas que pausas largas esporádicas para prevenir la fatiga muscular.",
      },
      legPain: {
        title: "Evaluación profesional",
        action: "Agenda una cita con un médico o fisioterapeuta para evaluar el dolor que baja por la pierna.",
        rationale: "El dolor irradiado a la pierna (ciática) puede indicar compresión de una raíz nerviosa. Una evaluación temprana permite descartar condiciones que requieren tratamiento específico.",
      },
      sedentary: {
        title: "Actividad física gradual",
        action: "Comienza con caminatas de 15-20 minutos diarias. Aumenta progresivamente.",
        rationale: "Los músculos del core y la espalda actúan como un corsé natural. Sin ejercicio, pierden fuerza y no pueden proteger la columna adecuadamente ante las demandas posturales.",
      },
      sleepPoor: {
        title: "Priorizar el descanso",
        action: "Establece una hora fija para dormir. Evita pantallas 1 hora antes. Considera técnicas de relajación.",
        rationale: "Durante el sueño profundo, el cuerpo repara tejidos dañados y reduce la inflamación. El sueño deficiente interrumpe este proceso y sensibiliza el sistema nervioso al dolor.",
      },
      sleepFair: {
        title: "Higiene del sueño",
        action: "Mantén un horario regular. Crea un ambiente oscuro y fresco. Limita la cafeína después del mediodía.",
        rationale: "La calidad del sueño impacta directamente la tolerancia al dolor y la capacidad de recuperación muscular. Pequeñas mejoras en hábitos de sueño pueden tener efectos significativos.",
      },
      stressHigh: {
        title: "Manejo del estrés",
        action: "Practica respiración diafragmática 5 minutos al día. Considera apps de meditación guiada.",
        rationale: "El estrés crónico eleva el cortisol, lo que aumenta la inflamación sistémica y la tensión muscular. Los músculos tensos comprimen estructuras y perpetúan el dolor.",
      },
      workIntensityVeryHigh: {
        title: "Balance trabajo-recuperación",
        action: "Programa pausas obligatorias en tu calendario. Prioriza las tareas más demandantes temprano.",
        rationale: "Las jornadas de alta presión agotan tus reservas de energía y reducen la capacidad del cuerpo para recuperarse. El agotamiento acumulado es un predictor importante de dolor crónico.",
      },
      fearMovement: {
        title: "Movimiento gradual seguro",
        action: "Comienza con movimientos suaves y controlados. El dolor no siempre significa daño.",
        rationale: "El miedo al movimiento (kinesiofobia) puede prolongar el dolor más que la lesión original. La evidencia muestra que el movimiento gradual acelera la recuperación y es seguro.",
      },
      catastrophizing: {
        title: "Reestructuración cognitiva",
        action: "Cuando notes pensamientos negativos sobre el dolor, cuestiona su precisión. Considera terapia cognitivo-conductual.",
        rationale: "Los patrones de pensamiento catastrofista amplifican las señales de dolor en el cerebro. Cambiar estos patrones reduce la intensidad percibida del dolor significativamente.",
      },
      depression: {
        title: "Apoyo emocional",
        action: "Habla con alguien de confianza sobre cómo te sientes. Si notas que esto persiste, considera consultar a un profesional de salud.",
        rationale: "El dolor prolongado puede afectar tu estado de ánimo y energía. Esto es algo normal y hablar de cómo te sientes puede ayudarte. El apoyo profesional está disponible si lo necesitas.",
      },
    },
    alerts: {
      sedentarySleep: "Tu combinación de sedentarismo prolongado y mala calidad de sueño aumenta significativamente el riesgo de un episodio agudo. Prioriza pausas de movimiento hoy.",
      intensiveWork: "Las jornadas intensas sin pausas adecuadas tensionan tu espalda. Programa alarmas para moverte cada hora.",
      posturalLoad: "Tu carga postural es elevada. Revisa la ergonomía de tu puesto de trabajo y aumenta las pausas activas.",
      poorSleep: "La falta de sueño reparador está afectando tu capacidad de recuperación muscular. Tu cuerpo necesita descanso de calidad.",
      stressRecovery: "Tu capacidad de recuperación está comprometida por el estrés acumulado. Considera técnicas de relajación antes de dormir.",
      psychosocial: "El estrés y las preocupaciones pueden influir en cómo percibes el dolor. Hablar con alguien de confianza o con un profesional puede ayudarte a sentirte mejor.",
      moderate: "Tienes algunos factores de riesgo que conviene atender. Pequeños cambios en tu rutina pueden hacer una gran diferencia.",
      favorable: "Tu perfil de riesgo es favorable. Mantén tus buenos hábitos y presta atención a las señales de tu cuerpo.",
    },
    riskSummary: {
      low: {
        title: "Riesgo bajo",
        action: "Mantén tus buenos hábitos posturales y actividad física regular.",
        rationale: "Tu perfil actual es favorable. La prevención activa te ayudará a mantener una espalda saludable a largo plazo.",
      },
      medium: {
        title: "Riesgo moderado",
        action: "Implementa las siguientes recomendaciones para prevenir problemas.",
        rationale: "Tienes factores de riesgo que, sin atención, pueden evolucionar. Las intervenciones tempranas son más efectivas.",
      },
      high: {
        title: "Riesgo elevado",
        action: "Consulta con un profesional de salud lo antes posible.",
        rationale: "Tu combinación de factores requiere atención profesional. Un especialista puede diseñar un plan personalizado para tu situación.",
      },
    },
  },
  en: {
    recommendations: {
      movementBreaksNever: {
        title: "Movement breaks",
        action: "Stand up and walk for 2-3 minutes every hour. Use alarms or apps to remind yourself.",
        rationale: "Sitting for more than 1 hour compresses intervertebral discs and reduces blood flow to supporting muscles. Micro-breaks reduce this cumulative load by up to 40%.",
      },
      movementBreaksRarely: {
        title: "More active breaks",
        action: "Increase your movement breaks to every 45-60 minutes. Incorporate gentle stretches.",
        rationale: "Break frequency is as important as duration. Short but frequent breaks are more effective than long sporadic ones for preventing muscle fatigue.",
      },
      legPain: {
        title: "Professional evaluation",
        action: "Schedule an appointment with a doctor or physiotherapist to evaluate leg pain.",
        rationale: "Radiating leg pain (sciatica) may indicate nerve root compression. Early evaluation helps rule out conditions requiring specific treatment.",
      },
      sedentary: {
        title: "Gradual physical activity",
        action: "Start with 15-20 minute daily walks. Increase progressively.",
        rationale: "Core and back muscles act as a natural corset. Without exercise, they lose strength and cannot adequately protect the spine against postural demands.",
      },
      sleepPoor: {
        title: "Prioritize rest",
        action: "Set a fixed bedtime. Avoid screens 1 hour before. Consider relaxation techniques.",
        rationale: "During deep sleep, the body repairs damaged tissues and reduces inflammation. Poor sleep interrupts this process and sensitizes the nervous system to pain.",
      },
      sleepFair: {
        title: "Sleep hygiene",
        action: "Keep a regular schedule. Create a dark, cool environment. Limit caffeine after noon.",
        rationale: "Sleep quality directly impacts pain tolerance and muscle recovery capacity. Small improvements in sleep habits can have significant effects.",
      },
      stressHigh: {
        title: "Stress management",
        action: "Practice diaphragmatic breathing for 5 minutes daily. Consider guided meditation apps.",
        rationale: "Chronic stress raises cortisol, increasing systemic inflammation and muscle tension. Tense muscles compress structures and perpetuate pain.",
      },
      workIntensityVeryHigh: {
        title: "Work-recovery balance",
        action: "Schedule mandatory breaks in your calendar. Prioritize demanding tasks early in the day.",
        rationale: "High-pressure workdays deplete energy reserves and reduce the body's recovery capacity. Accumulated exhaustion is an important predictor of chronic pain.",
      },
      fearMovement: {
        title: "Safe gradual movement",
        action: "Start with gentle, controlled movements. Pain doesn't always mean damage.",
        rationale: "Fear of movement (kinesiophobia) can prolong pain more than the original injury. Evidence shows gradual movement accelerates recovery and is safe.",
      },
      catastrophizing: {
        title: "Cognitive restructuring",
        action: "When you notice negative thoughts about pain, question their accuracy. Consider cognitive-behavioral therapy.",
        rationale: "Catastrophic thinking patterns amplify pain signals in the brain. Changing these patterns significantly reduces perceived pain intensity.",
      },
      depression: {
        title: "Emotional support",
        action: "Talk to someone you trust about how you feel. If this persists, consider consulting a health professional.",
        rationale: "Prolonged pain can affect your mood and energy. This is normal and talking about how you feel can help. Professional support is available if you need it.",
      },
    },
    alerts: {
      sedentarySleep: "Your combination of prolonged sedentary time and poor sleep quality significantly increases the risk of an acute episode. Prioritize movement breaks today.",
      intensiveWork: "Intensive work sessions without adequate breaks strain your back. Set alarms to move every hour.",
      posturalLoad: "Your postural load is elevated. Review your workstation ergonomics and increase active breaks.",
      poorSleep: "Lack of restorative sleep is affecting your muscle recovery capacity. Your body needs quality rest.",
      stressRecovery: "Your recovery capacity is compromised by accumulated stress. Consider relaxation techniques before bed.",
      psychosocial: "Stress and worries can influence how you perceive pain. Talking to someone you trust or a professional can help you feel better.",
      moderate: "You have some risk factors worth addressing. Small changes in your routine can make a big difference.",
      favorable: "Your risk profile is favorable. Maintain your good habits and pay attention to your body's signals.",
    },
    riskSummary: {
      low: {
        title: "Low risk",
        action: "Maintain your good postural habits and regular physical activity.",
        rationale: "Your current profile is favorable. Active prevention will help you maintain a healthy back long-term.",
      },
      medium: {
        title: "Moderate risk",
        action: "Implement the following recommendations to prevent problems.",
        rationale: "You have risk factors that, without attention, may evolve. Early interventions are more effective.",
      },
      high: {
        title: "Elevated risk",
        action: "Consult with a health professional as soon as possible.",
        rationale: "Your combination of factors requires professional attention. A specialist can design a personalized plan for your situation.",
      },
    },
  }
};

// Calculate spine age based on risk score and real age
function calculateSpineAge(realAge: number, totalScore: number, riskLevel: string): number {
  if (riskLevel === "low") {
    return Math.max(18, realAge - Math.floor((100 - totalScore) / 20));
  } else if (riskLevel === "medium") {
    return realAge + 5 + Math.floor(totalScore / 20);
  } else {
    return realAge + 10 + Math.floor(totalScore / 10);
  }
}

function calculateRiskScores(data: {
  hasPain: string | null;
  painIntensity: number | null;
  painDuration: string | null;
  legPain: string | null;
  shoulderNeckPain: string | null;
  fearMovement: number | null;
  catastrophizing: number | null;
  depression: number | null;
  stressLevel: number | null;
  hoursSeated: number | null;
  physicalActivity: string | null;
  movementBreaks: string | null;
  sleepQuality: string | null;
  workIntensity: string | null;
  age: number | null;
}, language: Language = "es"): RiskScores {
  const t = i18n[language];
  const recommendations: Recommendation[] = [];
  
  // === MECHANICAL RISK (0-100) ===
  let mechanicalScore = 0;
  
  const hoursSeated = data.hoursSeated || 0;
  if (hoursSeated >= 9) mechanicalScore += 30;
  else if (hoursSeated >= 6) mechanicalScore += 20;
  else if (hoursSeated >= 4) mechanicalScore += 10;
  
  if (data.movementBreaks === "never") {
    mechanicalScore += 25;
    recommendations.push({
      id: "movement-breaks-never",
      ...t.recommendations.movementBreaksNever,
      category: "mechanical",
      icon: "Timer",
      priority: "high",
    });
  } else if (data.movementBreaks === "rarely") {
    mechanicalScore += 18;
    recommendations.push({
      id: "movement-breaks-rarely",
      ...t.recommendations.movementBreaksRarely,
      category: "mechanical",
      icon: "Clock",
      priority: "medium",
    });
  } else if (data.movementBreaks === "sometimes") {
    mechanicalScore += 8;
  }
  
  if (data.hasPain === "yes") {
    mechanicalScore += Math.min((data.painIntensity || 0) * 2, 20);
    
    if (data.legPain === "yes") {
      mechanicalScore += 10;
      recommendations.push({
        id: "leg-pain",
        ...t.recommendations.legPain,
        category: "mechanical",
        icon: "Stethoscope",
        priority: "high",
      });
    }
  }
  
  if (data.physicalActivity === "sedentary") {
    mechanicalScore += 15;
    recommendations.push({
      id: "sedentary",
      ...t.recommendations.sedentary,
      category: "mechanical",
      icon: "Footprints",
      priority: "medium",
    });
  } else if (data.physicalActivity === "light") {
    mechanicalScore += 8;
  }
  
  mechanicalScore = Math.min(100, mechanicalScore);

  // === RECOVERY RISK (0-100) ===
  let recoveryScore = 0;
  
  if (data.sleepQuality === "poor") {
    recoveryScore += 40;
    recommendations.push({
      id: "sleep-poor",
      ...t.recommendations.sleepPoor,
      category: "recovery",
      icon: "Moon",
      priority: "high",
    });
  } else if (data.sleepQuality === "fair") {
    recoveryScore += 25;
    recommendations.push({
      id: "sleep-fair",
      ...t.recommendations.sleepFair,
      category: "recovery",
      icon: "BedDouble",
      priority: "medium",
    });
  } else if (data.sleepQuality === "good") {
    recoveryScore += 10;
  }
  
  const stressScore = data.stressLevel || 0;
  recoveryScore += stressScore * 3;
  
  if (stressScore >= 7) {
    recommendations.push({
      id: "stress-high",
      ...t.recommendations.stressHigh,
      category: "recovery",
      icon: "Wind",
      priority: "high",
    });
  }
  
  if (data.workIntensity === "very_high") {
    recoveryScore += 20;
    recommendations.push({
      id: "work-intensity",
      ...t.recommendations.workIntensityVeryHigh,
      category: "recovery",
      icon: "CalendarClock",
      priority: "medium",
    });
  } else if (data.workIntensity === "high") {
    recoveryScore += 12;
  } else if (data.workIntensity === "moderate") {
    recoveryScore += 5;
  }
  
  if ((data.age || 0) >= 50) {
    recoveryScore += 10;
  } else if ((data.age || 0) >= 40) {
    recoveryScore += 5;
  }
  
  recoveryScore = Math.min(100, recoveryScore);

  // === PSYCHOSOCIAL RISK (0-100) ===
  let psychosocialScore = 0;
  
  const fearScore = (data.fearMovement || 0) * 3.5;
  psychosocialScore += fearScore;
  
  if ((data.fearMovement || 0) >= 6) {
    recommendations.push({
      id: "fear-movement",
      ...t.recommendations.fearMovement,
      category: "psychosocial",
      icon: "ArrowRight",
      priority: "high",
    });
  }
  
  const catScore = (data.catastrophizing || 0) * 3.5;
  psychosocialScore += catScore;
  
  if ((data.catastrophizing || 0) >= 6) {
    recommendations.push({
      id: "catastrophizing",
      ...t.recommendations.catastrophizing,
      category: "psychosocial",
      icon: "Brain",
      priority: "medium",
    });
  }
  
  const depScore = (data.depression || 0) * 3;
  psychosocialScore += depScore;
  
  if ((data.depression || 0) >= 6) {
    recommendations.push({
      id: "depression",
      ...t.recommendations.depression,
      category: "psychosocial",
      icon: "Heart",
      priority: "high",
    });
  }
  
  psychosocialScore = Math.min(100, psychosocialScore);

  // === TOTAL SCORE & RISK LEVEL ===
  const totalScore = Math.round(
    (mechanicalScore * 0.4) + (recoveryScore * 0.3) + (psychosocialScore * 0.3)
  );
  
  let riskLevel: "low" | "medium" | "high";
  let riskSummary;
  if (totalScore <= 30) {
    riskLevel = "low";
    riskSummary = t.riskSummary.low;
  } else if (totalScore <= 60) {
    riskLevel = "medium";
    riskSummary = t.riskSummary.medium;
  } else {
    riskLevel = "high";
    riskSummary = t.riskSummary.high;
  }

  // Add risk summary as first recommendation
  recommendations.unshift({
    id: `risk-${riskLevel}`,
    title: riskSummary.title,
    action: riskSummary.action,
    rationale: riskSummary.rationale,
    category: "mechanical",
    icon: riskLevel === "high" ? "AlertTriangle" : riskLevel === "medium" ? "AlertCircle" : "CheckCircle",
    priority: riskLevel === "low" ? "low" : riskLevel === "medium" ? "medium" : "high",
  });

  // === PERSONALIZED ALERT ===
  let personalizedAlert = "";
  
  const highestRisk = Math.max(mechanicalScore, recoveryScore, psychosocialScore);
  
  if (highestRisk >= 60) {
    if (mechanicalScore === highestRisk) {
      if (data.sleepQuality === "poor" || data.sleepQuality === "fair") {
        personalizedAlert = t.alerts.sedentarySleep;
      } else if (data.workIntensity === "high" || data.workIntensity === "very_high") {
        personalizedAlert = t.alerts.intensiveWork;
      } else {
        personalizedAlert = t.alerts.posturalLoad;
      }
    } else if (recoveryScore === highestRisk) {
      if (data.sleepQuality === "poor") {
        personalizedAlert = t.alerts.poorSleep;
      } else {
        personalizedAlert = t.alerts.stressRecovery;
      }
    } else {
      personalizedAlert = t.alerts.psychosocial;
    }
  } else if (highestRisk >= 40) {
    personalizedAlert = t.alerts.moderate;
  } else {
    personalizedAlert = t.alerts.favorable;
  }

  return {
    totalScore,
    mechanicalRisk: Math.round(mechanicalScore),
    recoveryRisk: Math.round(recoveryScore),
    psychosocialRisk: Math.round(psychosocialScore),
    riskLevel,
    recommendations,
    personalizedAlert,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Admin API is closed unless ADMIN_PASSWORD is set and sent as x-admin-key.
  app.use("/api/admin", (req, res, next) => {
    const expected = process.env.ADMIN_PASSWORD;
    const provided = req.header("x-admin-key");
    if (!expected || !provided) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  });

  app.post("/api/assessments", async (req, res) => {
    try {
      const validatedData = insertAssessmentSchema.parse(req.body);
      
      const language = (validatedData.language as Language) || "es";
      
      const scores = calculateRiskScores({
        hasPain: validatedData.hasPain || null,
        painIntensity: validatedData.painIntensity || null,
        painDuration: validatedData.painDuration || null,
        legPain: validatedData.legPain || null,
        shoulderNeckPain: validatedData.shoulderNeckPain || null,
        fearMovement: validatedData.fearMovement || null,
        catastrophizing: validatedData.catastrophizing || null,
        depression: validatedData.depression || null,
        stressLevel: validatedData.stressLevel || null,
        hoursSeated: validatedData.hoursSeated || null,
        physicalActivity: validatedData.physicalActivity || null,
        movementBreaks: validatedData.movementBreaks || null,
        sleepQuality: validatedData.sleepQuality || null,
        workIntensity: validatedData.workIntensity || null,
        age: validatedData.age || null,
      }, language);

      const assessment = await storage.createAssessment({
        ...validatedData,
        riskLevel: scores.riskLevel,
        totalScore: scores.totalScore,
        mechanicalRisk: scores.mechanicalRisk,
        recoveryRisk: scores.recoveryRisk,
        psychosocialRisk: scores.psychosocialRisk,
        recommendations: scores.recommendations,
        personalizedAlert: scores.personalizedAlert,
      });

      // Send email if user provided one
      if (validatedData.email) {
        console.log(`Attempting to send email to: ${validatedData.email}`);
        
        // Calculate spine age if age is provided
        const realAge = validatedData.age || undefined;
        const spineAge = realAge ? calculateSpineAge(realAge, scores.totalScore, scores.riskLevel) : undefined;
        
        sendAssessmentEmail({
          email: validatedData.email,
          assessmentId: assessment.id,
          riskLevel: scores.riskLevel,
          totalScore: scores.totalScore,
          mechanicalRisk: scores.mechanicalRisk,
          recoveryRisk: scores.recoveryRisk,
          psychosocialRisk: scores.psychosocialRisk,
          recommendations: scores.recommendations,
          personalizedAlert: scores.personalizedAlert,
          language: language,
          realAge: realAge,
          spineAge: spineAge,
        }).then((result) => {
          if (result.success) {
            console.log(`Email sent successfully to ${validatedData.email}`);
          } else {
            console.error(`Email failed: ${result.error}`);
          }
        }).catch((err) => {
          console.error("Failed to send email:", err);
        });
      }

      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error creating assessment:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: "Internal server error", message: errorMessage });
      }
    }
  });

  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      
      if (!assessment) {
        res.status(404).json({ error: "Assessment not found" });
        return;
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // B2B ENTERPRISE ROUTES
  // ============================================

  // Register a new company (public form)
  app.post("/api/companies", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      console.log(`New company registered: ${company.companyName} (${company.id})`);
      res.status(201).json({ 
        success: true, 
        companyId: company.id,
        inviteCode: company.inviteCode,
        message: "Empresa registrada correctamente. Nos pondremos en contacto pronto."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Company validation error:", error.errors);
        res.status(400).json({ error: "Datos inválidos", details: error.errors });
      } else {
        console.error("Error creating company:", error);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    }
  });

  // Upload file for a company
  app.post("/api/companies/:companyId/files", async (req, res) => {
    try {
      const { companyId } = req.params;
      const { fileName, fileType, fileSize, fileData, description } = req.body;

      if (!fileName || !fileData) {
        res.status(400).json({ error: "Nombre de archivo y datos son requeridos" });
        return;
      }

      const company = await storage.getCompany(companyId);
      if (!company) {
        res.status(404).json({ error: "Empresa no encontrada" });
        return;
      }

      const file = await storage.createCompanyFile({
        companyId,
        fileName,
        fileType: fileType || null,
        fileSize: fileSize || null,
        fileData,
        description: description || null,
      });

      console.log(`File uploaded for company ${companyId}: ${fileName}`);
      res.status(201).json({ success: true, fileId: file.id });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Error al subir archivo" });
    }
  });

  // Validate company invite code
  app.get("/api/companies/validate/:inviteCode", async (req, res) => {
    try {
      const company = await storage.getCompanyByInviteCode(req.params.inviteCode);
      if (!company) {
        res.status(404).json({ valid: false, error: "Código no válido" });
        return;
      }
      res.json({ valid: true, companyName: company.companyName });
    } catch (error) {
      console.error("Error validating invite code:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // ============================================
  // ADMIN ROUTES (Internal Panel)
  // ============================================

  // Get all companies (admin)
  app.get("/api/admin/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // Get single company with details (admin)
  app.get("/api/admin/companies/:id", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        res.status(404).json({ error: "Empresa no encontrada" });
        return;
      }

      const files = await storage.getCompanyFiles(company.id);
      const assessments = company.inviteCode 
        ? await storage.getAssessmentsByCompanyCode(company.inviteCode)
        : [];
      const costAnalysis = await storage.getCostAnalysisByCompany(company.id);

      res.json({
        company,
        files,
        assessments,
        costAnalysis,
        stats: {
          totalAssessments: assessments.length,
          highRisk: assessments.filter(a => a.riskLevel === "high").length,
          mediumRisk: assessments.filter(a => a.riskLevel === "medium").length,
          lowRisk: assessments.filter(a => a.riskLevel === "low").length,
          avgMechanicalRisk: assessments.length > 0 
            ? Math.round(assessments.reduce((sum, a) => sum + (a.mechanicalRisk || 0), 0) / assessments.length)
            : 0,
          avgRecoveryRisk: assessments.length > 0
            ? Math.round(assessments.reduce((sum, a) => sum + (a.recoveryRisk || 0), 0) / assessments.length)
            : 0,
          avgPsychosocialRisk: assessments.length > 0
            ? Math.round(assessments.reduce((sum, a) => sum + (a.psychosocialRisk || 0), 0) / assessments.length)
            : 0,
        }
      });
    } catch (error) {
      console.error("Error fetching company details:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // Update company status (admin)
  app.patch("/api/admin/companies/:id/status", async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      const updated = await storage.updateCompanyStatus(req.params.id, status, adminNotes);
      if (!updated) {
        res.status(404).json({ error: "Empresa no encontrada" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating company status:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // Calculate and save cost analysis (admin)
  app.post("/api/admin/companies/:id/cost-analysis", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        res.status(404).json({ error: "Empresa no encontrada" });
        return;
      }

      const assessments = company.inviteCode 
        ? await storage.getAssessmentsByCompanyCode(company.inviteCode)
        : [];

      // Cost calculation based on company data
      const totalEmployees = company.totalEmployees || 0;
      const officePercent = (company.officeEmployeesPercent || 70) / 100;
      const officeEmployees = Math.round(totalEmployees * officePercent);
      const avgSalary = parseFloat(company.averageSalary || "0");
      const dailySalary = avgSalary / 260; // ~260 working days/year
      const sickDays = company.sickDaysPerYear || 5;

      // Absenteeism cost (direct)
      const absenteeismCost = officeEmployees * sickDays * dailySalary * 0.4; // 40% attributed to back pain

      // Presenteeism cost (indirect - much higher)
      // 67% of office workers experience back pain, 40% productivity loss
      const presenteeismCost = officeEmployees * 0.67 * avgSalary * 0.4;

      // Future risk cost (based on assessment data if available)
      let futureRiskCost = 0;
      if (assessments.length > 0) {
        const highRiskCount = assessments.filter(a => a.riskLevel === "high").length;
        const mediumRiskCount = assessments.filter(a => a.riskLevel === "medium").length;
        // Projected sick days for high/medium risk employees
        futureRiskCost = (highRiskCount * 15 + mediumRiskCount * 5) * dailySalary;
      }

      const totalAnnualCost = absenteeismCost + presenteeismCost + futureRiskCost;
      const potentialSavings = totalAnnualCost * 0.25; // Conservative 25% reduction with intervention

      // Identify key interventions
      const keyInterventions = [];
      if (assessments.length > 0) {
        const avgMech = assessments.reduce((s, a) => s + (a.mechanicalRisk || 0), 0) / assessments.length;
        const avgRec = assessments.reduce((s, a) => s + (a.recoveryRisk || 0), 0) / assessments.length;
        const avgPsy = assessments.reduce((s, a) => s + (a.psychosocialRisk || 0), 0) / assessments.length;

        if (avgMech > 50) keyInterventions.push({ area: "Mecánico", priority: "high", recommendation: "Ergonomía y pausas activas" });
        if (avgRec > 50) keyInterventions.push({ area: "Recuperación", priority: "high", recommendation: "Higiene del sueño y actividad física" });
        if (avgPsy > 50) keyInterventions.push({ area: "Psicosocial", priority: "high", recommendation: "Manejo del estrés y apoyo" });
      }

      const analysisData = {
        companyId: company.id,
        absenteeismCost: absenteeismCost.toFixed(2),
        presenteeismCost: presenteeismCost.toFixed(2),
        futureRiskCost: futureRiskCost.toFixed(2),
        totalAnnualCost: totalAnnualCost.toFixed(2),
        potentialSavings: potentialSavings.toFixed(2),
        employeesAssessed: assessments.length,
        highRiskCount: assessments.filter(a => a.riskLevel === "high").length,
        mediumRiskCount: assessments.filter(a => a.riskLevel === "medium").length,
        lowRiskCount: assessments.filter(a => a.riskLevel === "low").length,
        avgMechanicalRisk: assessments.length > 0 
          ? Math.round(assessments.reduce((s, a) => s + (a.mechanicalRisk || 0), 0) / assessments.length) : 0,
        avgRecoveryRisk: assessments.length > 0
          ? Math.round(assessments.reduce((s, a) => s + (a.recoveryRisk || 0), 0) / assessments.length) : 0,
        avgPsychosocialRisk: assessments.length > 0
          ? Math.round(assessments.reduce((s, a) => s + (a.psychosocialRisk || 0), 0) / assessments.length) : 0,
        keyInterventions,
        executiveSummary: req.body.executiveSummary || null,
      };

      const analysis = await storage.createCostAnalysis(analysisData);
      console.log(`Cost analysis created for company ${company.id}`);
      res.status(201).json(analysis);
    } catch (error) {
      console.error("Error creating cost analysis:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // Get company dashboard (for showing to client)
  app.get("/api/dashboard/:companyId", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.companyId);
      if (!company) {
        res.status(404).json({ error: "Empresa no encontrada" });
        return;
      }

      const costAnalysis = await storage.getCostAnalysisByCompany(company.id);
      if (!costAnalysis) {
        res.status(404).json({ error: "Análisis no disponible aún" });
        return;
      }

      // Return sanitized data for client dashboard (no individual assessments)
      res.json({
        companyName: company.companyName,
        totalEmployees: company.totalEmployees,
        analysis: {
          absenteeismCost: costAnalysis.absenteeismCost,
          presenteeismCost: costAnalysis.presenteeismCost,
          futureRiskCost: costAnalysis.futureRiskCost,
          totalAnnualCost: costAnalysis.totalAnnualCost,
          potentialSavings: costAnalysis.potentialSavings,
          employeesAssessed: costAnalysis.employeesAssessed,
          riskDistribution: {
            high: costAnalysis.highRiskCount,
            medium: costAnalysis.mediumRiskCount,
            low: costAnalysis.lowRiskCount,
          },
          avgRisks: {
            mechanical: costAnalysis.avgMechanicalRisk,
            recovery: costAnalysis.avgRecoveryRisk,
            psychosocial: costAnalysis.avgPsychosocialRisk,
          },
          keyInterventions: costAnalysis.keyInterventions,
          executiveSummary: costAnalysis.executiveSummary,
        },
        generatedAt: costAnalysis.createdAt,
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // ============================================
  // PLAN LEADS (Subscription interest)
  // ============================================

  // Submit interest in personalized plan
  app.post("/api/plan-leads", async (req, res) => {
    try {
      const validatedData = insertPlanLeadSchema.parse(req.body);
      const lead = await storage.createPlanLead(validatedData);
      console.log(`New plan lead created: ${lead.email}`);
      
      // Send data to Google Sheet
      let assessment = null;
      if (lead.assessmentId) {
        try {
          assessment = await storage.getAssessment(lead.assessmentId);
        } catch (err) {
          console.error("Error fetching assessment for Google Sheet:", err);
        }
      }
      sendToGoogleSheet({
        type: "gate_submission",
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        country: lead.country ?? null,
        spineAge: lead.spineAge,
        realAge: lead.realAge,
        riskLevel: lead.riskLevel,
        totalScore: assessment?.totalScore ?? null,
        occupation: assessment?.occupation ?? null,
        timestamp: new Date().toISOString(),
      }).then(result => {
        if (result.success) {
          console.log(`Google Sheet updated for ${lead.email}`);
        } else {
          console.error(`Failed to update Google Sheet: ${result.error}`);
        }
      }).catch(err => {
        console.error("Error sending to Google Sheet:", err);
      });
      
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Datos inválidos", details: error.errors });
        return;
      }
      console.error("Error creating plan lead:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // Admin: Get all plan leads
  app.get("/api/admin/plan-leads", async (req, res) => {
    try {
      const leads = await storage.getAllPlanLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching plan leads:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // Admin: Update lead status
  app.patch("/api/admin/plan-leads/:id/status", async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      if (!status) {
        res.status(400).json({ error: "Status es requerido" });
        return;
      }
      const updated = await storage.updatePlanLeadStatus(req.params.id, status, adminNotes);
      if (!updated) {
        res.status(404).json({ error: "Lead no encontrado" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating lead status:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  // Contact request from results page (user wants to be contacted)
  app.post("/api/contact-requests", async (req, res) => {
    try {
      const { assessmentId } = req.body;
      if (!assessmentId) {
        res.status(400).json({ error: "assessmentId is required" });
        return;
      }

      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        res.status(404).json({ error: "Assessment not found" });
        return;
      }

      const lead = await storage.getPlanLeadByAssessmentId(assessmentId);

      if (!lead) {
        res.status(404).json({ error: "No contact data found for this assessment" });
        return;
      }

      if (lead.status === "contact_requested") {
        res.status(200).json({ success: true, alreadyRequested: true });
        return;
      }

      await storage.updatePlanLeadStatus(lead.id, "contact_requested");

      sendToGoogleSheet({
        type: "contact_request",
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        country: lead.country ?? null,
        spineAge: lead.spineAge,
        realAge: lead.realAge ?? assessment.age ?? null,
        riskLevel: lead.riskLevel ?? assessment.riskLevel ?? null,
        totalScore: assessment.totalScore ?? null,
        occupation: assessment.occupation ?? null,
        timestamp: new Date().toISOString(),
      }).then(result => {
        if (result.success) {
          console.log(`Contact request sent to Google Sheet for assessment ${assessmentId}`);
        } else {
          console.error(`Failed to send contact request to Google Sheet: ${result.error}`);
        }
      }).catch(err => {
        console.error("Error sending contact request to Google Sheet:", err);
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing contact request:", error);
      res.status(500).json({ error: "Error interno" });
    }
  });

  return httpServer;
}
