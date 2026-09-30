// Reports are remembered only in this browser; the server has no lookup by email.
const KEY = "adapty.myReports";
const MAX = 20;

export interface SavedReport {
  id: string;
  createdAt: string;
  riskLevel: string;
  totalScore: number;
}

export function getSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReport(report: SavedReport) {
  try {
    const rest = getSavedReports().filter((r) => r.id !== report.id);
    localStorage.setItem(KEY, JSON.stringify([report, ...rest].slice(0, MAX)));
  } catch {
    // storage unavailable (private mode); the report is still reachable from the results page
  }
}

export function clearSavedReports() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
