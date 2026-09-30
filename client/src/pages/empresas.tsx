import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Building2, Users, Mail, Phone, DollarSign, FileUp, Check, Loader2, Globe, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/language-selector";
import { apiRequest } from "@/lib/queryClient";

const translations = {
  es: {
    title: "Registro Empresarial",
    subtitle: "Diagnóstico Organizacional de Dolor Lumbar",
    description: "Complete el formulario para iniciar el análisis del impacto del dolor lumbar en su organización. Recibirá un informe ejecutivo con costos y recomendaciones.",
    companySection: "Datos de la Empresa",
    contactSection: "Datos de Contacto",
    metricsSection: "Métricas Organizacionales",
    companyName: "Nombre de la empresa",
    industry: "Sector/Industria",
    country: "País",
    contactName: "Nombre del contacto",
    contactEmail: "Correo electrónico",
    contactPhone: "Teléfono (opcional)",
    totalEmployees: "Total de empleados",
    officePercent: "% trabajadores de oficina/sedentarios",
    avgSalary: "Salario promedio anual (USD)",
    sickDays: "Días de baja promedio por año",
    backPainCases: "Casos de dolor lumbar reportados (último año)",
    additionalInfo: "Información adicional",
    additionalInfoPlaceholder: "Cualquier información relevante sobre programas de salud existentes, incidentes previos, etc.",
    submit: "Enviar Registro",
    submitting: "Enviando...",
    successTitle: "Registro Exitoso",
    successMessage: "Nos pondremos en contacto pronto para coordinar el análisis.",
    backHome: "Volver al inicio",
    privacyNote: "Sus datos están protegidos y solo serán utilizados para el análisis del impacto del dolor lumbar.",
    industries: {
      tech: "Tecnología",
      finance: "Finanzas/Banca",
      healthcare: "Salud",
      manufacturing: "Manufactura",
      retail: "Retail/Comercio",
      services: "Servicios Profesionales",
      government: "Gobierno",
      education: "Educación",
      other: "Otro",
    },
    countries: {
      es: "España",
      mx: "México",
      ar: "Argentina",
      co: "Colombia",
      cl: "Chile",
      pe: "Perú",
      us: "Estados Unidos",
      other: "Otro",
    },
  },
  en: {
    title: "Enterprise Registration",
    subtitle: "Organizational Back Pain Diagnostic",
    description: "Complete this form to begin the analysis of back pain impact in your organization. You will receive an executive report with costs and recommendations.",
    companySection: "Company Data",
    contactSection: "Contact Information",
    metricsSection: "Organizational Metrics",
    companyName: "Company name",
    industry: "Industry/Sector",
    country: "Country",
    contactName: "Contact name",
    contactEmail: "Email address",
    contactPhone: "Phone (optional)",
    totalEmployees: "Total employees",
    officePercent: "% office/sedentary workers",
    avgSalary: "Average annual salary (USD)",
    sickDays: "Average sick days per year",
    backPainCases: "Reported back pain cases (last year)",
    additionalInfo: "Additional information",
    additionalInfoPlaceholder: "Any relevant information about existing health programs, previous incidents, etc.",
    submit: "Submit Registration",
    submitting: "Submitting...",
    successTitle: "Registration Successful",
    successMessage: "We will contact you soon to coordinate the analysis.",
    backHome: "Back to home",
    privacyNote: "Your data is protected and will only be used for the back pain impact analysis.",
    industries: {
      tech: "Technology",
      finance: "Finance/Banking",
      healthcare: "Healthcare",
      manufacturing: "Manufacturing",
      retail: "Retail",
      services: "Professional Services",
      government: "Government",
      education: "Education",
      other: "Other",
    },
    countries: {
      es: "Spain",
      mx: "Mexico",
      ar: "Argentina",
      co: "Colombia",
      cl: "Chile",
      pe: "Peru",
      us: "United States",
      other: "Other",
    },
  },
};

const formSchema = z.object({
  companyName: z.string().min(2, "Nombre requerido"),
  industry: z.string().optional(),
  country: z.string().optional(),
  contactName: z.string().min(2, "Nombre de contacto requerido"),
  contactEmail: z.string().email("Email inválido"),
  contactPhone: z.string().optional(),
  totalEmployees: z.coerce.number().min(1, "Ingrese el número de empleados"),
  officeEmployeesPercent: z.coerce.number().min(0).max(100).optional(),
  averageSalary: z.string().optional(),
  sickDaysPerYear: z.coerce.number().optional(),
  backPainCasesReported: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EmpresasPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      country: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      totalEmployees: 0,
      officeEmployeesPercent: 70,
      averageSalary: "",
      sickDaysPerYear: 5,
      backPainCasesReported: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/companies", data);
      return response.json();
    },
    onSuccess: (data) => {
      setInviteCode(data.inviteCode);
      setSubmitted(true);
      toast({
        title: t.successTitle,
        description: t.successMessage,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al enviar el registro",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">{t.successTitle}</CardTitle>
            <CardDescription className="text-base mt-2">
              {t.successMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inviteCode && (
              <div className="bg-muted p-4 rounded-md text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === "es" ? "Código de invitación para empleados:" : "Employee invite code:"}
                </p>
                <p className="text-xl font-mono font-bold">{inviteCode}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">{t.title}</h1>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            {t.description}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t.companySection}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.companyName}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.industry}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-industry">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tech">{t.industries.tech}</SelectItem>
                            <SelectItem value="finance">{t.industries.finance}</SelectItem>
                            <SelectItem value="healthcare">{t.industries.healthcare}</SelectItem>
                            <SelectItem value="manufacturing">{t.industries.manufacturing}</SelectItem>
                            <SelectItem value="retail">{t.industries.retail}</SelectItem>
                            <SelectItem value="services">{t.industries.services}</SelectItem>
                            <SelectItem value="government">{t.industries.government}</SelectItem>
                            <SelectItem value="education">{t.industries.education}</SelectItem>
                            <SelectItem value="other">{t.industries.other}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.country}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="es">{t.countries.es}</SelectItem>
                            <SelectItem value="mx">{t.countries.mx}</SelectItem>
                            <SelectItem value="ar">{t.countries.ar}</SelectItem>
                            <SelectItem value="co">{t.countries.co}</SelectItem>
                            <SelectItem value="cl">{t.countries.cl}</SelectItem>
                            <SelectItem value="pe">{t.countries.pe}</SelectItem>
                            <SelectItem value="us">{t.countries.us}</SelectItem>
                            <SelectItem value="other">{t.countries.other}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {t.contactSection}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.contactName}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.contactEmail}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.contactPhone}</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} data-testid="input-contact-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t.metricsSection}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalEmployees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.totalEmployees}</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} data-testid="input-total-employees" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="officeEmployeesPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.officePercent}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} data-testid="input-office-percent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="averageSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.avgSalary}</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="50000" {...field} data-testid="input-avg-salary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sickDaysPerYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.sickDays}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} data-testid="input-sick-days" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="backPainCasesReported"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.backPainCases}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} data-testid="input-back-pain-cases" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground text-center">
                {t.privacyNote}
              </p>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  t.submit
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
