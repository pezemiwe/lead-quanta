import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { Modal } from "../../../components/shared/modal";
import { Button } from "../../../components/shared/button";
import {
  MOODY_PD_CUM,
  MOODY_RR,
  SP_SOV_FCY_PD_CUM,
  SP_SOV_LCY_PD_CUM,
} from "../engine/reference-data";

type Table = "Moody Corporate" | "S&P Sovereign FCY" | "S&P Sovereign LCY" | "Moody RR";

const DEFAULTS: Record<Table, Record<string, number[]>> = {
  "Moody Corporate": MOODY_PD_CUM,
  "S&P Sovereign FCY": SP_SOV_FCY_PD_CUM,
  "S&P Sovereign LCY": SP_SOV_LCY_PD_CUM,
  "Moody RR": MOODY_RR,
};

const RR_DIVIDERS = new Set(["Caa-C"]); // row after which a divider appears

const STORAGE_KEY = "iqfd_table_overrides";

type Overrides = Partial<Record<Table, Record<string, number[]>>>;

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

function parseCsv(text: string): Record<string, number[]> | string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return "CSV must have a header row and at least one data row.";
  const result: Record<string, number[]> = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const rating = cols[0];
    if (!rating) continue;
    const values = cols
      .slice(1)
      .map((v) => parseFloat(v.replace("%", "")))
      .filter((n) => !isNaN(n));
    if (values.length === 0) continue;
    result[rating] = values;
  }
  if (Object.keys(result).length === 0) return "No valid data rows found.";
  return result;
}

interface Row extends Record<string, unknown> {
  rating: string;
  values: number[];
  isDivider?: boolean;
}

export function IFRS9PDTables() {
  const [active, setActive] = useState<Table>("Moody Corporate");
  const [overrides, setOverrides] = useState<Overrides>({});
  const [importOpen, setImportOpen] = useState(false);
  const [importTable, setImportTable] = useState<Table>("Moody Corporate");
  const [importStatus, setImportStatus] = useState<"idle" | "ok" | "err">("idle");
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingData, setPendingData] = useState<Record<string, number[]> | null>(null);

  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  const tableData = useMemo(
    () => overrides[active] ?? DEFAULTS[active],
    [active, overrides],
  );

  const isRR = active === "Moody RR";

  const rows = useMemo<Row[]>(
    () =>
      Object.entries(tableData).map(([rating, values]) => ({
        rating,
        values,
      })),
    [tableData],
  );

  const horizons = rows[0]?.values.length ?? 0;

  const cols: DataTableColumn<Row>[] = [
    {
      key: "rating",
      header: "Rating",
      width: "110px",
      render: (r) => (
        <span
          className={
            "font-mono font-semibold " +
            (isRR && (r.rating === "IG" || r.rating === "SG" || r.rating === "All")
              ? "text-deep-red"
              : "text-dark-gray")
          }
        >
          {r.rating}
        </span>
      ),
    },
    ...Array.from({ length: horizons }).map<DataTableColumn<Row>>((_, i) => ({
      key: `y${i + 1}`,
      header: `Y${i + 1}`,
      align: "right" as const,
      render: (r) => (
        <span className="font-mono text-xs">{r.values[i].toFixed(2)}%</span>
      ),
    })),
  ];

  function handleFile(file: File) {
    setImportStatus("idle");
    setImportMsg("");
    setPendingData(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);
      if (typeof result === "string") {
        setImportStatus("err");
        setImportMsg(result);
      } else {
        setPendingData(result);
        const rowCount = Object.keys(result).length;
        const horizonCount = Object.values(result)[0]?.length ?? 0;
        setImportStatus("ok");
        setImportMsg(`Parsed ${rowCount} ratings × ${horizonCount} horizons. Click "Apply" to save.`);
      }
    };
    reader.readAsText(file);
  }

  function handleApply() {
    if (!pendingData) return;
    setImporting(true);
    setTimeout(() => {
      const next: Overrides = { ...overrides, [importTable]: pendingData };
      setOverrides(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      setImporting(false);
      setImportOpen(false);
      setImportStatus("idle");
      setImportMsg("");
      setPendingData(null);
      setActive(importTable);
    }, 400);
  }

  function handleCloseImport() {
    setImportOpen(false);
    setImportStatus("idle");
    setImportMsg("");
    setPendingData(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const hasOverride = (t: Table) => !!overrides[t];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            PD Term Structures &amp; Recovery Rates
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            Cumulative probability of default and Moody&apos;s recovery rates by
            rating bucket and horizon (year).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setImportTable(active);
            setImportOpen(true);
          }}
        >
          <Upload className="h-3.5 w-3.5" />
          Update via CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(DEFAULTS) as Table[]).map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={
              k === active
                ? "rounded-lg border border-primary bg-pale-red px-3 py-1.5 text-xs font-medium text-deep-red"
                : "rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-dark-gray/70 hover:border-primary/40 hover:bg-pale-red/40"
            }
          >
            {k}
            {hasOverride(k) && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-deep-red align-middle" />
            )}
          </button>
        ))}
      </div>

      {isRR && (
        <p className="text-xs text-dark-gray/50">
          Mean recovery rates (%) by broad rating group and time horizon.
          IG / SG / All rows are aggregate averages.
        </p>
      )}

      <SectionCard noPadding>
        <DataTable
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.rating}
          emptyMessage="No data"
          rowClassName={(r) =>
            isRR && (r.rating === "IG" || r.rating === "SG" || r.rating === "All")
              ? "border-t border-border/60 bg-pale-red/20"
              : isRR && RR_DIVIDERS.has(r.rating)
                ? "border-b border-border/60"
                : ""
          }
        />
      </SectionCard>

      {/* ── Import Modal ── */}
      <Modal
        isOpen={importOpen}
        onClose={handleCloseImport}
        title="Update Table via CSV"
        description="Upload a CSV to replace data for the selected table. Changes are saved locally in your browser."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCloseImport}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!pendingData}
              loading={importing}
            >
              Apply
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Table selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-dark-gray">
              Table to update
            </label>
            <select
              value={importTable}
              onChange={(e) => {
                setImportTable(e.target.value as Table);
                setImportStatus("idle");
                setImportMsg("");
                setPendingData(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-dark-gray focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {(Object.keys(DEFAULTS) as Table[]).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* File upload */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-dark-gray">
              CSV file
            </label>
            <p className="mb-2 text-xs text-dark-gray/50">
              Expected format: first column = Rating, remaining columns = Y1, Y2, … (numeric, % optional).
            </p>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-4 py-3 transition hover:border-primary/60 hover:bg-pale-red/20">
              <Upload className="h-4 w-4 shrink-0 text-dark-gray/40" />
              <span className="text-sm text-dark-gray/60">
                {fileRef.current?.files?.[0]?.name ?? "Click to choose a .csv file"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          </div>

          {/* Status */}
          {importStatus !== "idle" && (
            <div
              className={
                "flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs " +
                (importStatus === "ok"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700")
              }
            >
              {importStatus === "ok" ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              {importMsg}
            </div>
          )}

          {/* Reset override */}
          {hasOverride(importTable) && (
            <button
              className="text-xs text-dark-gray/50 underline underline-offset-2 hover:text-deep-red"
              onClick={() => {
                const next: Overrides = { ...overrides };
                delete next[importTable];
                setOverrides(next);
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                  // ignore
                }
                setImportStatus("idle");
                setImportMsg("");
                setPendingData(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Reset to default data for {importTable}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

