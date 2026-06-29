import * as XLSX from "xlsx";
import {
  Search,
  Download,
  SlidersHorizontal,
  Plus,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { AcronymTip } from "../../../components/shared/acronym-tip";
import { Drawer } from "../../../components/shared/drawer";
import { Button } from "../../../components/shared/button";
import {
  BOOK_INSTRUMENTS,
  BOOK_COMPUTED,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../../features/portfolio/engine/book-compute";
import type { Instrument } from "../../../features/valuation/engine/types";

const CUSTOM_KEY = "portfolio_custom_instruments";

const INSTRUMENT_TYPES = [
  "FGN Bond",
  "Corporate Bond",
  "State Bond",
  "Eurobond",
  "T-Bill",
  "Commercial Paper",
  "Promissory Note",
  "Bank Placement",
  "Fixed Deposit",
  "Mutual Fund",
  "Equity",
] as const;

const BLANK: Omit<Instrument, "id"> = {
  name: "",
  instrumentType: "FGN Bond",
  issuer: "",
  sector: "",
  classification: "AC",
  ifrs13Level: "L1",
  currency: "NGN",
  faceValue: 0,
  purchasePrice: 0,
  purchaseDate: new Date().toISOString().slice(0, 10),
  maturityDate: "",
  couponRate: 0,
  couponFrequency: "Semi",
  status: "Active",
};

function loadCustom(): Instrument[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as Instrument[]) : [];
  } catch {
    return [];
  }
}

type HoldingRow = {
  id: string;
  name: string;
  instrumentType: string;
  issuer: string;
  sector: string;
  classification: string;
  currency: string;
  faceValue: number;
  bookValueNGN: number;
  eirPct: number;
  couponRate: number;
  maturityDate: string | null;
  stage: string;
  status: string;
  [key: string]: unknown;
};

const valMap = new Map(
  BOOK_COMPUTED.valuations.map((v) => [v.instrument.id, v]),
);

function instrumentToRow(inst: Instrument): HoldingRow {
  const v = valMap.get(inst.id);
  return {
    id: inst.id,
    name: inst.name,
    instrumentType: inst.instrumentType as string,
    issuer: inst.issuer,
    sector: inst.sector,
    classification: inst.classification as string,
    currency: inst.currency as string,
    faceValue: inst.faceValue,
    bookValueNGN: v?.balanceSheetValueNGN ?? inst.faceValue,
    eirPct: v?.eir ?? 0,
    couponRate: inst.couponRate,
    maturityDate: inst.maturityDate ?? null,
    stage: inst.classification,
    status: inst.status as string,
  } as HoldingRow;
}

const STATIC_ROWS: HoldingRow[] = BOOK_INSTRUMENTS.map(instrumentToRow);

const ALL_TYPES = ["All", ...INSTRUMENT_TYPES].sort();
const ALL_CLASSIFICATIONS = ["All", "AC", "FVOCI", "FVTPL"];

const CLASS_STYLE: Record<string, { bg: string; text: string }> = {
  AC: { bg: "#FEE2E2", text: "#C8102E" },
  FVOCI: { bg: "#DBEAFE", text: "#1E3A5F" },
  FVTPL: { bg: "#FEF3C7", text: "#92400E" },
};
const STAGE_STYLE: Record<string, string> = {
  "Stage 1": "bg-emerald-50 text-emerald-700",
  "Stage 2": "bg-amber-50 text-amber-700",
  "Stage 3": "bg-red-50 text-primary",
};

