import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Home,
  Download,
  Briefcase,
  Heart,
  Brain,
  Dumbbell,
  Timer,
  Clock,
  Stethoscope,
  Footprints,
  Moon,
  BedDouble,
  Wind,
  CalendarClock,
  Sparkles,
  Apple,
  Bed,
  TrendingDown,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/language-selector";
import type { Assessment, Recommendation } from "@shared/schema";
import { calculateSpineAge, downloadReportPdf } from "@/lib/report-pdf";

// Icon mapping for recommendations
const iconMap: Record<string, LucideIcon> = {
  Timer,
  Clock,
  Stethoscope,
  Footprints,
  Moon,
  BedDouble,
  Wind,
  CalendarClock,
  ArrowRight,
  Brain,
  Heart,
  AlertTriangle,
  AlertCircle,
  CheckCircle: CheckCircle2,
};

const getRiskColor = (level: string) => {
  switch (level) {
    case "low":
      return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800";
    case "high":
      return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800";
    default:
      return "text-muted-foreground bg-muted";
  }
};

// Subtle indicator colors for detail cards (lighter/softer than main risk bars)
type InsightLevel = "good" | "moderate" | "concern";

const getInsightDotColor = (level: InsightLevel) => {
  switch (level) {
    case "good":
      return "bg-green-300 dark:bg-green-700";
    case "moderate":
      return "bg-amber-300 dark:bg-amber-600";
    case "concern":
      return "bg-red-300 dark:bg-red-600";
  }
};

// Thresholds for each metric
const getHoursSeatedLevel = (hours: number): InsightLevel => {
  if (hours <= 4) return "good";
  if (hours <= 6) return "moderate";
  return "concern";
};

const getStressLevel = (stress: number): InsightLevel => {
  if (stress <= 3) return "good";
  if (stress <= 6) return "moderate";
  return "concern";
};

const getPainIntensityLevel = (intensity: number): InsightLevel => {
  if (intensity <= 3) return "good";
  if (intensity <= 6) return "moderate";
  return "concern";
};

const getScoreLevel = (score: number): InsightLevel => {
  if (score <= 3) return "good";
  if (score <= 6) return "moderate";
  return "concern";
};

const getActivityLevel = (activity: string): InsightLevel => {
  if (activity === "active" || activity === "moderate") return "good";
  if (activity === "light") return "moderate";
  return "concern";
};

const getBreaksLevel = (breaks: string): InsightLevel => {
  if (breaks === "frequently" || breaks === "sometimes") return "good";
  if (breaks === "rarely") return "moderate";
  return "concern"; // never
};

const getSleepLevelInsight = (sleep: string): InsightLevel => {
  if (sleep === "good" || sleep === "excellent") return "good";
  if (sleep === "fair") return "moderate";
  return "concern";
};

const getWorkIntensityLevel = (intensity: string): InsightLevel => {
  if (intensity === "low" || intensity === "moderate") return "good";
  if (intensity === "high") return "moderate";
  return "concern";
};

const getRiskIcon = (level: string) => {
  switch (level) {
    case "low":
      return CheckCircle2;
    case "medium":
      return AlertCircle;
    case "high":
      return AlertTriangle;
    default:
      return AlertCircle;
  }
};

