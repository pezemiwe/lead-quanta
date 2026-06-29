import type { DealSlipStatus } from "../../workflow/types";

export interface BlotterFilters {
  search: string;
  assetFilter: string;
  portfolioFilter: string;
  settlementFilter: string;
  statusFilter: DealSlipStatus[];
  dateFrom: string;
  dateTo: string;
  myDealsOnly: boolean;
  limitAlertOnly: boolean;
}

export interface SavedBlotterView {
  id: string;
  name: string;
  filters: BlotterFilters;
  createdAt: string;
}

export const DEFAULT_BLOTTER_FILTERS: BlotterFilters = {
  search: "",
  assetFilter: "All",
  portfolioFilter: "All",
  settlementFilter: "All",
  statusFilter: [],
  dateFrom: "",
  dateTo: "",
  myDealsOnly: false,
  limitAlertOnly: false,
};

const STORAGE_PREFIX = "lead-quanta-blotter-views";

function storageKey(personaKey: string): string {
  return `${STORAGE_PREFIX}:${personaKey}`;
}

export function loadSavedViews(personaKey: string): SavedBlotterView[] {
  try {
    const raw = localStorage.getItem(storageKey(personaKey));
    if (!raw) return [];
    return JSON.parse(raw) as SavedBlotterView[];
  } catch {
    return [];
  }
}

export function persistSavedViews(personaKey: string, views: SavedBlotterView[]): void {
  localStorage.setItem(storageKey(personaKey), JSON.stringify(views));
}

export function saveBlotterView(
  personaKey: string,
  name: string,
  filters: BlotterFilters,
): SavedBlotterView[] {
  const views = loadSavedViews(personaKey);
  const view: SavedBlotterView = {
    id: `view-${Date.now()}`,
    name,
    filters: { ...filters, statusFilter: [...filters.statusFilter] },
    createdAt: new Date().toISOString(),
  };
  const next = [view, ...views].slice(0, 12);
  persistSavedViews(personaKey, next);
  return next;
}

export function deleteSavedView(personaKey: string, id: string): SavedBlotterView[] {
  const next = loadSavedViews(personaKey).filter((v) => v.id !== id);
  persistSavedViews(personaKey, next);
  return next;
}

/** Built-in presets — not persisted */
export const BUILTIN_PRESETS: { id: string; name: string; apply: (f: BlotterFilters) => BlotterFilters }[] = [
  {
    id: "preset-open",
    name: "Open pipeline",
    apply: (f) => ({
      ...f,
      limitAlertOnly: false,
      statusFilter: [
        "Draft",
        "Submitted",
        "Under Review",
        "Returned for Amendment",
        "Approved",
        "Pending Settlement",
      ],
    }),
  },
  {
    id: "preset-pending",
    name: "Pending approval",
    apply: (f) => ({
      ...f,
      limitAlertOnly: false,
      statusFilter: ["Submitted", "Under Review"],
    }),
  },
  {
    id: "preset-settling",
    name: "Settling this week",
    apply: (f) => ({
      ...f,
      limitAlertOnly: false,
      statusFilter: ["Approved", "Pending Settlement"],
      settlementFilter: "All",
    }),
  },
  {
    id: "preset-limit",
    name: "Limit alerts",
    apply: (f) => ({
      ...f,
      statusFilter: [],
      limitAlertOnly: true,
    }),
  },
];
