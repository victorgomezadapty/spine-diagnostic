import { saveReport } from "@/lib/my-reports";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressIndicator } from "@/components/assessment/progress-indicator";
import { PainScale } from "@/components/assessment/pain-scale";
import { OptionCards } from "@/components/assessment/option-cards";
import { YesNoToggle } from "@/components/assessment/yes-no-toggle";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/language-selector";
import { 
  ArrowLeft, 
  ArrowRight, 
  Activity,
  Briefcase,
  Monitor,
  Stethoscope,
  GraduationCap,
  Factory,
  Store,
  MoreHorizontal,
  Armchair,
  Footprints,
  Bike,
  Dumbbell,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import type { InsertAssessment } from "@shared/schema";

const STEP_LABELS = ["Perfil", "Dolor", "Factores", "Estilo", "Contacto"];
const TOTAL_STEPS = 5;

const OCCUPATION_OPTIONS = [
  { value: "office", label: "Oficina", description: "Trabajo de escritorio", icon: Monitor },
  { value: "remote", label: "Remoto", description: "Trabajo desde casa", icon: Briefcase },
  { value: "healthcare", label: "Salud", description: "Médico, enfermero, etc.", icon: Stethoscope },
  { value: "education", label: "Educación", description: "Profesor, formador", icon: GraduationCap },
  { value: "manufacturing", label: "Industria", description: "Manufactura, producción", icon: Factory },
  { value: "retail", label: "Comercio", description: "Ventas, atención al cliente", icon: Store },
  { value: "other", label: "Otro", description: "Otra ocupación", icon: MoreHorizontal },
];

const HOURS_OPTIONS = [
  { value: "0-2", label: "0-2 horas", description: "Mayormente de pie" },
  { value: "3-5", label: "3-5 horas", description: "Tiempo moderado" },
  { value: "6-8", label: "6-8 horas", description: "Jornada sentado" },
  { value: "9+", label: "9+ horas", description: "Jornadas largas" },
];

const PAIN_DURATION_OPTIONS = [
  { value: "less_week", label: "Menos de 1 semana", description: "Dolor reciente" },
  { value: "1_4_weeks", label: "1-4 semanas", description: "Dolor subagudo" },
  { value: "1_3_months", label: "1-3 meses", description: "Dolor persistente" },
  { value: "more_3_months", label: "Más de 3 meses", description: "Dolor crónico" },
];

const PAIN_LOCATION_OPTIONS = [
  { value: "lower", label: "Zona Lumbar", description: "Parte baja de la espalda" },
  { value: "middle", label: "Zona Dorsal", description: "Parte media de la espalda" },
  { value: "upper", label: "Zona Cervical", description: "Cuello y hombros" },
  { value: "multiple", label: "Múltiples zonas", description: "Varias áreas afectadas" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentario", description: "Sin ejercicio regular", icon: Armchair },
  { value: "light", label: "Ligero", description: "Caminar, estiramientos", icon: Footprints },
  { value: "moderate", label: "Moderado", description: "2-3 veces por semana", icon: Bike },
  { value: "active", label: "Activo", description: "4+ veces por semana", icon: Dumbbell },
];

const MOVEMENT_BREAKS_OPTIONS = [
  { value: "never", label: "Nunca", description: "Sin pausas de movimiento" },
  { value: "rarely", label: "Raramente", description: "1-2 veces al día" },
  { value: "sometimes", label: "A veces", description: "Cada 2-3 horas" },
  { value: "frequently", label: "Frecuente", description: "Cada hora o más" },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: "poor", label: "Mala", description: "Duermo mal, me despierto cansado" },
  { value: "fair", label: "Regular", description: "Descanso a medias" },
  { value: "good", label: "Buena", description: "Descanso bien" },
  { value: "excellent", label: "Excelente", description: "Duermo profundamente" },
];

const WORK_INTENSITY_OPTIONS = [
  { value: "low", label: "Baja", description: "Pocas reuniones" },
  { value: "moderate", label: "Moderada", description: "Carga normal" },
  { value: "high", label: "Alta", description: "Muchos plazos" },
  { value: "very_high", label: "Muy alta", description: "Estrés constante" },
];

interface FormData {
  // Demographics
  age: number;
  occupation: string;
  hoursSeated: number;
  // Pain status
  hasPain: "yes" | "no";
  painIntensity: number;
  painDuration: string;
  painLocation: string;
  // Risk factors
  legPain: "yes" | "no" | undefined;
  shoulderNeckPain: "yes" | "no" | undefined;
  fearMovement: number;
  catastrophizing: number;
  depression: number;
  // Lifestyle
  stressLevel: number;
  physicalActivity: string;
  movementBreaks: string;
  sleepQuality: string;
  workIntensity: string;
  // Contact
  name: string;
  email: string;
  phone: string;
  country: string;
}

export default function Assessment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);

  const STEP_LABELS_I18N = language === "es" 
    ? ["Perfil", "Dolor", "Factores", "Estilo", "Contacto"]
    : ["Profile", "Pain", "Factors", "Lifestyle", "Contact"];

  const txt = language === "es" ? {
    age: "Edad",
    agePlaceholder: "Ej: 35",
    occupation: "Tipo de ocupación",
    occupationDesc: "Selecciona el tipo de trabajo que realizas",
    hoursSeated: "Horas sentado al día",
    hoursSeatedDesc: "En promedio, cuántas horas pasas sentado durante tu jornada laboral",
    hasPain: "¿Tienes dolor de espalda actualmente?",
    hasPainDesc: "Incluye cualquier molestia, rigidez o dolor",
    painIntensity: "Intensidad del dolor",
    painIntensityDesc: "En una escala del 0 al 10, ¿cuánto te duele ahora mismo?",
    painDuration: "Duración del dolor",
    painDurationDesc: "¿Desde cuándo tienes este dolor?",
    painLocation: "Localización del dolor",
    painLocationDesc: "¿Dónde sientes el dolor principalmente?",
    riskFactorsInfo: "Las siguientes preguntas evalúan factores psicosociales que la investigación ha identificado como predictores importantes del dolor crónico de espalda.",
    riskFactorsInfoNoPain: "Las siguientes preguntas evalúan factores de riesgo que pueden predecir problemas de espalda en el futuro.",
    legPain: "¿El dolor se extiende a la pierna?",
    legPainDesc: "Dolor que baja por la pierna (ciática)",
    shoulderNeckPain: "¿También tienes dolor en cuello u hombros?",
    shoulderNeckPainDesc: "Dolor adicional en la zona cervical",
    fearMovement: "Miedo al movimiento",
    fearMovementDesc: "¿Cuánto miedo tienes de que el movimiento empeore tu dolor?",
    fearMovementNoPain: "Miedo al movimiento",
    fearMovementNoPainDesc: "¿Tienes miedo de hacer ciertos movimientos porque piensas que te puede doler la espalda?",
    fearLeft: "Sin miedo",
    fearRight: "Mucho miedo",
    negativeThoughts: "Pensamientos negativos",
    negativeThoughtsDesc: "¿Con qué frecuencia piensas que el dolor nunca mejorará?",
    negativeThoughtsNoPain: "Preocupación por dolor futuro",
    negativeThoughtsNoPainDesc: "¿Con qué frecuencia piensas que te va a doler la espalda o que volverá un dolor que tuviste?",
    never: "Nunca",
    always: "Siempre",
    mood: "Estado de ánimo",
    moodDesc: "¿Con qué frecuencia te sientes desanimado o sin esperanza?",
    moodNoPain: "Estado de ánimo",
    moodNoPainDesc: "¿Con qué frecuencia te sientes desanimado o sin energía?",
    rarely: "Raramente",
    often: "A menudo",
    stressLevel: "Nivel de estrés",
    stressLevelDesc: "¿Cuánto estrés experimentas normalmente?",
    lowStress: "Bajo estrés",
    highStress: "Alto estrés",
    physicalActivity: "Actividad física",
    physicalActivityDesc: "¿Cuánto ejercicio realizas habitualmente?",
    movementBreaks: "Pausas de movimiento",
    movementBreaksDesc: "¿Cada cuánto te levantas durante la jornada laboral?",
    sleepQuality: "Calidad del sueño",
    sleepQualityDesc: "¿Cómo has dormido últimamente?",
    workIntensity: "Intensidad de tu jornada laboral",
    workIntensityDesc: "¿Cuánta presión/reuniones tuviste ayer?",
    name: "Nombre completo",
    namePlaceholder: "Tu nombre",
    email: "Correo electrónico",
    emailPlaceholder: "tu@email.com",
    phone: "WhatsApp / Teléfono",
    phonePlaceholder: "+34 600 000 000",
    contactGateInfo: "Para ver tus resultados necesitamos tus datos de contacto. Te enviaremos el informe completo y te contactaremos para diseñar tu plan personalizado.",
    emailNote: "Recibirás el informe con tus resultados y recomendaciones personalizadas.",
    country: "País",
    countryPlaceholder: "Selecciona tu país",
    back: "Atrás",
    next: "Continuar",
    submit: "Ver Resultados",
    step: "Paso",
    of: "de",
    yes: "Sí",
    no: "No",
  } : {
    age: "Age",
    agePlaceholder: "E.g.: 35",
    occupation: "Type of occupation",
    occupationDesc: "Select the type of work you do",
    hoursSeated: "Hours seated per day",
    hoursSeatedDesc: "On average, how many hours do you spend sitting during your workday",
    hasPain: "Do you currently have back pain?",
    hasPainDesc: "Include any discomfort, stiffness, or pain",
    painIntensity: "Pain intensity",
    painIntensityDesc: "On a scale of 0 to 10, how much does it hurt right now?",
    painDuration: "Pain duration",
    painDurationDesc: "How long have you had this pain?",
    painLocation: "Pain location",
    painLocationDesc: "Where do you mainly feel the pain?",
    riskFactorsInfo: "The following questions assess psychosocial factors that research has identified as important predictors of chronic back pain.",
    riskFactorsInfoNoPain: "The following questions evaluate risk factors that can predict future back problems.",
    legPain: "Does the pain extend to your leg?",
    legPainDesc: "Pain that goes down the leg (sciatica)",
    shoulderNeckPain: "Do you also have neck or shoulder pain?",
    shoulderNeckPainDesc: "Additional pain in the cervical area",
    fearMovement: "Fear of movement",
    fearMovementDesc: "How afraid are you that movement will worsen your pain?",
    fearMovementNoPain: "Fear of movement",
    fearMovementNoPainDesc: "Are you afraid to do certain movements because you think they might hurt your back?",
    fearLeft: "No fear",
    fearRight: "Very afraid",
    negativeThoughts: "Negative thoughts",
    negativeThoughtsDesc: "How often do you think the pain will never improve?",
    negativeThoughtsNoPain: "Worry about future pain",
    negativeThoughtsNoPainDesc: "How often do you think you will get back pain or that a previous pain will return?",
    never: "Never",
    always: "Always",
    mood: "Mood",
    moodDesc: "How often do you feel down or hopeless?",
    moodNoPain: "Mood",
    moodNoPainDesc: "How often do you feel down or lacking energy?",
    rarely: "Rarely",
    often: "Often",
    stressLevel: "Stress level",
    stressLevelDesc: "How much stress do you normally experience?",
    lowStress: "Low stress",
    highStress: "High stress",
    physicalActivity: "Physical activity",
    physicalActivityDesc: "How much exercise do you usually do?",
    movementBreaks: "Movement breaks",
    movementBreaksDesc: "How often do you get up during your workday?",
    sleepQuality: "Sleep quality",
    sleepQualityDesc: "How have you been sleeping lately?",
    workIntensity: "Work intensity",
    workIntensityDesc: "How much pressure/meetings did you have yesterday?",
    name: "Full name",
    namePlaceholder: "Your name",
    email: "Email address",
    emailPlaceholder: "your@email.com",
    phone: "WhatsApp / Phone",
    phonePlaceholder: "+1 600 000 000",
    contactGateInfo: "To view your results we need your contact details. We'll send you the full report and reach out to design your personalized plan.",
    emailNote: "You'll receive the report with your results and personalized recommendations.",
    country: "Country",
    countryPlaceholder: "Select your country",
    back: "Back",
    next: "Continue",
    submit: "View Results",
    step: "Step",
    of: "of",
    yes: "Yes",
    no: "No",
  };

  const OCCUPATION_OPTIONS_I18N = language === "es" ? [
    { value: "office", label: "Oficina", description: "Trabajo de escritorio", icon: Monitor },
    { value: "remote", label: "Remoto", description: "Trabajo desde casa", icon: Briefcase },
    { value: "healthcare", label: "Salud", description: "Médico, enfermero, etc.", icon: Stethoscope },
    { value: "education", label: "Educación", description: "Profesor, formador", icon: GraduationCap },
    { value: "manufacturing", label: "Industria", description: "Manufactura, producción", icon: Factory },
    { value: "retail", label: "Comercio", description: "Ventas, atención", icon: Store },
    { value: "other", label: "Otro", description: "Otra ocupación", icon: MoreHorizontal },
  ] : [
    { value: "office", label: "Office", description: "Desk work", icon: Monitor },
    { value: "remote", label: "Remote", description: "Work from home", icon: Briefcase },
    { value: "healthcare", label: "Healthcare", description: "Doctor, nurse, etc.", icon: Stethoscope },
    { value: "education", label: "Education", description: "Teacher, trainer", icon: GraduationCap },
    { value: "manufacturing", label: "Industry", description: "Manufacturing", icon: Factory },
    { value: "retail", label: "Retail", description: "Sales, service", icon: Store },
    { value: "other", label: "Other", description: "Other occupation", icon: MoreHorizontal },
  ];

  const HOURS_OPTIONS_I18N = language === "es" ? [
    { value: "0-2", label: "0-2 horas", description: "De pie" },
    { value: "3-5", label: "3-5 horas", description: "Moderado" },
    { value: "6-8", label: "6-8 horas", description: "Sentado" },
    { value: "9+", label: "9+ horas", description: "Mucho" },
  ] : [
    { value: "0-2", label: "0-2 hours", description: "Standing" },
    { value: "3-5", label: "3-5 hours", description: "Moderate" },
    { value: "6-8", label: "6-8 hours", description: "Seated" },
    { value: "9+", label: "9+ hours", description: "Long" },
  ];

  const PAIN_DURATION_OPTIONS_I18N = language === "es" ? [
    { value: "less_week", label: "Menos de 1 semana", description: "Reciente" },
    { value: "1_4_weeks", label: "1-4 semanas", description: "Subagudo" },
    { value: "1_3_months", label: "1-3 meses", description: "Persistente" },
    { value: "more_3_months", label: "Más de 3 meses", description: "Crónico" },
  ] : [
    { value: "less_week", label: "Less than 1 week", description: "Recent" },
    { value: "1_4_weeks", label: "1-4 weeks", description: "Subacute" },
    { value: "1_3_months", label: "1-3 months", description: "Persistent" },
    { value: "more_3_months", label: "More than 3 months", description: "Chronic" },
  ];

  const PAIN_LOCATION_OPTIONS_I18N = language === "es" ? [
    { value: "lower", label: "Zona Lumbar", description: "Parte baja" },
    { value: "middle", label: "Zona Dorsal", description: "Parte media" },
    { value: "upper", label: "Zona Cervical", description: "Cuello" },
    { value: "multiple", label: "Múltiples zonas", description: "Varias áreas" },
  ] : [
    { value: "lower", label: "Lower Back", description: "Lower part" },
    { value: "middle", label: "Middle Back", description: "Middle part" },
    { value: "upper", label: "Neck Area", description: "Neck" },
    { value: "multiple", label: "Multiple areas", description: "Several areas" },
  ];

  const ACTIVITY_OPTIONS_I18N = language === "es" ? [
    { value: "sedentary", label: "Sedentario", description: "Sin ejercicio", icon: Armchair },
    { value: "light", label: "Ligero", description: "Caminar", icon: Footprints },
    { value: "moderate", label: "Moderado", description: "2-3 veces/sem", icon: Bike },
    { value: "active", label: "Activo", description: "4+ veces/sem", icon: Dumbbell },
  ] : [
    { value: "sedentary", label: "Sedentary", description: "No exercise", icon: Armchair },
    { value: "light", label: "Light", description: "Walking", icon: Footprints },
    { value: "moderate", label: "Moderate", description: "2-3 times/wk", icon: Bike },
    { value: "active", label: "Active", description: "4+ times/wk", icon: Dumbbell },
  ];

  const MOVEMENT_BREAKS_OPTIONS_I18N = language === "es" ? [
    { value: "never", label: "Nunca", description: "Sin pausas" },
    { value: "rarely", label: "Raramente", description: "1-2 veces/día" },
    { value: "sometimes", label: "A veces", description: "Cada 2-3 horas" },
    { value: "frequently", label: "Frecuente", description: "Cada hora" },
  ] : [
    { value: "never", label: "Never", description: "No breaks" },
    { value: "rarely", label: "Rarely", description: "1-2 times/day" },
    { value: "sometimes", label: "Sometimes", description: "Every 2-3 hrs" },
    { value: "frequently", label: "Frequently", description: "Every hour" },
  ];

  const SLEEP_QUALITY_OPTIONS_I18N = language === "es" ? [
    { value: "poor", label: "Mala", description: "Me despierto cansado" },
    { value: "fair", label: "Regular", description: "Descanso a medias" },
    { value: "good", label: "Buena", description: "Descanso bien" },
    { value: "excellent", label: "Excelente", description: "Duermo profundo" },
  ] : [
    { value: "poor", label: "Poor", description: "Wake up tired" },
    { value: "fair", label: "Fair", description: "Partial rest" },
    { value: "good", label: "Good", description: "Rest well" },
    { value: "excellent", label: "Excellent", description: "Sleep deeply" },
  ];

  const WORK_INTENSITY_OPTIONS_I18N = language === "es" ? [
    { value: "low", label: "Baja", description: "Pocas reuniones" },
    { value: "moderate", label: "Moderada", description: "Carga normal" },
    { value: "high", label: "Alta", description: "Muchos plazos" },
    { value: "very_high", label: "Muy alta", description: "Estrés constante" },
  ] : [
    { value: "low", label: "Low", description: "Few meetings" },
    { value: "moderate", label: "Moderate", description: "Normal load" },
    { value: "high", label: "High", description: "Many deadlines" },
    { value: "very_high", label: "Very high", description: "Constant stress" },
  ];
  const [formData, setFormData] = useState<FormData>({
    age: 0,
    occupation: "",
    hoursSeated: 6,
    hasPain: "yes",
    painIntensity: 5,
    painDuration: "",
    painLocation: "",
    legPain: undefined,
    shoulderNeckPain: undefined,
    fearMovement: 3,
    catastrophizing: 3,
    depression: 2,
    stressLevel: 5,
    physicalActivity: "",
    movementBreaks: "",
    sleepQuality: "",
    workIntensity: "",
    name: "",
    email: "",
    phone: "",
    country: "",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertAssessment) => {
      const response = await apiRequest("POST", "/api/assessments", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Calculate spine age (same formula as results page)
      const riskLevel = data.riskLevel || "low";
      const totalScore = data.totalScore || 0;
      const realAge = formData.age;
      let spineAge: number;
      if (riskLevel === "low") {
        spineAge = Math.max(18, realAge - Math.floor((100 - totalScore) / 20));
      } else if (riskLevel === "medium") {
        spineAge = realAge + 5 + Math.floor(totalScore / 20);
      } else {
        spineAge = realAge + 10 + Math.floor(totalScore / 10);
      }

      // Fire-and-forget: create plan lead (triggers Google Sheet sync + admin email)
      if (formData.name && formData.email) {
        apiRequest("POST", "/api/plan-leads", {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          country: formData.country || undefined,
          assessmentId: data.id,
          spineAge,
          realAge,
          riskLevel,
        }).catch((err) => console.error("Failed to create plan lead:", err));
      }

      saveReport({ id: data.id, createdAt: new Date().toISOString(), riskLevel, totalScore });
      navigate(`/results/${data.id}?leadCaptured=true`);
    },
    onError: (error: Error) => {
      console.error("Assessment submission error:", error);
      toast({
        title: "Error",
        description: language === "es" 
          ? "No se pudo procesar la evaluación. Inténtalo de nuevo."
          : "Could not process the assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const hoursToNumber = (hours: string): number => {
    const map: Record<string, number> = {
      "0-2": 1,
      "3-5": 4,
      "6-8": 7,
      "9+": 10,
    };
    return map[hours] || 6;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.age > 0 && formData.occupation && formData.hoursSeated >= 0;
      case 2:
        if (formData.hasPain === "no") return true;
        return formData.painDuration && formData.painLocation;
      case 3:
        if (formData.hasPain === "no") return true;
        return formData.legPain !== undefined && formData.shoulderNeckPain !== undefined;
      case 4:
        return formData.physicalActivity && formData.movementBreaks && formData.sleepQuality && formData.workIntensity;
      case 5: {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
        return formData.name.trim().length >= 2 && emailValid;
      }
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Submit
      const assessmentData: InsertAssessment = {
        email: formData.email || null,
        age: formData.age,
        occupation: formData.occupation,
        hoursSeated: formData.hoursSeated,
        hasPain: formData.hasPain,
        painIntensity: formData.hasPain === "yes" ? formData.painIntensity : 0,
        painDuration: formData.hasPain === "yes" ? formData.painDuration : null,
        painLocation: formData.hasPain === "yes" ? formData.painLocation : null,
        legPain: formData.hasPain === "yes" ? formData.legPain! : "no",
        shoulderNeckPain: formData.hasPain === "yes" ? formData.shoulderNeckPain! : "no",
        fearMovement: formData.fearMovement,
        catastrophizing: formData.catastrophizing,
        depression: formData.depression,
        stressLevel: formData.stressLevel,
        physicalActivity: formData.physicalActivity,
        movementBreaks: formData.movementBreaks || null,
        sleepQuality: formData.sleepQuality || null,
        workIntensity: formData.workIntensity || null,
        language: language,
      };
      submitMutation.mutate(assessmentData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="age" className="text-sm font-medium">
                {txt.age}
              </Label>
              <Input
                id="age"
                type="number"
                min={18}
                max={100}
                value={formData.age === 0 ? "" : formData.age}
                onChange={(e) => updateField("age", parseInt(e.target.value) || 0)}
                placeholder={txt.agePlaceholder}
                className="text-lg h-12"
                data-testid="input-age"
              />
            </div>

            <OptionCards
              label={txt.occupation}
              description={txt.occupationDesc}
              options={OCCUPATION_OPTIONS_I18N}
              value={formData.occupation}
              onChange={(value) => updateField("occupation", value)}
              columns={3}
            />

            <OptionCards
              label={txt.hoursSeated}
              description={txt.hoursSeatedDesc}
              options={HOURS_OPTIONS_I18N}
              value={HOURS_OPTIONS_I18N.find(o => hoursToNumber(o.value) === formData.hoursSeated)?.value || "6-8"}
              onChange={(value) => updateField("hoursSeated", hoursToNumber(value))}
              columns={4}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <YesNoToggle
              label={txt.hasPain}
              description={txt.hasPainDesc}
              value={formData.hasPain}
              onChange={(value) => updateField("hasPain", value)}
              yesLabel={txt.yes}
              noLabel={txt.no}
            />

            {formData.hasPain === "yes" && (
              <>
                <PainScale
                  label={txt.painIntensity}
                  description={txt.painIntensityDesc}
                  value={formData.painIntensity}
                  onChange={(value) => updateField("painIntensity", value)}
                />

                <OptionCards
                  label={txt.painDuration}
                  description={txt.painDurationDesc}
                  options={PAIN_DURATION_OPTIONS_I18N}
                  value={formData.painDuration}
                  onChange={(value) => updateField("painDuration", value)}
                  columns={2}
                />

                <OptionCards
                  label={txt.painLocation}
                  description={txt.painLocationDesc}
                  options={PAIN_LOCATION_OPTIONS_I18N}
                  value={formData.painLocation}
                  onChange={(value) => updateField("painLocation", value)}
                  columns={2}
                />
              </>
            )}
          </div>
        );

      case 3:
        const hasPainActive = formData.hasPain === "yes";
        return (
          <div className="space-y-8">
            <div className="p-4 bg-muted/50 rounded-lg" data-testid="info-risk-factors">
              <p className="text-sm text-muted-foreground">
                {hasPainActive ? txt.riskFactorsInfo : txt.riskFactorsInfoNoPain}
              </p>
            </div>

            {hasPainActive && (
              <>
                <YesNoToggle
                  label={txt.legPain}
                  description={txt.legPainDesc}
                  value={formData.legPain}
                  onChange={(value) => updateField("legPain", value)}
                  yesLabel={txt.yes}
                  noLabel={txt.no}
                  required
                />

                <YesNoToggle
                  label={txt.shoulderNeckPain}
                  description={txt.shoulderNeckPainDesc}
                  value={formData.shoulderNeckPain}
                  onChange={(value) => updateField("shoulderNeckPain", value)}
                  yesLabel={txt.yes}
                  noLabel={txt.no}
                  required
                />
              </>
            )}

            <PainScale
              label={hasPainActive ? txt.fearMovement : txt.fearMovementNoPain}
              description={hasPainActive ? txt.fearMovementDesc : txt.fearMovementNoPainDesc}
              value={formData.fearMovement}
              onChange={(value) => updateField("fearMovement", value)}
              leftLabel={txt.fearLeft}
              rightLabel={txt.fearRight}
            />

            <PainScale
              label={hasPainActive ? txt.negativeThoughts : txt.negativeThoughtsNoPain}
              description={hasPainActive ? txt.negativeThoughtsDesc : txt.negativeThoughtsNoPainDesc}
              value={formData.catastrophizing}
              onChange={(value) => updateField("catastrophizing", value)}
              leftLabel={txt.never}
              rightLabel={txt.always}
            />

            <PainScale
              label={hasPainActive ? txt.mood : txt.moodNoPain}
              description={hasPainActive ? txt.moodDesc : txt.moodNoPainDesc}
              value={formData.depression}
              onChange={(value) => updateField("depression", value)}
              leftLabel={txt.rarely}
              rightLabel={txt.often}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <OptionCards
              label={txt.movementBreaks}
              description={txt.movementBreaksDesc}
              options={MOVEMENT_BREAKS_OPTIONS_I18N}
              value={formData.movementBreaks}
              onChange={(value) => updateField("movementBreaks", value)}
              columns={4}
            />

            <OptionCards
              label={txt.sleepQuality}
              description={txt.sleepQualityDesc}
              options={SLEEP_QUALITY_OPTIONS_I18N}
              value={formData.sleepQuality}
              onChange={(value) => updateField("sleepQuality", value)}
              columns={4}
            />

            <OptionCards
              label={txt.workIntensity}
              description={txt.workIntensityDesc}
              options={WORK_INTENSITY_OPTIONS_I18N}
              value={formData.workIntensity}
              onChange={(value) => updateField("workIntensity", value)}
              columns={4}
            />

            <PainScale
              label={txt.stressLevel}
              description={txt.stressLevelDesc}
              value={formData.stressLevel}
              onChange={(value) => updateField("stressLevel", value)}
              leftLabel={txt.lowStress}
              rightLabel={txt.highStress}
            />

            <OptionCards
              label={txt.physicalActivity}
              description={txt.physicalActivityDesc}
              options={ACTIVITY_OPTIONS_I18N}
              value={formData.physicalActivity}
              onChange={(value) => updateField("physicalActivity", value)}
              columns={4}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm">
                {txt.contactGateInfo}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name" className="text-sm font-medium">
                  {txt.name} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-name"
                  type="text"
                  placeholder={txt.namePlaceholder}
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="text-lg h-12"
                  data-testid="input-name"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-sm font-medium">
                  {txt.email} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder={txt.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="text-lg h-12"
                  data-testid="input-email"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone" className="text-sm font-medium">
                  {txt.phone}
                </Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder={txt.phonePlaceholder}
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="text-lg h-12"
                  data-testid="input-phone"
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-country" className="text-sm font-medium">
                  {txt.country}
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => updateField("country", value)}
                >
                  <SelectTrigger
                    id="contact-country"
                    className="text-lg h-12"
                    data-testid="select-country"
                  >
                    <SelectValue placeholder={txt.countryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="México">México</SelectItem>
                    <SelectItem value="España">España</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="Other">{language === "es" ? "Otro" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">
                {txt.emailNote}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = language === "es" 
    ? ["Perfil Profesional", "Estado del Dolor", "Factores de Riesgo", "Estilo de Vida", "Contacto"]
    : ["Professional Profile", "Pain Status", "Risk Factors", "Lifestyle", "Contact"];

  const stepDescriptions = language === "es"
    ? [
        "Cuéntanos sobre tu trabajo para personalizar la evaluación",
        "Evaluamos tu situación actual de dolor",
        "Identificamos factores psicosociales que influyen en el dolor",
        "Tu contexto de vida afecta directamente a tu espalda",
        "Último paso para ver tus resultados personalizados"
      ]
    : [
        "Tell us about your work to personalize the assessment",
        "We evaluate your current pain situation",
        "We identify psychosocial factors that influence pain",
        "Your life context directly affects your back",
        "Last step to view your personalized results"
      ];

  const getStepTitle = () => stepTitles[currentStep - 1] || "";
  const getStepDescription = () => stepDescriptions[currentStep - 1] || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.common.home}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">{t.common.appName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS_I18N}
          />
        </div>

        {/* Form Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
            <CardDescription className="text-base">
              {getStepDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-previous"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {txt.back}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || submitMutation.isPending}
            data-testid="button-next"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === "es" ? "Procesando..." : "Processing..."}
              </>
            ) : currentStep === TOTAL_STEPS ? (
              <>
                {txt.submit}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                {txt.next}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