// Spine SVG Component - Realistic anatomical representation
const SpineVisualization = ({ 
  spineAge, 
  realAge, 
  riskLevel,
  language
}: { 
  spineAge: number; 
  realAge: number; 
  riskLevel: string;
  language: string;
}) => {
  const getSpineColor = () => {
    if (riskLevel === "low") return "#22c55e";
    if (riskLevel === "medium") return "#eab308";
    return "#ef4444";
  };

  const getSpineColorLight = () => {
    if (riskLevel === "low") return "#86efac";
    if (riskLevel === "medium") return "#fde047";
    return "#fca5a5";
  };

  const getSpineColorDark = () => {
    if (riskLevel === "low") return "#166534";
    if (riskLevel === "medium") return "#a16207";
    return "#991b1b";
  };

  const getGlowColor = () => {
    if (riskLevel === "low") return "rgba(34, 197, 94, 0.4)";
    if (riskLevel === "medium") return "rgba(234, 179, 8, 0.4)";
    return "rgba(239, 68, 68, 0.4)";
  };

  const ageDiff = spineAge - realAge;
  const getMessage = () => {
    if (language === "es") {
      if (ageDiff <= 0) return "Tu espalda está en excelente forma";
      if (ageDiff <= 5) return "Tu espalda necesita algo de atención";
      if (ageDiff <= 10) return "Tu espalda requiere cuidado prioritario";
      return "Tu espalda necesita atención urgente";
    }
    if (ageDiff <= 0) return "Your spine is in excellent shape";
    if (ageDiff <= 5) return "Your spine needs some attention";
    if (ageDiff <= 10) return "Your spine requires priority care";
    return "Your spine needs urgent attention";
  };

  // Vertebrae data: [yPosition, width, height, spinousProcessLength]
  const vertebrae = [
    { y: 20, w: 32, h: 14, sp: 18 },   // C7 - Cervical
    { y: 42, w: 38, h: 16, sp: 22 },   // T1
    { y: 66, w: 42, h: 18, sp: 24 },   // T4
    { y: 92, w: 46, h: 20, sp: 26 },   // T8
    { y: 120, w: 50, h: 22, sp: 24 },  // T12
    { y: 150, w: 56, h: 24, sp: 20 },  // L2
    { y: 182, w: 60, h: 26, sp: 16 },  // L4
    { y: 216, w: 54, h: 20, sp: 0 },   // S1 - Sacrum
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Background glow */}
        <div 
          className="absolute inset-0 blur-3xl opacity-60 rounded-full scale-150"
          style={{ backgroundColor: getGlowColor() }}
        />
        
        <svg
          width="140"
          height="260"
          viewBox="0 0 140 260"
          className="relative z-10 drop-shadow-lg"
        >
          <defs>
            {/* Gradient for vertebrae */}
            <linearGradient id="vertebraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={getSpineColorLight()} />
              <stop offset="50%" stopColor={getSpineColor()} />
              <stop offset="100%" stopColor={getSpineColorDark()} />
            </linearGradient>
            
            {/* Shadow filter */}
            <filter id="vertebraShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
            </filter>
            
            {/* Inner glow */}
            <filter id="innerGlow">
              <feGaussianBlur stdDeviation="1" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
          
          {/* Spinal canal (background) */}
          <path
            d={`M70,15 Q68,80 70,130 Q72,180 70,220 Q68,240 70,250`}
            stroke={getSpineColorDark()}
            strokeWidth="6"
            fill="none"
            opacity="0.3"
          />
          
          {/* Vertebrae */}
          {vertebrae.map((v, i) => (
            <g key={i} filter="url(#vertebraShadow)" className="transition-all duration-500">
              {/* Vertebral body (main bone) */}
              <ellipse
                cx="70"
                cy={v.y}
                rx={v.w / 2}
                ry={v.h / 2}
                fill="url(#vertebraGradient)"
                className="transition-all duration-500"
              />
              
              {/* Vertebral body highlight */}
              <ellipse
                cx="70"
                cy={v.y - 2}
                rx={v.w / 2 - 4}
                ry={v.h / 2 - 3}
                fill="white"
                opacity="0.25"
              />
              
              {/* Transverse processes (side wings) */}
              {i < 7 && (
                <>
                  <ellipse
                    cx={70 - v.w / 2 - 8}
                    cy={v.y}
                    rx="10"
                    ry="5"
                    fill={getSpineColor()}
                    opacity="0.8"
                    transform={`rotate(-15, ${70 - v.w / 2 - 8}, ${v.y})`}
                  />
                  <ellipse
                    cx={70 + v.w / 2 + 8}
                    cy={v.y}
                    rx="10"
                    ry="5"
                    fill={getSpineColor()}
                    opacity="0.8"
                    transform={`rotate(15, ${70 + v.w / 2 + 8}, ${v.y})`}
                  />
                </>
              )}
              
              {/* Spinous process (back projection) */}
              {v.sp > 0 && (
                <path
                  d={`M70,${v.y + v.h / 2 - 2} L70,${v.y + v.h / 2 + v.sp}`}
                  stroke={getSpineColor()}
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              )}
            </g>
          ))}
          
          {/* Intervertebral discs */}
          {vertebrae.slice(0, -1).map((v, i) => {
            const nextV = vertebrae[i + 1];
            const discY = (v.y + v.h / 2 + nextV.y - nextV.h / 2) / 2;
            const discW = (v.w + nextV.w) / 4;
            return (
              <ellipse
                key={`disc-${i}`}
                cx="70"
                cy={discY}
                rx={discW}
                ry="4"
                fill={getSpineColorDark()}
                opacity="0.5"
                className="transition-all duration-500"
              />
            );
          })}
          
          {/* Sacrum detail */}
          <path
            d="M45,230 Q70,255 95,230"
            fill={getSpineColor()}
            opacity="0.6"
          />
        </svg>
      </div>
      
      <div className="mt-6 text-center">
        <div 
          className="text-6xl font-black tracking-tight" 
          style={{ 
            color: getSpineColor(),
            textShadow: `0 4px 12px ${getGlowColor()}`
          }}
        >
          {spineAge}
        </div>
        <div className="text-lg font-medium text-muted-foreground mt-1">
          {language === "es" ? "años" : "years"}
        </div>
        {ageDiff > 0 && (
          <Badge 
            variant="destructive" 
            className="mt-2"
            data-testid="badge-spine-age-diff"
          >
            <TrendingDown className="h-4 w-4 rotate-180 mr-1" />
            +{ageDiff} {language === "es" ? "años vs tu edad real" : "years vs your real age"}
          </Badge>
        )}
        <p className="text-sm text-muted-foreground mt-3 max-w-xs">
          {getMessage()}
        </p>
      </div>
    </div>
  );
};

