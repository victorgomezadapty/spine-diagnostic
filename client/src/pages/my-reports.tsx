import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { ArrowLeft, FileText, Calendar, Activity, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/language-selector";
import { clearSavedReports, getSavedReports } from "@/lib/my-reports";

export default function MyReports() {
  const { t, language } = useLanguage();
  const [, navigate] = useLocation();
  const [reports, setReports] = useState(getSavedReports);

  const txt = language === "es" ? {
    title: "Mis Informes",
    description: "Las evaluaciones que hiciste en este dispositivo",
    privacy: "Por tu privacidad, los informes se guardan solo en este navegador y no se pueden buscar por email.",
    noReports: "Todavía no tienes informes en este dispositivo",
    noReportsHint: "Completa una evaluación y aparecerá aquí.",
    startAssessment: "Comenzar evaluación",
    viewReport: "Ver Informe",
    clear: "Borrar lista",
    riskLevel: "Nivel de riesgo",
    riskLow: "Bajo",
    riskMedium: "Moderado",
    riskHigh: "Elevado",
    score: "Puntuación",
  } : {
    title: "My Reports",
    description: "The assessments you completed on this device",
    privacy: "For your privacy, reports are stored only in this browser and cannot be looked up by email.",
    noReports: "You have no reports on this device yet",
    noReportsHint: "Complete an assessment and it will appear here.",
    startAssessment: "Start assessment",
    viewReport: "View Report",
    clear: "Clear list",
    riskLevel: "Risk level",
    riskLow: "Low",
    riskMedium: "Moderate",
    riskHigh: "High",
    score: "Score",
  };

  const getRiskBadge = (level: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      low: { variant: "secondary", label: txt.riskLow },
      medium: { variant: "default", label: txt.riskMedium },
      high: { variant: "destructive", label: txt.riskHigh },
    };
    const config = variants[level] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{txt.title}</h1>
          <p className="text-muted-foreground">{txt.description}</p>
          <p className="text-xs text-muted-foreground">{txt.privacy}</p>
        </div>

        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="hover-elevate cursor-pointer"
                onClick={() => navigate(`/results/${report.id}`)}
                data-testid={`card-report-${report.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-md bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{txt.riskLevel}:</span>
                          {getRiskBadge(report.riskLevel)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(report.createdAt)}
                          </span>
                          <span>{txt.score}: {report.totalScore}/100</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" data-testid={`button-view-report-${report.id}`}>
                      {txt.viewReport}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearSavedReports();
                  setReports([]);
                }}
                data-testid="button-clear-reports"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {txt.clear}
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="font-medium" data-testid="text-no-reports">{txt.noReports}</p>
              <p className="text-sm text-muted-foreground">{txt.noReportsHint}</p>
              <Link href="/assessment">
                <Button data-testid="button-start-assessment">{txt.startAssessment}</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
