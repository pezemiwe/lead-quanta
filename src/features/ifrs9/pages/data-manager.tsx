import { useRef, useState } from "react";
import {
  Download,
  Upload,
  Database,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Button } from "../../../components/shared/button";
import { Badge } from "../../../components/shared/badge";
import { useIFRS9 } from "../store";

const TEMPLATE_PATH = "/templates/ifrs9/securities-template.csv";

export function IFRS9DataManager() {
  const {
    hasData,
    securities,
    lastUploadedFile,
    parseErrors,
    loadSample,
    loadFromCSV,
    clear,
  } = useIFRS9();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    tone: "success" | "danger";
    msg: string;
  } | null>(null);

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const res = loadFromCSV(text, file.name);
      if (res.ok) {
        setToast({
          tone: "success",
          msg: `Loaded ${res.count} instruments from ${file.name}${res.errors.length ? ` (${res.errors.length} rows skipped)` : ""}. Navigate to any page to see results.`,
        });
      } else {
        setToast({
          tone: "danger",
          msg: `No instruments parsed. ${res.errors[0]?.message ?? ""}`,
        });
      }
    } catch (err) {
      setToast({
        tone: "danger",
        msg: `Failed to read file: ${(err as Error).message}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            Data Manager
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            Download the template, populate it with your debt-securities book,
            and upload to run ECL.
          </p>
        </div>
        {hasData && (
          <Badge variant="success" size="lg" dot>
            {securities.length} instruments loaded
          </Badge>
        )}
      </div>

      {toast && (
        <div
          className={
            toast.tone === "success"
              ? "flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          {toast.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Step 1 — Download */}
        <SectionCard>
          <div className="flex flex-col gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pale-red text-primary">
              <Download className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-gray/50">
                Step 1
              </p>
              <h3 className="mt-0.5 text-base font-semibold text-dark-gray">
                Download template
              </h3>
              <p className="mt-1 text-sm text-dark-gray/60">
                CSV with 26 columns covering counterparty, exposure, ratings,
                coupons and performance — pre-populated with 24 sample rows so
                you can see the exact format.
              </p>
            </div>
            <a href={TEMPLATE_PATH} download="securities-template.csv">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
              >
                Download securities-template.csv
              </Button>
            </a>
          </div>
        </SectionCard>

        {/* Step 2 — Upload */}
        <SectionCard>
          <div className="flex flex-col gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pale-red text-primary">
              <Upload className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-gray/50">
                Step 2
              </p>
              <h3 className="mt-0.5 text-base font-semibold text-dark-gray">
                Upload your book
              </h3>
              <p className="mt-1 text-sm text-dark-gray/60">
                Drop the populated CSV here. Columns are matched by name, so you
                can reorder or add headers freely.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="h-3.5 w-3.5" />}
              loading={busy}
              onClick={() => fileRef.current?.click()}
            >
              Choose CSV file
            </Button>
          </div>
        </SectionCard>

        {/* Step 3 — Run / Sample */}
        <SectionCard>
          <div className="flex flex-col gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pale-red text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-gray/50">
                Step 3
              </p>
              <h3 className="mt-0.5 text-base font-semibold text-dark-gray">
                Import from Portfolio Management
              </h3>
              <p className="mt-1 text-sm text-dark-gray/60">
                Skip the upload and import the live 204-instrument book directly
                from Portfolio Management. Engine re-computes ECL automatically.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => {
                loadSample();
                setToast({
                  tone: "success",
                  msg: "Portfolio Management book imported — 204 instruments. Navigate to any page to see results.",
                });
              }}
            >
              Import from Portfolio
            </Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Current Working Set"
        description="What the IFRS 9 engine is currently scoring"
        actions={
          hasData && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => {
                clear();
                setToast(null);
              }}
            >
              Clear
            </Button>
          )
        }
      >
        {hasData ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Cell label="Source" value={lastUploadedFile ?? "—"} />
            <Cell label="Instruments" value={String(securities.length)} />
            <Cell
              label="Corporates"
              value={String(
                securities.filter((s) => s.assetSpecification === "Corporate")
                  .length,
              )}
            />
            <Cell
              label="Sovereigns"
              value={String(
                securities.filter((s) => s.assetSpecification !== "Corporate")
                  .length,
              )}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Database className="h-8 w-8 text-dark-gray/30" />
            <p className="text-sm font-medium text-dark-gray">
              No data loaded yet
            </p>
            <p className="text-xs text-dark-gray/55">
              Upload a CSV or load the sample portfolio to begin.
            </p>
          </div>
        )}
      </SectionCard>

      {parseErrors.length > 0 && (
        <SectionCard
          title="Parse Warnings"
          description={`${parseErrors.length} rows were skipped during the last upload`}
        >
          <ul className="space-y-1 text-xs text-dark-gray/70">
            {parseErrors.slice(0, 20).map((e, i) => (
              <li key={i}>
                <span className="font-mono text-deep-red">Row {e.row}:</span>{" "}
                {e.message}
              </li>
            ))}
            {parseErrors.length > 20 && (
              <li className="text-dark-gray/50">
                …and {parseErrors.length - 20} more
              </li>
            )}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-dark-gray/55">{label}</p>
      <p
        className="mt-1 truncate text-sm font-semibold text-dark-gray"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
