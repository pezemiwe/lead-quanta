import { useState } from "react";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  BarChart2,
  DollarSign,
} from "lucide-react";
import {
  usePortfolioRegistry,
  type Portfolio,
  type PortfolioType,
  type PortfolioStatus,
  type PortfolioMandate,
} from "../portfolio-registry";

/* -------------------------------------------------------
   Portfolio Books page
   Lists all registered portfolio books and lets users
   create, edit, and deactivate them.
------------------------------------------------------- */

const TYPE_COLORS: Record<PortfolioType, string> = {
  Trading: "bg-blue-100 text-blue-700",
  Banking: "bg-purple-100 text-purple-700",
  HTM: "bg-green-100 text-green-700",
  AFS: "bg-orange-100 text-orange-700",
  Custom: "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<PortfolioStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-yellow-100 text-yellow-700",
  Archived: "bg-gray-100 text-gray-500",
};

interface FormValues {
  name: string;
  type: PortfolioType;
  baseCurrency: string;
  description: string;
  manager: string;
  mandatedBy: string;
  strategy: string;
  status: PortfolioStatus;
  mandate: PortfolioMandate | "";
}

const BLANK: FormValues = {
  name: "",
  type: "Custom",
  baseCurrency: "NGN",
  description: "",
  manager: "",
  mandatedBy: "",
  strategy: "",
  status: "Active",
  mandate: "",
};

const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "JPY", "ZAR"];
const TYPES: PortfolioType[] = ["Trading", "Banking", "HTM", "AFS", "Custom"];
const STATUSES: PortfolioStatus[] = ["Active", "Inactive", "Archived"];

