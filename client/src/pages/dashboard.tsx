import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Target,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/language-selector";

interface DashboardData {
  companyName: string;
  totalEmployees: number;
  analysis: {
    absenteeismCost: string;
    presenteeismCost: string;
    futureRiskCost: string;
    totalAnnualCost: string;
    potentialSavings: string;
    employeesAssessed: number;
    riskDistribution: {
      high: number;
      medium: number;
      low: number;
    };
    avgRisks: {
      mechanical: number;
      recovery: number;
      psychosocial: number;
    };
    keyInterventions: Array<{
      area: string;
      priority: string;
      recommendation: string;
    }>;
    executiveSummary: string | null;
  };
  generatedAt: string;
}

const translations = {
  es: {
    title: "Dashboard Ejecutivo",
    subtitle: "Impacto del Dolor Lumbar",
    backHome: "Volver al inicio",
    loading: "Cargando dashboard...",
    notAvailable: "Dashboard no disponible",
    notAvailableDesc: "El análisis para esta empresa aún no ha sido generado.",
    costSummary: "Resumen de Costos Anuales",
    absenteeism: "Absentismo",
    absenteeismDesc: "Costo de días perdidos por baja",
    presenteeism: "Presentismo",
    presenteeismDesc: "Pérdida de productividad",
    futureRisk: "Riesgo Futuro",
    futureRiskDesc: "Proyección basada en evaluaciones",
    totalCost: "Costo Total Anual",
    potentialSavings: "Ahorro Potencial",
    savingsDesc: "Con intervención preventiva",
    riskDistribution: "Distribución de Riesgo",
    highRisk: "Riesgo Alto",
    mediumRisk: "Riesgo Medio",
    lowRisk: "Riesgo Bajo",
    employeesAssessed: "empleados evaluados",
    riskByCategory: "Riesgo por Categoría",
    mechanical: "Mecánico",
    mechanicalDesc: "Postura, ergonomía, carga física",
    recovery: "Recuperación",
    recoveryDesc: "Sueño, actividad, descanso",
    psychosocial: "Psicosocial",
    psychosocialDesc: "Estrés, estado de ánimo",
    keyInterventions: "Intervenciones Clave",
    priority: "Prioridad",
    generatedAt: "Generado el",
  },
  en: {
    title: "Executive Dashboard",
    subtitle: "Back Pain Impact",
    backHome: "Back to home",
    loading: "Loading dashboard...",
    notAvailable: "Dashboard not available",
    notAvailableDesc: "The analysis for this company has not been generated yet.",
    costSummary: "Annual Cost Summary",
    absenteeism: "Absenteeism",
    absenteeismDesc: "Cost of sick days",
    presenteeism: "Presenteeism",
    presenteeismDesc: "Productivity loss",
    futureRisk: "Future Risk",
    futureRiskDesc: "Projection based on assessments",
    totalCost: "Total Annual Cost",
    potentialSavings: "Potential Savings",
    savingsDesc: "With preventive intervention",
    riskDistribution: "Risk Distribution",
    highRisk: "High Risk",
    mediumRisk: "Medium Risk",
    lowRisk: "Low Risk",
    employeesAssessed: "employees assessed",
    riskByCategory: "Risk by Category",
    mechanical: "Mechanical",
    mechanicalDesc: "Posture, ergonomics, physical load",
    recovery: "Recovery",
    recoveryDesc: "Sleep, activity, rest",
    psychosocial: "Psychosocial",
    psychosocialDesc: "Stress, mood",
    keyInterventions: "Key Interventions",
    priority: "Priority",
    generatedAt: "Generated on",
  },
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function DashboardPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { language } = useLanguage();
  const t = translations[language];

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", companyId],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>{t.notAvailable}</CardTitle>
            <CardDescription>{t.notAvailableDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backHome}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAssessed = data.analysis.riskDistribution.high + 
    data.analysis.riskDistribution.medium + 
    data.analysis.riskDistribution.low;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backHome}
            </Button>
          </Link>
          <LanguageSelector />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-muted-foreground">{data.companyName}</span>
          </div>
          <h1 className="text-3xl font-bold mb-1" data-testid="text-page-title">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t.generatedAt}: {new Date(data.generatedAt).toLocaleDateString(language === "es" ? "es-ES" : "en-US")}
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {t.costSummary}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">{t.absenteeism}</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.analysis.absenteeismCost)}</div>
                  <div className="text-xs text-muted-foreground">{t.absenteeismDesc}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">{t.presenteeism}</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.analysis.presenteeismCost)}</div>
                  <div className="text-xs text-muted-foreground">{t.presenteeismDesc}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">{t.futureRisk}</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.analysis.futureRiskCost)}</div>
                  <div className="text-xs text-muted-foreground">{t.futureRiskDesc}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-1">{t.totalCost}</div>
                  <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(data.analysis.totalAnnualCost)}
                  </div>
                </div>
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    {t.potentialSavings}
                  </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(data.analysis.potentialSavings)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">{t.savingsDesc}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t.riskDistribution}
                </CardTitle>
                <CardDescription>
                  {totalAssessed} {t.employeesAssessed}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      {t.highRisk}
                    </span>
                    <span className="font-semibold">{data.analysis.riskDistribution.high}</span>
                  </div>
                  <Progress 
                    value={totalAssessed > 0 ? (data.analysis.riskDistribution.high / totalAssessed) * 100 : 0} 
                    className="h-2 bg-red-100 dark:bg-red-900/30"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      {t.mediumRisk}
                    </span>
                    <span className="font-semibold">{data.analysis.riskDistribution.medium}</span>
                  </div>
                  <Progress 
                    value={totalAssessed > 0 ? (data.analysis.riskDistribution.medium / totalAssessed) * 100 : 0} 
                    className="h-2 bg-yellow-100 dark:bg-yellow-900/30"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {t.lowRisk}
                    </span>
                    <span className="font-semibold">{data.analysis.riskDistribution.low}</span>
                  </div>
                  <Progress 
                    value={totalAssessed > 0 ? (data.analysis.riskDistribution.low / totalAssessed) * 100 : 0} 
                    className="h-2 bg-green-100 dark:bg-green-900/30"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t.riskByCategory}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium">{t.mechanical}</span>
                      <p className="text-xs text-muted-foreground">{t.mechanicalDesc}</p>
                    </div>
                    <span className="font-semibold">{data.analysis.avgRisks.mechanical}%</span>
                  </div>
                  <Progress value={data.analysis.avgRisks.mechanical} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium">{t.recovery}</span>
                      <p className="text-xs text-muted-foreground">{t.recoveryDesc}</p>
                    </div>
                    <span className="font-semibold">{data.analysis.avgRisks.recovery}%</span>
                  </div>
                  <Progress value={data.analysis.avgRisks.recovery} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium">{t.psychosocial}</span>
                      <p className="text-xs text-muted-foreground">{t.psychosocialDesc}</p>
                    </div>
                    <span className="font-semibold">{data.analysis.avgRisks.psychosocial}%</span>
                  </div>
                  <Progress value={data.analysis.avgRisks.psychosocial} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {data.analysis.keyInterventions && data.analysis.keyInterventions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  {t.keyInterventions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.analysis.keyInterventions.map((intervention, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                    >
                      <Badge className={priorityColors[intervention.priority] || priorityColors.medium}>
                        {t.priority}: {intervention.priority === "high" ? "Alta" : intervention.priority === "medium" ? "Media" : "Baja"}
                      </Badge>
                      <div>
                        <div className="font-medium">{intervention.area}</div>
                        <div className="text-sm text-muted-foreground">{intervention.recommendation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