export default function Results() {
  const params = useParams<{ id: string }>();
  const { t, language: browserLanguage } = useLanguage();
  const { toast } = useToast();
  const [contactRequested, setContactRequested] = useState(false);

  const { data: assessment, isLoading, error } = useQuery<Assessment>({
    queryKey: ["/api/assessments", params.id],
  });

  const contactMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const res = await apiRequest("POST", "/api/contact-requests", { assessmentId });
      return res.json();
    },
    onSuccess: () => {
      setContactRequested(true);
      toast({
        title: assessmentLanguage === "es" ? "Solicitud enviada" : "Request sent",
        description: assessmentLanguage === "es" 
          ? "Nos pondremos en contacto contigo pronto" 
          : "We'll be in touch with you soon",
      });
    },
    onError: () => {
      toast({
        title: assessmentLanguage === "es" ? "Error" : "Error",
        description: assessmentLanguage === "es" 
          ? "No pudimos enviar tu solicitud. Intenta de nuevo." 
          : "We couldn't send your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Use the language from the assessment (how it was completed), fallback to browser preference during loading
  const assessmentLanguage = assessment?.language || browserLanguage;

  const txt = assessmentLanguage === "es" ? {
    home: "Inicio",
    loading: "Cargando...",
    errorTitle: "Error al cargar resultados",
    errorDesc: "No pudimos encontrar tu evaluación. Por favor, intenta de nuevo.",
    newAssessment: "Nueva Evaluación",
    backHome: "Volver al Inicio",
    globalScore: "Puntuación Global",
    downloadPdf: "Descargar informe en PDF",
    riskProfile: "Tu Perfil de Riesgo",
    riskProfileDesc: "Evaluación segmentada por tipo de factor",
    mechanicalRisk: "Riesgo Mecánico",
    mechanicalDesc: "Postura, horas sentado, pausas de movimiento",
    recoveryRisk: "Riesgo de Recuperación",
    recoveryDesc: "Calidad de sueño, estrés, intensidad laboral",
    psychosocialRisk: "Riesgo Psicosocial",
    psychosocialDesc: "Miedo al movimiento, pensamientos negativos, estado de ánimo",
    workProfile: "Perfil Laboral",
    occupation: "Ocupación",
    hoursSeated: "Horas sentado",
    workStress: "Estrés laboral",
    currentStatus: "Estado Actual",
    activePain: "Dolor activo",
    intensity: "Intensidad",
    zone: "Zona",
    yes: "Sí",
    no: "No",
    psychFactors: "Factores Psicológicos",
    fearMovement: "Miedo al movimiento",
    catastrophizing: "Catastrofización",
    mood: "Estado de ánimo",
    lifeContext: "Contexto de Vida",
    physicalActivity: "Actividad física",
    movementBreaks: "Pausas de movimiento",
    sleepQuality: "Calidad de sueño",
    workIntensity: "Intensidad laboral",
    recommendations: "Recomendaciones Personalizadas",
    recommendationsDesc: "Basadas en tu perfil y factores de riesgo identificados",
    disclaimer: "Aviso importante: Esta es una Evaluación de Riesgo Funcional con fines informativos. No constituye diagnóstico médico ni sustituye la consulta profesional. Si experimentas dolor severo o persistente, consulta con un profesional de salud.",
    personalizedAlert: "Alerta Personalizada",
    riskLabels: { low: "Riesgo Bajo", medium: "Riesgo Moderado", high: "Riesgo Alto", default: "Sin determinar" },
    riskDescriptions: {
      low: "Tu perfil indica un bajo riesgo de desarrollar dolor lumbar crónico. Con buenos hábitos, puedes mantener tu espalda sana.",
      medium: "Tienes factores de riesgo moderados que requieren atención. Implementar cambios en tu rutina puede prevenir problemas mayores.",
      high: "Tu perfil indica un riesgo elevado. Te recomendamos consultar con un profesional de salud y tomar medidas inmediatas.",
    },
    occupationLabels: { office: "Oficina", remote: "Remoto", healthcare: "Salud", education: "Educación", manufacturing: "Industria", retail: "Comercio", other: "Otro" },
    painLocationLabels: { lower: "Zona Lumbar", middle: "Zona Dorsal", upper: "Zona Cervical", multiple: "Múltiples" },
    activityLabels: { sedentary: "Sedentario", light: "Ligero", moderate: "Moderado", active: "Activo" },
    breakLabels: { never: "Nunca", rarely: "Raramente", sometimes: "A veces", frequently: "Frecuente" },
    sleepLabels: { poor: "Mala", fair: "Regular", good: "Buena", excellent: "Excelente" },
    intensityLabels: { low: "Baja", moderate: "Moderada", high: "Alta", very_high: "Muy alta" },
    insights: {
      hoursSeated: {
        good: "Buen equilibrio de tiempo sentado",
        moderate: "Considera levantarte cada hora",
        concern: "Muchas horas sin movimiento aumentan tensión lumbar"
      },
      stress: {
        good: "Nivel de estrés manejable",
        moderate: "El estrés puede tensionar tus músculos",
        concern: "Alto estrés contribuye a dolor muscular crónico"
      },
      painIntensity: {
        good: "Dolor leve, buen pronóstico",
        moderate: "Atención recomendada para evitar que empeore",
        concern: "Dolor significativo que requiere atención"
      },
      noPain: "Sin dolor activo es una buena señal",
      fearMovement: {
        good: "Buena confianza en tu cuerpo",
        moderate: "Un poco de precaución puede limitar tu recuperación",
        concern: "El miedo excesivo puede empeorar el dolor"
      },
      catastrophizing: {
        good: "Mentalidad positiva ante el dolor",
        moderate: "Los pensamientos negativos pueden amplificar sensaciones",
        concern: "Los pensamientos catastrofistas dificultan la recuperación"
      },
      mood: {
        good: "Tu estado de ánimo favorece la recuperación",
        moderate: "El dolor prolongado puede afectar tu energía",
        concern: "Considera hablar con alguien sobre cómo te sientes"
      },
      activity: {
        good: "Excelente nivel de actividad física",
        moderate: "Podrías beneficiarte de más movimiento regular",
        concern: "La falta de movimiento debilita los músculos de soporte"
      },
      breaks: {
        good: "Buen hábito de pausas activas",
        moderate: "Más pausas ayudarían a tu espalda",
        concern: "Tu espalda necesita descansos regulares del sedentarismo"
      },
      sleep: {
        good: "El buen sueño favorece la recuperación muscular",
        moderate: "Mejorar el sueño puede acelerar tu recuperación",
        concern: "El sueño deficiente dificulta la reparación de tejidos"
      },
      workIntensity: {
        good: "Ritmo de trabajo sostenible",
        moderate: "Trabajo intenso puede acumular tensión",
        concern: "La alta exigencia laboral contribuye al dolor crónico"
      }
    },
    spineAge: {
      title: "Edad de tu Espalda",
      realAge: "Tu edad real",
      years: "años",
    },
    planLead: {
      title: "¿Quieres rejuvenecer tu espalda?",
      subtitle: "Nosotros analizamos tu estilo de vida y diseñamos un plan único para ti. Con IA nos adaptamos a tu vida, no al revés.",
      aiPowered: "Diseñado con IA • 100% personalizado",
      features: [
        { icon: "work", text: "Optimización de tu rutina de trabajo y ergonomía" },
        { icon: "food", text: "Nutrición: puntos de mejora y personalización" },
        { icon: "exercise", text: "Entrenamiento adaptado + análisis de composición corporal" },
        { icon: "sleep", text: "Estrategias de sueño reparador" },
        { icon: "stress", text: "Técnicas de manejo de estrés a tu medida" },
      ],
      cta: "Un especialista te contactará para diseñar tu plan con IA",
      contactButton: "Quiero que me contacten",
      contactSuccess: "¡Listo! Nos pondremos en contacto contigo",
      sending: "Enviando...",
    },
  } : {
    home: "Home",
    loading: "Loading...",
    errorTitle: "Error loading results",
    errorDesc: "We couldn't find your assessment. Please try again.",
    newAssessment: "New Assessment",
    backHome: "Back to Home",
    globalScore: "Global Score",
    downloadPdf: "Download PDF report",
    riskProfile: "Your Risk Profile",
    riskProfileDesc: "Segmented assessment by factor type",
    mechanicalRisk: "Mechanical Risk",
    mechanicalDesc: "Posture, hours seated, movement breaks",
    recoveryRisk: "Recovery Risk",
    recoveryDesc: "Sleep quality, stress, work intensity",
    psychosocialRisk: "Psychosocial Risk",
    psychosocialDesc: "Fear of movement, negative thoughts, mood",
    workProfile: "Work Profile",
    occupation: "Occupation",
    hoursSeated: "Hours seated",
    workStress: "Work stress",
    currentStatus: "Current Status",
    activePain: "Active pain",
    intensity: "Intensity",
    zone: "Zone",
    yes: "Yes",
    no: "No",
    psychFactors: "Psychological Factors",
    fearMovement: "Fear of movement",
    catastrophizing: "Catastrophizing",
    mood: "Mood",
    lifeContext: "Life Context",
    physicalActivity: "Physical activity",
    movementBreaks: "Movement breaks",
    sleepQuality: "Sleep quality",
    workIntensity: "Work intensity",
    recommendations: "Personalized Recommendations",
    recommendationsDesc: "Based on your profile and identified risk factors",
    disclaimer: "This is a Functional Risk Assessment for informational purposes. It does not constitute medical diagnosis nor replace professional consultation. If you experience severe or persistent pain, consult a healthcare professional.",
    personalizedAlert: "Personalized Alert",
    riskLabels: { low: "Low Risk", medium: "Moderate Risk", high: "High Risk", default: "Undetermined" },
    riskDescriptions: {
      low: "Your profile indicates a low risk of developing chronic lower back pain. With good habits, you can keep your back healthy.",
      medium: "You have moderate risk factors that require attention. Implementing changes in your routine can prevent bigger problems.",
      high: "Your profile indicates elevated risk. We recommend consulting a health professional and taking immediate action.",
    },
    occupationLabels: { office: "Office", remote: "Remote", healthcare: "Healthcare", education: "Education", manufacturing: "Industry", retail: "Retail", other: "Other" },
    painLocationLabels: { lower: "Lower Back", middle: "Middle Back", upper: "Neck Area", multiple: "Multiple" },
    activityLabels: { sedentary: "Sedentary", light: "Light", moderate: "Moderate", active: "Active" },
    breakLabels: { never: "Never", rarely: "Rarely", sometimes: "Sometimes", frequently: "Frequently" },
    sleepLabels: { poor: "Poor", fair: "Fair", good: "Good", excellent: "Excellent" },
    intensityLabels: { low: "Low", moderate: "Moderate", high: "High", very_high: "Very high" },
    insights: {
      hoursSeated: {
        good: "Good balance of seated time",
        moderate: "Consider getting up every hour",
        concern: "Many hours without movement increase back tension"
      },
      stress: {
        good: "Manageable stress level",
        moderate: "Stress can tighten your muscles",
        concern: "High stress contributes to chronic muscle pain"
      },
      painIntensity: {
        good: "Mild pain, good prognosis",
        moderate: "Attention recommended to prevent worsening",
        concern: "Significant pain requiring attention"
      },
      noPain: "No active pain is a good sign",
      fearMovement: {
        good: "Good confidence in your body",
        moderate: "Some caution may be limiting your recovery",
        concern: "Excessive fear can worsen pain"
      },
      catastrophizing: {
        good: "Positive mindset about pain",
        moderate: "Negative thoughts can amplify sensations",
        concern: "Catastrophic thinking hinders recovery"
      },
      mood: {
        good: "Your mood supports recovery",
        moderate: "Prolonged pain can affect your energy",
        concern: "Consider talking to someone about how you feel"
      },
      activity: {
        good: "Excellent physical activity level",
        moderate: "You could benefit from more regular movement",
        concern: "Lack of movement weakens support muscles"
      },
      breaks: {
        good: "Good habit of active breaks",
        moderate: "More breaks would help your back",
        concern: "Your back needs regular breaks from sitting"
      },
      sleep: {
        good: "Good sleep promotes muscle recovery",
        moderate: "Better sleep could speed up your recovery",
        concern: "Poor sleep hinders tissue repair"
      },
      workIntensity: {
        good: "Sustainable work pace",
        moderate: "Intense work can accumulate tension",
        concern: "High work demands contribute to chronic pain"
      }
    },
    spineAge: {
      title: "Your Spine Age",
      realAge: "Your real age",
      years: "years",
    },
    planLead: {
      title: "Want to rejuvenate your spine?",
      subtitle: "Our AI analyzes your lifestyle and designs a unique plan for you. We adapt to your life, not the other way around.",
      aiPowered: "AI-Powered • 100% Personalized",
      features: [
        { icon: "work", text: "Work routine optimization and ergonomics" },
        { icon: "food", text: "Nutrition: improvement points and personalization" },
        { icon: "exercise", text: "Adapted training + body composition analysis" },
        { icon: "sleep", text: "Restorative sleep strategies" },
        { icon: "stress", text: "Stress management techniques tailored to you" },
      ],
      cta: "A specialist will contact you to design your AI-powered plan",
      contactButton: "I want to be contacted",
      contactSuccess: "Done! We'll be in touch with you",
      sending: "Sending...",
    },
  };

  const getRiskLabel = (level: string) => {
    return txt.riskLabels[level as keyof typeof txt.riskLabels] || txt.riskLabels.default;
  };

  const getRiskDescription = (level: string) => {
    return txt.riskDescriptions[level as keyof typeof txt.riskDescriptions] || "";
  };

  const getOccupationLabel = (val: string | null) => val ? (txt.occupationLabels[val as keyof typeof txt.occupationLabels] || val) : "-";
  const getPainLocationLabel = (val: string | null) => val ? (txt.painLocationLabels[val as keyof typeof txt.painLocationLabels] || val) : "-";
  const getActivityLabel = (val: string | null) => val ? (txt.activityLabels[val as keyof typeof txt.activityLabels] || val) : "-";
  const getBreakLabel = (val: string | null) => val ? (txt.breakLabels[val as keyof typeof txt.breakLabels] || val) : "-";
  const getSleepLabel = (val: string | null) => val ? (txt.sleepLabels[val as keyof typeof txt.sleepLabels] || val) : "-";
  const getIntensityLabel = (val: string | null) => val ? (txt.intensityLabels[val as keyof typeof txt.intensityLabels] || val) : "-";

  // Helper to get insight text based on level
  const getInsightText = (category: keyof typeof txt.insights, level: InsightLevel): string => {
    const insight = txt.insights[category];
    if (typeof insight === "string") return insight;
    return insight[level];
  };

  // Insight row component for detail cards
  const InsightRow = ({ 
    label, 
    value, 
    level, 
    insight,
    testId 
  }: { 
    label: string; 
    value: string; 
    level: InsightLevel; 
    insight: string;
    testId: string;
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", getInsightDotColor(level))} />
          <span className="font-medium" data-testid={testId}>{value}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/70 pl-0">{insight}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-home-loading">
                <Home className="h-4 w-4 mr-2" />
                {txt.home}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Activity className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t.common.appName}</span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="space-y-6" data-testid="loading-skeleton">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4" data-testid="card-error">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold" data-testid="text-error-title">{txt.errorTitle}</h2>
            <p className="text-muted-foreground">{txt.errorDesc}</p>
            <Link href="/assessment">
              <Button data-testid="button-retry-assessment">
                {txt.newAssessment}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskLevel = assessment.riskLevel || "medium";
  const RiskIcon = getRiskIcon(riskLevel);
  const recommendations = (assessment.recommendations as Recommendation[]) || [];
  const mechanicalRisk = assessment.mechanicalRisk || 0;
  const recoveryRisk = assessment.recoveryRisk || 0;
  const psychosocialRisk = assessment.psychosocialRisk || 0;
  const personalizedAlert = assessment.personalizedAlert || "";

  const getRiskBarColor = (score: number) => {
    if (score <= 30) return "bg-green-500";
    if (score <= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-home">
              <Home className="h-4 w-4 mr-2" />
              {txt.home}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">{t.common.appName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Risk Level Card */}
        <Card className={cn("border-2", getRiskColor(riskLevel))} data-testid="card-risk-result">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center mx-auto",
                riskLevel === "low" && "bg-green-100 dark:bg-green-900",
                riskLevel === "medium" && "bg-yellow-100 dark:bg-yellow-900",
                riskLevel === "high" && "bg-red-100 dark:bg-red-900"
              )}>
                <RiskIcon className={cn(
                  "h-10 w-10",
                  riskLevel === "low" && "text-green-600 dark:text-green-400",
                  riskLevel === "medium" && "text-yellow-600 dark:text-yellow-400",
                  riskLevel === "high" && "text-red-600 dark:text-red-400"
                )} />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold" data-testid="text-risk-level">
                  {getRiskLabel(riskLevel)}
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto" data-testid="text-risk-description">
                  {getRiskDescription(riskLevel)}
                </p>
              </div>

              {assessment.totalScore !== null && (
                <Badge variant="secondary" className="text-sm" data-testid="badge-score">
                  {txt.globalScore}: {assessment.totalScore}/100
                </Badge>
              )}
              <div>
                <Button
                  variant="outline"
                  onClick={() => downloadReportPdf(assessment, assessmentLanguage)}
                  data-testid="button-download-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {txt.downloadPdf}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personalized Alert */}
        {personalizedAlert && (
          <Card className="border-primary/30 bg-primary/5" data-testid="card-personalized-alert">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">{txt.personalizedAlert}</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-personalized-alert">
                    {personalizedAlert}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spine Age Visualization */}
        {assessment.age && (
          <Card className="overflow-hidden relative" data-testid="card-spine-age">
            <div className={cn(
              "absolute inset-0 opacity-10 pointer-events-none",
              riskLevel === "low" && "bg-gradient-to-br from-green-500 to-green-700",
              riskLevel === "medium" && "bg-gradient-to-br from-yellow-500 to-orange-500",
              riskLevel === "high" && "bg-gradient-to-br from-red-500 to-red-700"
            )} />
            <CardContent className="pt-8 pb-8 relative">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{txt.spineAge.title}</h2>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <SpineVisualization
                  spineAge={calculateSpineAge(assessment.age, assessment.totalScore || 0, riskLevel)}
                  realAge={assessment.age}
                  riskLevel={riskLevel}
                  language={assessmentLanguage}
                />
                <div className="text-center md:text-left space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{txt.spineAge.realAge}</p>
                    <p className="text-3xl font-bold">{assessment.age} {txt.spineAge.years}</p>
                  </div>
                  {calculateSpineAge(assessment.age, assessment.totalScore || 0, riskLevel) > assessment.age && (
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                      riskLevel === "medium" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                      riskLevel === "high" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}>
                      <TrendingDown className="h-4 w-4" />
                      +{calculateSpineAge(assessment.age, assessment.totalScore || 0, riskLevel) - assessment.age} {txt.spineAge.years}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Segmented Risk Scores */}
        <Card data-testid="card-segmented-risks">
          <CardHeader>
            <CardTitle>{txt.riskProfile}</CardTitle>
            <CardDescription>{txt.riskProfileDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2" data-testid="risk-mechanical">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {txt.mechanicalRisk}
                </span>
                <span className="text-sm font-bold">{mechanicalRisk}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getRiskBarColor(mechanicalRisk))}
                  style={{ width: `${mechanicalRisk}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{txt.mechanicalDesc}</p>
            </div>

            <div className="space-y-2" data-testid="risk-recovery">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  {txt.recoveryRisk}
                </span>
                <span className="text-sm font-bold">{recoveryRisk}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getRiskBarColor(recoveryRisk))}
                  style={{ width: `${recoveryRisk}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{txt.recoveryDesc}</p>
            </div>

            <div className="space-y-2" data-testid="risk-psychosocial">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  {txt.psychosocialRisk}
                </span>
                <span className="text-sm font-bold">{psychosocialRisk}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getRiskBarColor(psychosocialRisk))}
                  style={{ width: `${psychosocialRisk}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{txt.psychosocialDesc}</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card data-testid="card-work-profile">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                {txt.workProfile}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{txt.occupation}</span>
                <span className="font-medium" data-testid="text-occupation">
                  {getOccupationLabel(assessment.occupation)}
                </span>
              </div>
              <InsightRow
                label={txt.hoursSeated}
                value={`${assessment.hoursSeated ?? 0}h/${assessmentLanguage === "es" ? "día" : "day"}`}
                level={getHoursSeatedLevel(assessment.hoursSeated ?? 0)}
                insight={getInsightText("hoursSeated", getHoursSeatedLevel(assessment.hoursSeated ?? 0))}
                testId="text-hours-seated"
              />
              <InsightRow
                label={txt.workStress}
                value={`${assessment.stressLevel ?? 0}/10`}
                level={getStressLevel(assessment.stressLevel ?? 0)}
                insight={getInsightText("stress", getStressLevel(assessment.stressLevel ?? 0))}
                testId="text-stress-level"
              />
            </CardContent>
          </Card>

          <Card data-testid="card-pain-status">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                {txt.currentStatus}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{txt.activePain}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", assessment.hasPain === "yes" ? "bg-amber-300 dark:bg-amber-600" : "bg-green-300 dark:bg-green-700")} />
                    <span className="font-medium" data-testid="text-has-pain">
                      {assessment.hasPain === "yes" ? txt.yes : txt.no}
                    </span>
                  </div>
                </div>
                {assessment.hasPain === "no" && (
                  <p className="text-xs text-muted-foreground/70">{txt.insights.noPain}</p>
                )}
              </div>
              {assessment.hasPain === "yes" && (
                <>
                  <InsightRow
                    label={txt.intensity}
                    value={`${assessment.painIntensity}/10`}
                    level={getPainIntensityLevel(assessment.painIntensity || 0)}
                    insight={getInsightText("painIntensity", getPainIntensityLevel(assessment.painIntensity || 0))}
                    testId="text-pain-intensity"
                  />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{txt.zone}</span>
                    <span className="font-medium" data-testid="text-pain-location">
                      {getPainLocationLabel(assessment.painLocation)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-psychological-factors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                {txt.psychFactors}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <InsightRow
                label={txt.fearMovement}
                value={`${assessment.fearMovement ?? 0}/10`}
                level={getScoreLevel(assessment.fearMovement ?? 0)}
                insight={getInsightText("fearMovement", getScoreLevel(assessment.fearMovement ?? 0))}
                testId="text-fear-movement"
              />
              <InsightRow
                label={txt.catastrophizing}
                value={`${assessment.catastrophizing ?? 0}/10`}
                level={getScoreLevel(assessment.catastrophizing ?? 0)}
                insight={getInsightText("catastrophizing", getScoreLevel(assessment.catastrophizing ?? 0))}
                testId="text-catastrophizing"
              />
              <InsightRow
                label={txt.mood}
                value={`${assessment.depression ?? 0}/10`}
                level={getScoreLevel(assessment.depression ?? 0)}
                insight={getInsightText("mood", getScoreLevel(assessment.depression ?? 0))}
                testId="text-depression"
              />
            </CardContent>
          </Card>

          <Card data-testid="card-lifestyle">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                {txt.lifeContext}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <InsightRow
                label={txt.physicalActivity}
                value={getActivityLabel(assessment.physicalActivity)}
                level={getActivityLevel(assessment.physicalActivity || "sedentary")}
                insight={getInsightText("activity", getActivityLevel(assessment.physicalActivity || "sedentary"))}
                testId="text-physical-activity"
              />
              <InsightRow
                label={txt.movementBreaks}
                value={getBreakLabel(assessment.movementBreaks)}
                level={getBreaksLevel(assessment.movementBreaks || "never")}
                insight={getInsightText("breaks", getBreaksLevel(assessment.movementBreaks || "never"))}
                testId="text-movement-breaks"
              />
              <InsightRow
                label={txt.sleepQuality}
                value={getSleepLabel(assessment.sleepQuality)}
                level={getSleepLevelInsight(assessment.sleepQuality || "poor")}
                insight={getInsightText("sleep", getSleepLevelInsight(assessment.sleepQuality || "poor"))}
                testId="text-sleep-quality"
              />
              <InsightRow
                label={txt.workIntensity}
                value={getIntensityLabel(assessment.workIntensity)}
                level={getWorkIntensityLevel(assessment.workIntensity || "moderate")}
                insight={getInsightText("workIntensity", getWorkIntensityLevel(assessment.workIntensity || "moderate"))}
                testId="text-work-intensity"
              />
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-4" data-testid="section-recommendations">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">{txt.recommendations}</h2>
            </div>
            <p className="text-muted-foreground text-sm">{txt.recommendationsDesc}</p>
            
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const IconComponent = iconMap[rec.icon] || CheckCircle2;
                const getCategoryColor = (category: string) => {
                  switch (category) {
                    case "mechanical":
                      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
                    case "recovery":
                      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
                    case "psychosocial":
                      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
                    default:
                      return "bg-muted text-muted-foreground";
                  }
                };
                const getCategoryLabel = (category: string) => {
                  if (assessmentLanguage === "es") {
                    switch (category) {
                      case "mechanical": return "Postural";
                      case "recovery": return "Recuperación";
                      case "psychosocial": return "Bienestar";
                      default: return category;
                    }
                  }
                  switch (category) {
                    case "mechanical": return "Postural";
                    case "recovery": return "Recovery";
                    case "psychosocial": return "Wellbeing";
                    default: return category;
                  }
                };
                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case "high":
                      return "border-l-red-500";
                    case "medium":
                      return "border-l-yellow-500";
                    case "low":
                      return "border-l-green-500";
                    default:
                      return "border-l-muted";
                  }
                };
                
                return (
                  <Card 
                    key={rec.id} 
                    className={cn("border-l-4", getPriorityColor(rec.priority))}
                    data-testid={`recommendation-${index}`}
                  >
                    <CardContent className="pt-5 pb-5">
                      <div className="flex gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0",
                          getCategoryColor(rec.category)
                        )}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-base">{rec.title}</h3>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getCategoryColor(rec.category))}
                            >
                              {getCategoryLabel(rec.category)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{rec.action}</p>
                          <div className="pt-2 border-t border-border mt-2">
                            <p className="text-xs text-muted-foreground italic">
                              {assessmentLanguage === "es" ? "¿Por qué?" : "Why?"} {rec.rationale}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Plan Lead Form - Marketing Section */}
        <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10" data-testid="card-plan-lead">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-3">
                <Badge variant="outline" data-testid="badge-ai-powered">
                  {txt.planLead.aiPowered}
                </Badge>
                <h2 className="text-2xl font-bold" data-testid="text-plan-title">{txt.planLead.title}</h2>
                <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-plan-subtitle">{txt.planLead.subtitle}</p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Briefcase className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{txt.planLead.features[0].text}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Apple className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{txt.planLead.features[1].text}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Dumbbell className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{txt.planLead.features[2].text}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Bed className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{txt.planLead.features[3].text}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 sm:col-span-2 md:col-span-1">
                  <Brain className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{txt.planLead.features[4].text}</span>
                </div>
              </div>

              <p className="text-sm font-medium text-primary">{txt.planLead.cta}</p>

              {contactRequested ? (
                <div className="flex items-center justify-center gap-2 py-6 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-medium">{txt.planLead.contactSuccess}</span>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full max-w-md mx-auto"
                  disabled={contactMutation.isPending}
                  onClick={() => contactMutation.mutate(assessment.id)}
                  data-testid="button-contact-request"
                >
                  {contactMutation.isPending ? (
                    <span className="animate-pulse">{txt.planLead.sending}</span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {txt.planLead.contactButton}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-muted/30 border-muted" data-testid="card-disclaimer">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>{assessmentLanguage === "es" ? "Aviso importante:" : "Important notice:"}</strong> {txt.disclaimer}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/assessment">
            <Button variant="outline" data-testid="button-new-assessment">
              {txt.newAssessment}
            </Button>
          </Link>
          <Link href="/">
            <Button data-testid="button-back-home">
              {txt.backHome}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
