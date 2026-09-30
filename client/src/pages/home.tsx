import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Clock, 
  Shield, 
  Target, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Activity,
  Brain,
  Briefcase,
  FileText
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/language-selector";

export default function Home() {
  const { t, language } = useLanguage();

  const stats = language === "es" ? {
    stat1: { value: "80%", text: "de los adultos experimentarán dolor lumbar en algún momento" },
    stat2: { value: "40%", text: "reducción de productividad por presentismo laboral" },
    stat3: { value: "#1", text: "causa de bajas laborales en profesionales de oficina" },
  } : {
    stat1: { value: "80%", text: "of adults will experience lower back pain at some point" },
    stat2: { value: "40%", text: "productivity reduction due to workplace presenteeism" },
    stat3: { value: "#1", text: "cause of sick leave among office professionals" },
  };

  const howItWorks = language === "es" ? {
    title: "Cómo Funciona",
    subtitle: "Un proceso simple y científico para evaluar tu situación",
    step1: { title: "1. Contexto Laboral", desc: "Analizamos tu perfil profesional: horas sentado, nivel de estrés, y tipo de trabajo." },
    step2: { title: "2. Evaluación Clínica", desc: "Cuestionario basado en el STarT Back Tool, validado científicamente para identificar riesgos." },
    step3: { title: "3. Resultados Personalizados", desc: "Recibe tu nivel de riesgo y recomendaciones específicas basadas en tu perfil." },
  } : {
    title: "How It Works",
    subtitle: "A simple and scientific process to evaluate your situation",
    step1: { title: "1. Work Context", desc: "We analyze your professional profile: hours seated, stress level, and type of work." },
    step2: { title: "2. Clinical Assessment", desc: "Questionnaire based on the STarT Back Tool, scientifically validated to identify risks." },
    step3: { title: "3. Personalized Results", desc: "Receive your risk level and specific recommendations based on your profile." },
  };

  const problemSection = language === "es" ? {
    title: "El Dolor Lumbar: La Epidemia Silenciosa",
    subtitle: "El dolor de espalda es la principal causa de discapacidad laboral en el mundo, afectando especialmente a profesionales sedentarios.",
  } : {
    title: "Lower Back Pain: The Silent Epidemic",
    subtitle: "Back pain is the leading cause of work disability worldwide, especially affecting sedentary professionals.",
  };

  const scientific = language === "es" ? {
    badge: "Metodología",
    title: "Inspirado en Evidencia Científica",
    desc: "Nuestra evaluación incorpora conceptos de herramientas clínicas reconocidas, incluyendo factores psicosociales que la investigación ha identificado como predictores clave del dolor crónico.",
    points: [
      "Evalúa factores físicos, psicológicos y laborales",
      "Incorpora el contexto de trabajo sedentario",
      "Recomendaciones basadas en guías clínicas actuales",
    ],
    cardTitle: "La Diferencia del Contexto Laboral",
    cardDesc: "A diferencia de otras herramientas, ADAPTY integra tu contexto profesional: horas sentado, nivel de estrés laboral, y tipo de trabajo. Esto permite recomendaciones verdaderamente personalizadas para tu situación.",
  } : {
    badge: "Methodology",
    title: "Inspired by Scientific Evidence",
    desc: "Our assessment incorporates concepts from recognized clinical tools, including psychosocial factors that research has identified as key predictors of chronic pain.",
    points: [
      "Evaluates physical, psychological, and work factors",
      "Incorporates the sedentary work context",
      "Recommendations based on current clinical guidelines",
    ],
    cardTitle: "The Work Context Difference",
    cardDesc: "Unlike other tools, ADAPTY integrates your professional context: hours seated, work stress level, and type of work. This allows truly personalized recommendations for your situation.",
  };

  const cta = language === "es" ? {
    title: "Comienza Tu Evaluación Ahora",
    desc: "2 minutos para entender tu riesgo de dolor lumbar y recibir recomendaciones personalizadas.",
    button: "Comenzar Evaluación Gratuita",
    note: "Sin registro requerido. Resultados inmediatos.",
  } : {
    title: "Start Your Assessment Now",
    desc: "2 minutes to understand your lower back pain risk and receive personalized recommendations.",
    button: "Start Free Assessment",
    note: "No registration required. Immediate results.",
  };

  const hero = language === "es" ? {
    badge: "Evaluación Basada en Evidencia",
    title1: "Evaluación de",
    titleHighlight: "Riesgo Funcional",
    title2: "en 2 Minutos",
    desc: "Evalúa tu riesgo de dolor de espalda con nuestro cuestionario inspirado en herramientas clínicas validadas. Obtén recomendaciones personalizadas según tu perfil profesional y contexto laboral.",
    button: "Comenzar Evaluación Gratuita",
    time: "2 minutos",
    confidential: "100% Confidencial",
    immediate: "Resultados Inmediatos",
    cardTitle: "Evaluación de Riesgo",
    cardSubtitle: "Basada en evidencia clínica",
    features: [
      "Nivel de riesgo personalizado",
      "Factores de riesgo identificados",
      "Recomendaciones específicas",
      "Contexto laboral integrado",
    ],
  } : {
    badge: "Evidence-Based Assessment",
    title1: "Functional",
    titleHighlight: "Risk Assessment",
    title2: "in 2 Minutes",
    desc: "Assess your back pain risk with our questionnaire inspired by validated clinical tools. Get personalized recommendations based on your professional profile and work context.",
    button: "Start Free Assessment",
    time: "2 minutes",
    confidential: "100% Confidential",
    immediate: "Immediate Results",
    cardTitle: "Risk Assessment",
    cardSubtitle: "Based on clinical evidence",
    features: [
      "Personalized risk level",
      "Identified risk factors",
      "Specific recommendations",
      "Integrated work context",
    ],
  };

  const footer = language === "es" 
    ? "Esta evaluación es informativa y no sustituye el diagnóstico médico profesional."
    : "This assessment is informational and does not replace professional medical diagnosis.";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">{t.common.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Link href="/my-reports">
              <Button variant="ghost" data-testid="button-my-reports">
                <FileText className="h-4 w-4 mr-2" />
                {language === "es" ? "Mis Informes" : "My Reports"}
              </Button>
            </Link>
            <Link href="/assessment">
              <Button data-testid="button-header-start">
                {t.common.start}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  {hero.badge}
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  {hero.title1}{" "}
                  <span className="text-primary">{hero.titleHighlight}</span>{" "}
                  {hero.title2}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {hero.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/assessment">
                  <Button size="lg" data-testid="button-hero-start">
                    {hero.button}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{hero.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>{hero.confidential}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{hero.immediate}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{hero.cardTitle}</h3>
                      <p className="text-sm text-muted-foreground">{hero.cardSubtitle}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {hero.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {problemSection.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {problemSection.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <CardContent className="pt-6 space-y-4">
                <div className="text-4xl font-bold text-primary">{stats.stat1.value}</div>
                <p className="text-muted-foreground">{stats.stat1.text}</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-6 space-y-4">
                <div className="text-4xl font-bold text-primary">{stats.stat2.value}</div>
                <p className="text-muted-foreground">{stats.stat2.text}</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-6 space-y-4">
                <div className="text-4xl font-bold text-primary">{stats.stat3.value}</div>
                <p className="text-muted-foreground">{stats.stat3.text}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {howItWorks.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{howItWorks.step1.title}</h3>
              <p className="text-muted-foreground">{howItWorks.step1.desc}</p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{howItWorks.step2.title}</h3>
              <p className="text-muted-foreground">{howItWorks.step2.desc}</p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{howItWorks.step3.title}</h3>
              <p className="text-muted-foreground">{howItWorks.step3.desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline">{scientific.badge}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                {scientific.title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {scientific.desc}
              </p>
              <div className="space-y-3">
                {scientific.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8">
              <div className="space-y-4">
                <TrendingUp className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-semibold">{scientific.cardTitle}</h3>
                <p className="text-muted-foreground">{scientific.cardDesc}</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">{cta.title}</h2>
          <p className="text-lg text-muted-foreground">{cta.desc}</p>
          <Link href="/assessment">
            <Button size="lg" data-testid="button-cta-start">
              {cta.button}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">{cta.note}</p>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">{t.common.appName}</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">{footer}</p>
        </div>
      </footer>
    </div>
  );
}
