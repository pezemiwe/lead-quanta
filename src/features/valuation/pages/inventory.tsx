import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useValuation } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtNumber, CLASSIFICATION_BADGE } from "../utils";
import { AcronymTip } from "../../../components/shared/acronym-tip";
import type {
  Classification,
  CouponFrequency,
  Currency,
  IFRS13Level,
  Instrument,
  InstrumentType,
} from "../engine/types";

const ALL_TYPES: ("All" | InstrumentType)[] = [
  "All",
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
];

const ALL_CLASSES: ("All" | Classification)[] = ["All", "AC", "FVOCI", "FVTPL"];

export function ValuationInventory() {
  const v = useValuation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | InstrumentType>("All");
  const [classFilter, setClassFilter] = useState<"All" | Classification>("All");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Instrument | null>(null);
  const [deleting, setDeleting] = useState<Instrument | null>(null);

  if (!v.hasData) return <EmptyPortfolio />;

  const filtered = v.instruments.filter((i) => {
    const matchType = typeFilter === "All" || i.instrumentType === typeFilter;
    const matchClass =
      classFilter === "All" || i.classification === classFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      i.id.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.issuer.toLowerCase().includes(q) ||
      i.sector.toLowerCase().includes(q);
    return matchType && matchClass && matchSearch;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Asset Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} of {v.instruments.length} instruments in scope
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-mid-red"
        >
          <Plus className="h-4 w-4" /> Add Instrument
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, name, issuer or sector…"
            className="w-72 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "All Types" : t}
            </option>
          ))}
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value as typeof classFilter)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {ALL_CLASSES.map((c) => (
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

      <SectionCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">ID</th>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-left">Type</th>
                <th className="px-4 py-2.5 text-left">Classification</th>
                <th className="px-4 py-2.5 text-left">Impairment Stage</th>
                <th className="px-4 py-2.5 text-right">
                  Balance Sheet Value (NGN)
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const valuation = v.result.valuations.find(
                  (vv) => vv.instrument.id === i.id,
                );
                const bs = valuation?.balanceSheetValueNGN ?? 0;
                return (
                  <tr
                    key={i.id}
                    onClick={() => navigate(`/valuation/asset/${i.id}`)}
                    className="cursor-pointer border-b border-border/60 hover:bg-pale-red/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-dark-gray">
                      {i.id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark-gray">{i.name}</p>
                      <p className="text-xs text-gray-400">
                        {i.issuer} · {i.sector}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {i.instrumentType}
                    </td>
                    <td className="px-4 py-3">
                      <AcronymTip term={i.classification}>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CLASSIFICATION_BADGE[i.classification]}`}
                        >
                          {i.classification}
                        </span>
                      </AcronymTip>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {fmtNumber(bs, 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setEditing(i)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleting(i)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="ml-1 h-4 w-4 text-gray-300" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-400"
                  >
                    No instruments match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {adding && <AddInstrumentDrawer onClose={() => setAdding(false)} />}
      {editing && (
        <EditInstrumentDrawer
          instrument={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDeleting(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-dark-gray">
              Delete Instrument
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Remove{" "}
              <span className="font-medium text-dark-gray">
                {deleting.name}
              </span>{" "}
              ({deleting.id}) from the portfolio? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  v.removeInstrument(deleting.id);
                  setDeleting(null);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── add instrument drawer ─────────────────────────────── */
function AddInstrumentDrawer({ onClose }: { onClose: () => void }) {
  const v = useValuation();
  const [draft, setDraft] = useState<Instrument>({
    id: `INV-${String(Math.floor(Math.random() * 900) + 100)}`,
    name: "",
    instrumentType: "Corporate Bond",
    issuer: "",
    sector: "",
    classification: "AC",
    ifrs13Level: "L2",
    currency: "NGN",
    faceValue: 100_000_000,
    purchasePrice: 97_000_000,
    purchaseDate: new Date().toISOString().slice(0, 10),
    maturityDate: new Date(Date.now() + 5 * 365 * 86_400_000)
      .toISOString()
      .slice(0, 10),
    couponRate: 0.15,
    couponFrequency: "Semi",
    status: "Active",
  });
  const [err, setErr] = useState<string | null>(null);

  const save = () => {
    if (!draft.id || !draft.name) {
      setErr("ID and Name are required.");
      return;
    }
    if (v.instruments.some((i) => i.id === draft.id)) {
      setErr("Instrument ID already exists.");
      return;
    }
    v.addInstrument(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-dark-gray">
              Add Instrument
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Manually add a new fixed-income holding to the portfolio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-primary">
            {err}
          </div>
        )}

        <div className="space-y-3">
          <Field label="Instrument ID">
            <input
              value={draft.id}
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instrument Type">
              <select
                value={draft.instrumentType}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    instrumentType: e.target.value as InstrumentType,
                  })
                }
                className={inputCls}
              >
                {ALL_TYPES.filter((t) => t !== "All").map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Classification">
              <select
                value={draft.classification}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    classification: e.target.value as Classification,
                  })
                }
                className={inputCls}
              >
                <option>AC</option>
                <option>FVOCI</option>
                <option>FVTPL</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issuer">
              <input
                value={draft.issuer}
                onChange={(e) => setDraft({ ...draft, issuer: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Sector">
              <input
                value={draft.sector}
                onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Currency">
              <select
                value={draft.currency}
                onChange={(e) =>
                  setDraft({ ...draft, currency: e.target.value as Currency })
                }
                className={inputCls}
              >
                <option>NGN</option>
                <option>USD</option>
                <option>GBP</option>
                <option>EUR</option>
              </select>
            </Field>
            <Field label="IFRS 13 Level">
              <select
                value={draft.ifrs13Level}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ifrs13Level: e.target.value as IFRS13Level,
                  })
                }
                className={inputCls}
              >
                <option>L1</option>
                <option>L2</option>
                <option>L3</option>
              </select>
            </Field>
            <Field label="Frequency">
              <select
                value={draft.couponFrequency}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    couponFrequency: e.target.value as CouponFrequency,
                  })
                }
                className={inputCls}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Face Value">
              <input
                type="number"
                value={draft.faceValue}
                onChange={(e) =>
                  setDraft({ ...draft, faceValue: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Purchase Price">
              <input
                type="number"
                value={draft.purchasePrice}
                onChange={(e) =>
                  setDraft({ ...draft, purchasePrice: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Date">
              <input
                type="date"
                value={draft.purchaseDate}
                onChange={(e) =>
                  setDraft({ ...draft, purchaseDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Maturity Date">
              <input
                type="date"
                value={draft.maturityDate}
                onChange={(e) =>
                  setDraft({ ...draft, maturityDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Coupon Rate (decimal)">
              <input
                type="number"
                step="0.0001"
                value={draft.couponRate}
                onChange={(e) =>
                  setDraft({ ...draft, couponRate: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            Add Instrument
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ─── edit instrument drawer ────────────────────────────── */
function EditInstrumentDrawer({
  instrument,
  onClose,
}: {
  instrument: Instrument;
  onClose: () => void;
}) {
  const v = useValuation();
  const [draft, setDraft] = useState<Instrument>({ ...instrument });

  const save = () => {
    v.updateInstrument(instrument.id, draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-dark-gray">
              Edit Instrument
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {instrument.id} — changes are applied immediately.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Instrument ID">
            <input
              value={draft.id}
              readOnly
              className={`${inputCls} bg-gray-50 text-gray-400`}
            />
          </Field>
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instrument Type">
              <select
                value={draft.instrumentType}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    instrumentType: e.target.value as InstrumentType,
                  })
                }
                className={inputCls}
              >
                {ALL_TYPES.filter((t) => t !== "All").map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Classification">
              <select
                value={draft.classification}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    classification: e.target.value as Classification,
                  })
                }
                className={inputCls}
              >
                <option>AC</option>
                <option>FVOCI</option>
                <option>FVTPL</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issuer">
              <input
                value={draft.issuer}
                onChange={(e) => setDraft({ ...draft, issuer: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Sector">
              <input
                value={draft.sector}
                onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Currency">
              <select
                value={draft.currency}
                onChange={(e) =>
                  setDraft({ ...draft, currency: e.target.value as Currency })
                }
                className={inputCls}
              >
                <option>NGN</option>
                <option>USD</option>
                <option>GBP</option>
                <option>EUR</option>
              </select>
            </Field>
            <Field label="IFRS 13 Level">
              <select
                value={draft.ifrs13Level}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ifrs13Level: e.target.value as IFRS13Level,
                  })
                }
                className={inputCls}
              >
                <option>L1</option>
                <option>L2</option>
                <option>L3</option>
              </select>
            </Field>
            <Field label="Frequency">
              <select
                value={draft.couponFrequency}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    couponFrequency: e.target.value as CouponFrequency,
                  })
                }
                className={inputCls}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Face Value">
              <input
                type="number"
                value={draft.faceValue}
                onChange={(e) =>
                  setDraft({ ...draft, faceValue: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Purchase Price">
              <input
                type="number"
                value={draft.purchasePrice}
                onChange={(e) =>
                  setDraft({ ...draft, purchasePrice: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Date">
              <input
                type="date"
                value={draft.purchaseDate}
                onChange={(e) =>
                  setDraft({ ...draft, purchaseDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Maturity Date">
              <input
                type="date"
                value={draft.maturityDate}
                onChange={(e) =>
                  setDraft({ ...draft, maturityDate: e.target.value })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Coupon Rate (decimal)">
              <input
                type="number"
                step="0.0001"
                value={draft.couponRate}
                onChange={(e) =>
                  setDraft({ ...draft, couponRate: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