/* -------------------------------------------------------
   Modal
------------------------------------------------------- */
function PortfolioModal({
  initial,
  title,
  onSave,
  onClose,
}: {
  initial: FormValues;
  title: string;
  onSave: (v: FormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormValues>(initial);

  function field(key: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-xl p-6 mx-4">
        <h2 className="text-base font-bold text-dark-gray mb-5">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Portfolio Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="e.g. AFS Fixed Income 2024"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-dark-gray/70 mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => field("type", e.target.value as PortfolioType)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-medium text-dark-gray/70 mb-1">
                Base Currency
              </label>
              <select
                value={form.baseCurrency}
                onChange={(e) => field("baseCurrency", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manager */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Portfolio Manager
            </label>
            <input
              type="text"
              value={form.manager}
              onChange={(e) => field("manager", e.target.value)}
              placeholder="e.g. Head of Fixed Income"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Mandated by */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Mandated By
            </label>
            <input
              type="text"
              value={form.mandatedBy}
              onChange={(e) => field("mandatedBy", e.target.value)}
              placeholder="e.g. Investment Committee"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
              rows={2}
              placeholder="Brief description of the portfolio mandate"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Strategy */}
          <div>
            <label className="block text-xs font-medium text-dark-gray/70 mb-1">
              Strategy
            </label>
            <input
              type="text"
              value={form.strategy}
              onChange={(e) => field("strategy", e.target.value)}
              placeholder="e.g. Buy and hold, Active trading..."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-dark-gray/70 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => field("status", e.target.value as PortfolioStatus)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Mandate type */}
            <div>
              <label className="block text-xs font-medium text-dark-gray/70 mb-1">
                Mandate Type
              </label>
              <select
                value={form.mandate}
                onChange={(e) => field("mandate", e.target.value as PortfolioMandate | "")}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Not specified</option>
                <option value="Discretionary">Discretionary</option>
                <option value="Non-Discretionary">Non-Discretionary</option>
              </select>
            </div>
          </div>

          {form.mandate && (
            <div className="rounded-lg border border-border bg-gray-50 p-3 text-xs text-gray-600">
              {form.mandate === "Discretionary"
                ? "Discretionary — the Portfolio Manager may trade without prior client approval on each individual transaction. The PM has full authority to execute within the agreed mandate."
                : "Non-Discretionary — each investment decision must be approved by the client or investment committee before execution. The PM advises but does not act independently."}
            </div>
          )}

          {/* actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Save Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Detail panel (right slide-in)
------------------------------------------------------- */
function DetailPanel({
  portfolio,
  onClose,
  onEdit,
}: {
  portfolio: Portfolio;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border bg-surface overflow-y-auto animate-in slide-in-from-right-4 duration-150">
      {/* header */}
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              TYPE_COLORS[portfolio.type]
            }`}
          >
            {portfolio.type}
          </span>
          <h3 className="mt-1.5 text-sm font-bold text-dark-gray">
            {portfolio.name}
          </h3>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_COLORS[portfolio.status]
            }`}
          >
            {portfolio.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:text-dark-gray hover:bg-gray-100"
          aria-label="Close panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border">
        <div className="rounded-lg border border-border bg-surface-muted p-3">
          <div className="flex items-center gap-1.5 text-xs text-dark-gray/50 mb-1">
            <BarChart2 className="h-3.5 w-3.5" />
            Instruments
          </div>
          <p className="text-lg font-bold text-dark-gray">
            {portfolio.instrumentCount ?? "-"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted p-3">
          <div className="flex items-center gap-1.5 text-xs text-dark-gray/50 mb-1">
            <DollarSign className="h-3.5 w-3.5" />
            Currency
          </div>
          <p className="text-lg font-bold text-dark-gray">
            {portfolio.baseCurrency}
          </p>
        </div>
      </div>

      {/* fields */}
      <div className="flex-1 p-4 space-y-4 text-sm">
        {portfolio.description && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Description
            </p>
            <p className="text-dark-gray/80">{portfolio.description}</p>
          </div>
        )}
        {portfolio.manager && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Portfolio Manager
            </p>
            <p className="text-dark-gray/80">{portfolio.manager}</p>
          </div>
        )}
        {portfolio.mandatedBy && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Mandated By
            </p>
            <p className="text-dark-gray/80">{portfolio.mandatedBy}</p>
          </div>
        )}
        {portfolio.strategy && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Strategy
            </p>
            <p className="text-dark-gray/80">{portfolio.strategy}</p>
          </div>
        )}
        {portfolio.mandate && (
          <div>
            <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
              Mandate Type
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  portfolio.mandate === "Discretionary"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {portfolio.mandate}
              </span>
              <span className="text-xs text-dark-gray/50">
                {portfolio.mandate === "Discretionary"
                  ? "PM may trade without prior client approval"
                  : "Each decision requires committee sign-off"}
              </span>
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
            Created
          </p>
          <p className="text-dark-gray/80">{portfolio.createdAt}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-dark-gray/40 tracking-wide mb-1">
            ID
          </p>
          <p className="font-mono text-xs text-dark-gray/60">{portfolio.id}</p>
        </div>
      </div>

      {/* footer actions */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onEdit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Portfolio
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Main component
------------------------------------------------------- */
export function PortfolioBooks() {
  const { portfolios, addPortfolio, updatePortfolio, removePortfolio } =
    usePortfolioRegistry();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Portfolio | null>(null);
  const [selected, setSelected] = useState<Portfolio | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Portfolio | null>(null);

  function handleCreate(v: FormValues) {
    const patch = { ...v, mandate: v.mandate || undefined };
    const newP = addPortfolio(patch);
    setSelected(newP);
  }

  function handleEdit(v: FormValues) {
    if (!editing) return;
    const patch = { ...v, mandate: v.mandate || undefined };
    updatePortfolio(editing.id, patch);
    setSelected((prev) => (prev?.id === editing.id ? { ...prev, ...patch } : prev));
  }

  function handleDelete(p: Portfolio) {
    removePortfolio(p.id);
    if (selected?.id === p.id) setSelected(null);
    setConfirmDelete(null);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* list column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold text-dark-gray">
              Portfolio Books
            </h1>
            <p className="mt-0.5 text-sm text-dark-gray/50">
              {portfolios.length} portfolio{portfolios.length !== 1 ? "s" : ""}{" "}
              registered
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Portfolio
          </button>
        </div>

        {/* table */}
        <div className="flex-1 overflow-y-auto p-6">
          {portfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FolderOpen className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-dark-gray/60">
                No portfolios yet
              </p>
              <p className="text-xs text-dark-gray/40 mt-1">
                Click "Add Portfolio" to create the first portfolio book.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {portfolios.map((p) => {
                const isSelected = selected?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected(isSelected ? null : p)}
                    className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-pale-red"
                        : "border-border bg-surface hover:border-primary/30 hover:bg-gray-50"
                    }`}
                  >
                    {/* icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        TYPE_COLORS[p.type]
                      }`}
                    >
                      <FolderOpen className="h-5 w-5" />
                    </div>

                    {/* name + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-dark-gray truncate">
                          {p.name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            TYPE_COLORS[p.type]
                          }`}
                        >
                          {p.type}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[p.status]
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-dark-gray/50 truncate">
                        {p.description || "No description"}
                      </p>
                    </div>

                    {/* right meta */}
                    <div className="shrink-0 flex items-center gap-4 text-xs text-dark-gray/50">
                      <span>{p.baseCurrency}</span>
                      {p.instrumentCount != null && (
                        <span>{p.instrumentCount} instruments</span>
                      )}
                      <span>{p.createdAt}</span>
                    </div>

                    {/* actions */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded p-1.5 text-gray-400 hover:text-dark-gray hover:bg-gray-100"
                        aria-label="Edit portfolio"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        className="rounded p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        aria-label="Delete portfolio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* detail panel */}
      {selected && (
        <DetailPanel
          portfolio={selected}
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(selected)}
        />
      )}

      {/* create modal */}
      {showCreate && (
        <PortfolioModal
          title="Create New Portfolio"
          initial={BLANK}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* edit modal */}
      {editing && (
        <PortfolioModal
          title={`Edit: ${editing.name}`}
          initial={{
            name: editing.name,
            type: editing.type,
            baseCurrency: editing.baseCurrency,
            description: editing.description,
            manager: editing.manager,
            mandatedBy: editing.mandatedBy,
            strategy: editing.strategy,
            status: editing.status,
            mandate: editing.mandate ?? "",
          }}
          onSave={handleEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {/* confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl p-6 mx-4">
            <h2 className="text-base font-bold text-dark-gray mb-2">
              Remove Portfolio?
            </h2>
            <p className="text-sm text-dark-gray/60 mb-5">
              <span className="font-medium text-dark-gray">
                {confirmDelete.name}
              </span>{" "}
              will be removed from the registry. This does not delete any
              existing trade records.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-dark-gray hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
