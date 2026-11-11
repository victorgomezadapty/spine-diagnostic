import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { type Language, type Translations, getTranslation, translations } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const defaultLanguage: Language = "en";
const defaultTranslations = translations.en as Translations;

const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: defaultTranslations,
});

function languageFromSearch(search: string): Language {
  return new URLSearchParams(search).get("lang") === "es" ? "es" : defaultLanguage;
}

function readInitialLanguage(): Language {
  if (typeof window === "undefined") return defaultLanguage;
  return languageFromSearch(window.location.search);
}

function syncLanguageQuery(lang: Language): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const current = url.searchParams.get("lang");
  if (lang === "es") {
    if (current === "es") return;
    url.searchParams.set("lang", "es");
  } else if (current === null) {
    return;
  } else {
    url.searchParams.delete("lang");
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== here) {
    window.history.replaceState(window.history.state, "", next);
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // English unless the URL asks for Spanish. Ignore navigator.language and any
  // saved localStorage value so the first paint matches the English link preview.
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);
  const [pathname] = useLocation();

  useLayoutEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (error) {
      console.warn("Failed to set document language:", error);
    }
    syncLanguageQuery(language);
  }, [language, pathname]);

  const setLanguage = (lang: Language) => {
    if (lang !== "es" && lang !== "en") {
      console.warn("Invalid language, using default:", lang);
      setLanguageState(defaultLanguage);
      return;
    }
    setLanguageState(lang);
  };

  let t: Translations;
  try {
    t = getTranslation(language);
  } catch (error) {
    console.error("Failed to get translation, using default:", error);
    t = defaultTranslations;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
