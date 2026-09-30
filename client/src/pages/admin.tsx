import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Calculator,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Sparkles,
  Phone,
  Mail,
  User,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/language-selector";

interface Company {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  industry: string | null;
  country: string | null;
  totalEmployees: number;
  officeEmployeesPercent: number | null;
  averageSalary: string | null;
  sickDaysPerYear: number | null;
  backPainCasesReported: number | null;
  inviteCode: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

interface CompanyDetails {
  company: Company;
  files: Array<{ id: string; fileName: string; createdAt: string }>;
  assessments: Array<{ id: string; riskLevel: string; createdAt: string }>;
  costAnalysis: any | null;
  stats: {
    totalAssessments: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    avgMechanicalRisk: number;
    avgRecoveryRisk: number;
    avgPsychosocialRisk: number;
  };
}

interface PlanLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  assessmentId: string | null;
  spineAge: number | null;
  realAge: number | null;
  riskLevel: string | null;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  converted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  lost: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const leadStatusLabels: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  converted: "Convertido",
  lost: "Perdido",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  active: "Activa",
  completed: "Completada",
  archived: "Archivada",
};

function CompanyRow({ company }: { company: Company }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const { data: details, isLoading } = useQuery<CompanyDetails>({
    queryKey: ["/api/admin/companies", company.id],
    enabled: expanded,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/companies/${company.id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies", company.id] });
      toast({ title: "Estado actualizado" });
    },
  });

  const calculateCostsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/companies/${company.id}/cost-analysis`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies", company.id] });
      toast({ title: "Análisis de costos generado" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <Card className="mb-4">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">{company.companyName}</CardTitle>
            <Badge className={statusColors[company.status] || statusColors.pending}>
              {statusLabels[company.status] || company.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {company.inviteCode}
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
        <CardDescription className="flex items-center gap-4 flex-wrap mt-2">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {company.totalEmployees} empleados
          </span>
          <span>{company.contactEmail}</span>
          <span className="text-xs">
            {new Date(company.createdAt).toLocaleDateString("es-ES")}
          </span>
        </CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : details ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-md">
                  <div className="text-2xl font-bold">{details.stats.totalAssessments}</div>
                  <div className="text-xs text-muted-foreground">Evaluaciones</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <div className="text-2xl font-bold text-red-600">{details.stats.highRisk}</div>
                  <div className="text-xs text-muted-foreground">Riesgo Alto</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <div className="text-2xl font-bold text-yellow-600">{details.stats.mediumRisk}</div>
                  <div className="text-xs text-muted-foreground">Riesgo Medio</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <div className="text-2xl font-bold text-green-600">{details.stats.lowRisk}</div>
                  <div className="text-xs text-muted-foreground">Riesgo Bajo</div>
                </div>
              </div>

              {details.stats.totalAssessments > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-2 border rounded-md">
                    <div className="text-lg font-semibold">{details.stats.avgMechanicalRisk}%</div>
                    <div className="text-xs text-muted-foreground">Riesgo Mecánico</div>
                  </div>
                  <div className="text-center p-2 border rounded-md">
                    <div className="text-lg font-semibold">{details.stats.avgRecoveryRisk}%</div>
                    <div className="text-xs text-muted-foreground">Riesgo Recuperación</div>
                  </div>
                  <div className="text-center p-2 border rounded-md">
                    <div className="text-lg font-semibold">{details.stats.avgPsychosocialRisk}%</div>
                    <div className="text-xs text-muted-foreground">Riesgo Psicosocial</div>
                  </div>
                </div>
              )}

              {details.costAnalysis && (
                <div className="bg-primary/5 p-4 rounded-md space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Análisis de Costos
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Absentismo</div>
                      <div className="font-semibold">${parseFloat(details.costAnalysis.absenteeismCost).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Presentismo</div>
                      <div className="font-semibold">${parseFloat(details.costAnalysis.presenteeismCost).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Costo Total</div>
                      <div className="font-semibold text-red-600">${parseFloat(details.costAnalysis.totalAnnualCost).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Ahorro Potencial</div>
                      <div className="font-semibold text-green-600">${parseFloat(details.costAnalysis.potentialSavings).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ status: "active" })}
                    disabled={company.status === "active"}
                    data-testid="button-set-active"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Activar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ status: "completed" })}
                    disabled={company.status === "completed"}
                    data-testid="button-set-completed"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Completar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => calculateCostsMutation.mutate()}
                    disabled={calculateCostsMutation.isPending}
                    data-testid="button-calculate-costs"
                  >
                    {calculateCostsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Calculator className="w-4 h-4 mr-1" />
                    )}
                    Calcular Costos
                  </Button>
                </div>
                <Link href={`/dashboard/${company.id}`}>
                  <Button variant="ghost" size="sm" data-testid="button-view-dashboard">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Dashboard
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}

export default function AdminPage() {
  const { language } = useLanguage();
  const { data: companies, isLoading, error } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
  });

  const txt = language === "es" ? {
    panelTitle: "Panel Admin - ADAPTY B2B",
    backHome: "Volver al inicio",
    companiesTitle: "Empresas Registradas",
    companiesDesc: "Gestiona las empresas, visualiza evaluaciones y genera análisis de costos.",
    loading: "Cargando...",
    errorLoading: "Error al cargar empresas",
    emptyTitle: "Sin empresas registradas",
    emptyDesc: "Aún no hay empresas registradas en el sistema.",
    registerFirst: "Registrar primera empresa",
  } : {
    panelTitle: "Admin Panel - ADAPTY B2B",
    backHome: "Back to home",
    companiesTitle: "Registered Companies",
    companiesDesc: "Manage companies, view assessments and generate cost analyses.",
    loading: "Loading...",
    errorLoading: "Error loading companies",
    emptyTitle: "No registered companies",
    emptyDesc: "No companies registered in the system yet.",
    registerFirst: "Register first company",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">{txt.panelTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                {txt.backHome}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" data-testid="text-page-title">
            {txt.companiesTitle}
          </h1>
          <p className="text-muted-foreground">
            {txt.companiesDesc}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive">{txt.errorLoading}</p>
            </CardContent>
          </Card>
        ) : companies && companies.length > 0 ? (
          <div>
            {companies.map((company) => (
              <CompanyRow key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{txt.emptyTitle}</h3>
              <p className="text-muted-foreground mb-4">
                {txt.emptyDesc}
              </p>
              <Link href="/empresas">
                <Button data-testid="button-register-company">
                  {txt.registerFirst}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Leads Section */}
        <LeadsSection />
      </main>
    </div>
  );
}

function LeadsSection() {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const txt = language === "es" ? {
    title: "Leads de Plan Personalizado",
    subtitle: "Personas interesadas en el plan personalizado de mejora de espalda.",
    loading: "Cargando leads...",
    error: "Error al cargar leads",
    emptyTitle: "Sin leads todavía",
    emptyDesc: "Los leads aparecerán aquí cuando usuarios completen el formulario de interés en el plan personalizado.",
    realAge: "Edad real",
    spineAge: "Edad de espalda",
    years: "años",
    riskLow: "Bajo",
    riskMedium: "Medio",
    riskHigh: "Alto",
    risk: "Riesgo",
    contacted: "Contactado",
    converted: "Convertido",
    statusNew: "Nuevo",
    statusContacted: "Contactado",
    statusConverted: "Convertido",
    statusLost: "Perdido",
    statusUpdated: "Estado del lead actualizado",
  } : {
    title: "Personalized Plan Leads",
    subtitle: "People interested in the personalized back improvement plan.",
    loading: "Loading leads...",
    error: "Error loading leads",
    emptyTitle: "No leads yet",
    emptyDesc: "Leads will appear here when users complete the interest form for the personalized plan.",
    realAge: "Real age",
    spineAge: "Spine age",
    years: "years",
    riskLow: "Low",
    riskMedium: "Medium",
    riskHigh: "High",
    risk: "Risk",
    contacted: "Contacted",
    converted: "Converted",
    statusNew: "New",
    statusContacted: "Contacted",
    statusConverted: "Converted",
    statusLost: "Lost",
    statusUpdated: "Lead status updated",
  };
  
  const { data: leads, isLoading, error } = useQuery<PlanLead[]>({
    queryKey: ["/api/admin/plan-leads"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/plan-leads/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plan-leads"] });
      toast({ title: txt.statusUpdated });
    },
  });

  const getRiskBadgeColor = (level: string | null) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLabel = (level: string | null) => {
    switch (level) {
      case "low": return txt.riskLow;
      case "medium": return txt.riskMedium;
      case "high": return txt.riskHigh;
      default: return "-";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new": return txt.statusNew;
      case "contacted": return txt.statusContacted;
      case "converted": return txt.statusConverted;
      case "lost": return txt.statusLost;
      default: return txt.statusNew;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-12">
      <Separator className="mb-8" />
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold" data-testid="text-leads-title">
            {txt.title}
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          {txt.subtitle}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">{txt.error}</p>
          </CardContent>
        </Card>
      ) : leads && leads.length > 0 ? (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.id} data-testid={`card-lead-${lead.id}`}>
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold" data-testid={`text-lead-name-${lead.id}`}>
                          {lead.name}
                        </span>
                      </div>
                      <Badge className={leadStatusColors[lead.status] || leadStatusColors.new}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                      {lead.riskLevel && (
                        <Badge variant="outline" className={getRiskBadgeColor(lead.riskLevel)}>
                          {txt.risk} {getRiskLabel(lead.riskLevel)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <a href={`mailto:${lead.email}`} className="hover:underline" data-testid={`link-lead-email-${lead.id}`}>
                          {lead.email}
                        </a>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <a href={`tel:${lead.phone}`} className="hover:underline" data-testid={`link-lead-phone-${lead.id}`}>
                            {lead.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(lead.createdAt)}</span>
                      </div>
                    </div>

                    {(lead.spineAge || lead.realAge) && (
                      <div className="flex gap-4 text-sm">
                        {lead.realAge && (
                          <span>
                            <span className="text-muted-foreground">{txt.realAge}:</span>{" "}
                            <span className="font-medium">{lead.realAge} {txt.years}</span>
                          </span>
                        )}
                        {lead.spineAge && (
                          <span>
                            <span className="text-muted-foreground">{txt.spineAge}:</span>{" "}
                            <span className={`font-medium ${lead.spineAge > (lead.realAge || 0) ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                              {lead.spineAge} {txt.years}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: lead.id, status: "contacted" })}
                      disabled={lead.status === "contacted" || updateStatusMutation.isPending}
                      data-testid={`button-lead-contacted-${lead.id}`}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      {txt.contacted}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: lead.id, status: "converted" })}
                      disabled={lead.status === "converted" || updateStatusMutation.isPending}
                      data-testid={`button-lead-converted-${lead.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {txt.converted}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{txt.emptyTitle}</h3>
            <p className="text-muted-foreground text-sm">
              {txt.emptyDesc}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
