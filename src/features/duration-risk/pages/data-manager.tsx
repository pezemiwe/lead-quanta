import { useRef, useState } from "react";
import {
  Database,
  Upload,
  FileText,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { fmtNumber } from "../../valuation/utils";

export function DurationRiskDataManager() {
  const v = useDurationRisk();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastImportSummary, setLastImportSummary] = useState<{
    ok: boolean;
    count: number;
  } | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const r = v.loadFromCSV(text, file.name);
      setLastImportSummary({ ok: r.ok, count: r.count });
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Data Manager</h1>
        <p className="mt-1 text-sm text-gray-500">
          Load instruments to feed the duration, stress test, and ALM-gap
          engines.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Upload Instruments CSV"
          description="Drag a CSV file or browse from disk."
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragOver
                ? "border-primary bg-pale-red"
                : "border-border bg-gray-50"
            }`}
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-dark-gray">
                Drop CSV file here
              </p>
              <p className="text-xs text-gray-400">or click below to browse</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-1 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-mid-red"
            >
              Browse files
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Import from Portfolio Management"
          description="Load the live 204-instrument book from the Portfolio Management module."
        >
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-gradient-to-br from-pale-red to-white p-10 text-center">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium text-dark-gray">
                Portfolio Management Book
              </p>
              <p className="text-xs text-gray-400">
                204 instruments · FGN bonds, corporates, Eurobonds, CPs,
                T-Bills, equities &amp; more
              </p>
            </div>
            <button
              onClick={() => {
                v.loadSample();
                setLastImportSummary({ ok: true, count: 204 });
              }}
              className="mt-1 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-mid-red"
            >
              Import from Portfolio
            </button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Portfolio Status">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
              <Database className="h-3.5 w-3.5" /> Instruments loaded
            </div>
            <p className="mt-2 text-2xl font-bold text-dark-gray">
              {fmtNumber(v.instruments.length)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
              <FileText className="h-3.5 w-3.5" /> Last source
            </div>
            <p className="mt-2 text-sm font-medium text-dark-gray truncate">
              {v.lastUploadedFile || "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Duration-eligible
            </div>
            <p className="mt-2 text-2xl font-bold text-dark-gray">
              {fmtNumber(v.result.totals.instruments)}
            </p>
          </div>
        </div>

        {lastImportSummary && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-success">
            <CheckCircle2 className="h-4 w-4" />
            Imported {lastImportSummary.count} instruments successfully.
          </div>
        )}

        {v.parseErrors.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-primary">
            {v.parseErrors.slice(0, 10).map((e, i) => (
              <div key={i}>
                Row {e.row}: {e.message}
              </div>
            ))}
            {v.parseErrors.length > 10 && (
              <div className="mt-1">… and {v.parseErrors.length - 10} more</div>
            )}
          </div>
        )}

        {v.hasData && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                v.clear();
                setLastImportSummary(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-gray-500 hover:bg-pale-red hover:text-primary hover:border-primary"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear portfolio
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