const COLUMNS: DataTableColumn<HoldingRow>[] = [
  {
    key: "id",
    header: "ID",
    width: "80px",
    render: (r) => (
      <span className="font-mono text-xs text-dark-gray/50">{r.id}</span>
    ),
  },
  {
    key: "name",
    header: "Instrument",
    render: (r) => (
      <span className="font-medium text-dark-gray text-xs">{r.name}</span>
    ),
  },
  {
    key: "classification",
    header: "Classification",
    render: (r) => {
      const labels: Record<string, string> = {
        AC: "Amortised Cost",
        FVOCI: "Fair Value (OCI)",
        FVTPL: "Fair Value (P&L)",
      };
      return (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{
            background: CLASS_STYLE[r.classification]?.bg,
            color: CLASS_STYLE[r.classification]?.text,
          }}
        >
          {labels[r.classification] ?? r.classification}
        </span>
      );
    },
  },
  {
    key: "instrumentType",
    header: "Type",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">{r.instrumentType}</span>
    ),
  },
  {
    key: "issuer",
    header: "Issuer",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">{r.issuer}</span>
    ),
  },
  {
    key: "currency",
    header: "CCY",
    align: "center",
    render: (r) => (
      <span className="text-xs text-dark-gray/60">{r.currency}</span>
    ),
  },
  {
    key: "bookValueNGN",
    header: "Book Value (₦)",
    align: "right",
    render: (r) => (
      <span className="text-xs font-semibold text-dark-gray">
        {fmtCompact(r.bookValueNGN)}
      </span>
    ),
  },
  {
    key: "eirPct",
    header: <AcronymTip term="EIR" />,
    align: "right",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">
        {r.eirPct > 0 ? fmtPct(r.eirPct) : "—"}
      </span>
    ),
  },
  {
    key: "couponRate",
    header: "Coupon",
    align: "right",
    render: (r) => (
      <span className="text-xs text-dark-gray/70">
        {r.couponRate > 0 ? fmtPct(r.couponRate) : "—"}
      </span>
    ),
  },
  {
    key: "maturityDate",
    header: "Maturity",
    render: (r) => (
      <span className="text-xs text-dark-gray/60">
        {fmtDate(r.maturityDate)}
      </span>
    ),
  },
  {
    key: "stage",
    header: "Stage",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLE[r.stage] ?? "bg-gray-100 text-dark-gray/60"}`}
      >
        {r.stage}
      </span>
    ),
  },
];

export function PortfolioHoldings() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [customInstruments, setCustomInstruments] = useState<Instrument[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<Omit<Instrument, "id">>(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCustomInstruments(loadCustom());
  }, []);

  const ALL_ROWS = useMemo(
    () => [...STATIC_ROWS, ...customInstruments.map(instrumentToRow)],
    [customInstruments],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_ROWS.filter((r) => {
      if (typeFilter !== "All" && r.instrumentType !== typeFilter) return false;
      if (classFilter !== "All" && r.classification !== classFilter)
        return false;
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.issuer.toLowerCase().includes(q) &&
        !r.id.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [ALL_ROWS, search, typeFilter, classFilter]);

  const totalBookValue = filtered.reduce((s, r) => s + r.bookValueNGN, 0);

  const exportXlsx = () => {
    const headers = [
      "ID",
      "Instrument",
      "Issuer",
      "Type",
      "Classification",
      "Currency",
      "Face Value",
      "Book Value (NGN)",
      "EIR %",
      "Coupon Rate",
      "Maturity Date",
      "Stage",
      "Status",
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.name,
      r.issuer,
      r.instrumentType,
      r.classification,
      r.currency,
      r.faceValue,
      +r.bookValueNGN.toFixed(2),
      +(r.eirPct * 100).toFixed(4),
      +(r.couponRate * 100).toFixed(4),
      r.maturityDate ?? "",
      r.stage,
      r.status,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holdings");
    XLSX.writeFile(
      wb,
      `portfolio-holdings-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      const newInst: Instrument = {
        ...form,
        id: `INV-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      };
      const next = [...customInstruments, newInst];
      setCustomInstruments(next);
      try {
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setSaving(false);
      setAddOpen(false);
      setForm(BLANK);
    }, 500);
  }

  const formValid =
    form.name.trim() !== "" && form.issuer.trim() !== "" && form.faceValue > 0;

  const Field = ({
    label,
    hint,
    children,
  }: {
    label: string;
    hint?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-dark-gray">
        {label}
      </label>
      {hint && <p className="mb-1 text-xs text-dark-gray/50">{hint}</p>}
      {children}
    </div>
  );

  const inp =
    "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const sel = inp;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Holdings</h1>
          <p className="mt-1 text-sm text-dark-gray/50">
            {filtered.length} of {ALL_ROWS.length} instruments · Book value{" "}
            <span className="font-semibold text-dark-gray">
              {fmtCompact(totalBookValue)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Instrument
          </Button>
          <button
            onClick={exportXlsx}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-dark-gray/60 shadow-sm hover:border-primary hover:text-primary"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Amortised Cost",
            value: ALL_ROWS.filter((r) => r.classification === "AC").length,
          },
          {
            label: "Fair Value (OCI)",
            value: ALL_ROWS.filter((r) => r.classification === "FVOCI").length,
          },
          {
            label: "Fair Value (P&L)",
            value: ALL_ROWS.filter((r) => r.classification === "FVTPL").length,
          },
          {
            label: "Stage 2/3 Watch",
            value: ALL_ROWS.filter((r) => r.stage !== "Stage 1").length,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-dark-gray/50 font-medium">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-dark-gray">{s.value}</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-gray/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, issuer, ID…"
            className="rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary w-72"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-dark-gray/40" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface py-2 px-3 text-sm outline-none focus:border-primary"
          >
            {ALL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface py-2 px-3 text-sm outline-none focus:border-primary"
          >
            {ALL_CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>
                {c === "All"
                  ? "All Classifications"
                  : c === "AC"
                    ? "AC \u2014 Amortised Cost"
                    : c === "FVOCI"
                      ? "FVOCI \u2014 Fair Value (OCI)"
                      : c === "FVTPL"
                        ? "FVTPL \u2014 Fair Value (P&L)"
                        : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable<HoldingRow>
        columns={COLUMNS}
        data={filtered}
        keyExtractor={(r) => r.id}
        pageSize={25}
        emptyMessage="No instruments match your filters"
      />

      {/* ── Add Instrument Drawer ── */}
      <Drawer
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setForm(BLANK);
        }}
        title="Add Instrument"
        description="Enter the instrument details. It will be saved locally and appear in Holdings."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddOpen(false);
                setForm(BLANK);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!formValid || saving}
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </>
              ) : (
                "Save Instrument"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 pb-2">
          {/* Section: Identification */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dark-gray/40">
              Identification
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Instrument Name *">
                  <input
                    className={inp}
                    placeholder="e.g. FGN Bond 14.55% 2030"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Type *">
                <select
                  className={sel}
                  value={form.instrumentType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      instrumentType: e.target
                        .value as Instrument["instrumentType"],
                    }))
                  }
                >
                  {INSTRUMENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  className={sel}
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as Instrument["status"],
                    }))
                  }
                >
                  <option>Active</option>
                  <option>Matured</option>
                  <option>Sold</option>
                </select>
              </Field>
              <Field label="Issuer *">
                <input
                  className={inp}
                  placeholder="e.g. FGN, Access Bank"
                  value={form.issuer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, issuer: e.target.value }))
                  }
                />
              </Field>
              <Field label="Sector">
                <input
                  className={inp}
                  placeholder="e.g. Sovereign, Banking"
                  value={form.sector}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sector: e.target.value }))
                  }
                />
              </Field>
            </div>
          </div>

          {/* Section: Classification */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dark-gray/40">
              Classification &amp; Risk
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="IFRS 9 Classification *">
                <select
                  className={sel}
                  value={form.classification}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      classification: e.target
                        .value as Instrument["classification"],
                    }))
                  }
                >
                  <option value="AC">AC — Amortised Cost</option>
                  <option value="FVOCI">FVOCI — Fair Value (OCI)</option>
                  <option value="FVTPL">FVTPL — Fair Value (P&L)</option>
                </select>
              </Field>
              <Field label="IFRS 13 Level">
                <select
                  className={sel}
                  value={form.ifrs13Level}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ifrs13Level: e.target.value as Instrument["ifrs13Level"],
                    }))
                  }
                >
                  <option>L1</option>
                  <option>L2</option>
                  <option>L3</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Section: Economics */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dark-gray/40">
              Economics
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <select
                  className={sel}
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currency: e.target.value as Instrument["currency"],
                    }))
                  }
                >
                  <option>NGN</option>
                  <option>USD</option>
                  <option>GBP</option>
                  <option>EUR</option>
                </select>
              </Field>
              <Field
                label="Face Value *"
                hint="In instrument currency (absolute units)"
              >
                <input
                  type="number"
                  min={0}
                  className={inp}
                  placeholder="1000000000"
                  value={form.faceValue || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      faceValue: Number(e.target.value),
                    }))
                  }
                />
              </Field>
              <Field label="Purchase Price" hint="In instrument currency">
                <input
                  type="number"
                  min={0}
                  className={inp}
                  placeholder="Same as face value if at par"
                  value={form.purchasePrice || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      purchasePrice: Number(e.target.value),
                    }))
                  }
                />
              </Field>
              <Field
                label="Coupon Rate (%)"
                hint="Enter as percentage e.g. 14.55"
              >
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  className={inp}
                  placeholder="0 for zero-coupon"
                  value={
                    form.couponRate ? (form.couponRate * 100).toFixed(4) : ""
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      couponRate: Number(e.target.value) / 100,
                    }))
                  }
                />
              </Field>
              <Field label="Coupon Frequency">
                <select
                  className={sel}
                  value={form.couponFrequency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      couponFrequency: e.target
                        .value as Instrument["couponFrequency"],
                    }))
                  }
                >
                  <option>Annual</option>
                  <option>Semi</option>
                  <option>Quarterly</option>
                  <option>Monthly</option>
                  <option>Zero</option>
                  <option>N/A</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Section: Dates */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dark-gray/40">
              Dates
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Purchase Date *">
                <input
                  type="date"
                  className={inp}
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                  }
                />
              </Field>
              <Field label="Maturity Date">
                <input
                  type="date"
                  className={inp}
                  value={form.maturityDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maturityDate: e.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
