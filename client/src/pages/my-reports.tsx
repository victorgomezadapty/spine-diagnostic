import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail, FileText, Calendar, Activity, Search, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/language-selector";
import type { Assessment } from "@shared/schema";

export default function MyReports() {
  const { t, language } = useLanguage();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [reports, setReports] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  const txt = language === "es" ? {
    title: "Mis Informes",
    description: "Recupera tus evaluaciones anteriores usando el email que proporcionaste",
    emailLabel: "Tu correo electrónico",
    emailPlaceholder: "tu@email.com",
    searchButton: "Buscar Informes",
    searching: "Buscando...",
    noReports: "No encontramos informes asociados a este email",
    noReportsHint: "Si completaste una evaluación sin proporcionar email, no podremos recuperarla.",
    reportsFound: "informes encontrados",
    reportFound: "informe encontrado",
    viewReport: "Ver Informe",
    riskLevel: "Nivel de riesgo",
    riskLow: "Bajo",
    riskMedium: "Moderado",
    riskHigh: "Elevado",
    invalidEmail: "Por favor ingresa un email válido",
    errorFetching: "Error al buscar informes. Inténtalo de nuevo.",
    date: "Fecha",
    score: "Puntuación",
  } : {
    title: "My Reports",
    description: "Retrieve your previous assessments using the email you provided",
    emailLabel: "Your email address",
    emailPlaceholder: "your@email.com",
    searchButton: "Search Reports",
    searching: "Searching...",
    noReports: "No reports found for this email",
    noReportsHint: "If you completed an assessment without providing an email, we cannot retrieve it.",
    reportsFound: "reports found",
    reportFound: "report found",
    viewReport: "View Report",
    riskLevel: "Risk level",
    riskLow: "Low",
    riskMedium: "Moderate",
    riskHigh: "High",
    invalidEmail: "Please enter a valid email",
    errorFetching: "Error fetching reports. Please try again.",
    date: "Date",
    score: "Score",
  };

  const handleSearch = async () => {
    if (!email || !email.includes("@")) {
      setError(txt.invalidEmail);
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await fetch(`/api/assessments/by-email/${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      setReports(data);
    } catch {
      setError(txt.errorFetching);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {txt.emailLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder={txt.emailPlaceholder}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
                data-testid="input-search-email"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                data-testid="button-search-reports"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {txt.searching}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    {txt.searchButton}
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="text-error">{error}</p>
            )}
          </CardContent>
        </Card>

        {hasSearched && !isLoading && (
          <div className="space-y-4">
            {reports.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                  {reports.length} {reports.length === 1 ? txt.reportFound : txt.reportsFound}
                </p>
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
                                {getRiskBadge(report.riskLevel || "medium")}
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
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="font-medium" data-testid="text-no-reports">{txt.noReports}</p>
                  <p className="text-sm text-muted-foreground">{txt.noReportsHint}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
