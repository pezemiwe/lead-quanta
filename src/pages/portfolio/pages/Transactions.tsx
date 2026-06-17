import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Search, Download } from "lucide-react";
import {
  DataTable,
  DataTableColumn,
} from "../../../components/shared/data-table";
import {
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtDate,
} from "../../../features/portfolio/engine/book-compute";

// -- generate transaction log from 204 instruments ----------------------------
type TxRow = {
  id: string;
  date: string;
  type: "Buy" | "Coupon" | "Maturity" | "Accrual";
  instrument: string;
  issuer: string;
  currency: string;
  amount: number;
  amountFmt: string;
  status: "Settled" | "Pending" | "Processing";
};

const VALUATION_MS = new Date("2026-05-28").getTime();
const DAYS_90 = 90 * 86400000;

const ALL_TXN: TxRow[] = [];

BOOK_INSTRUMENTS.forEach((inst, i) => {
  const val = BOOK_VALUATIONS[i];
  const bsv = val?.balanceSheetValueNGN ?? 0;

  // Purchase / Buy
  ALL_TXN.push({
    id: `TXN-${(1000 + i * 3).toString().padStart(5, "0")}`,
    date: inst.purchaseDate,
    type: "Buy",
    instrument: inst.name,
    issuer: inst.issuer,
    currency: inst.currency,
    amount: inst.faceValue * inst.purchasePrice,
    amountFmt: fmtCompact(inst.faceValue * inst.purchasePrice),
    status: "Settled",
  });

  // Coupon event — instruments with couponRate > 0
  if (inst.couponRate > 0 && inst.couponFrequency !== "Zero") {
    const freqMonths =
      inst.couponFrequency === "Semi"
        ? 6
        : inst.couponFrequency === "Quarterly"
          ? 3
          : 12;
    const annualIncome =
      val?.annualEIRIncome ?? inst.faceValue * inst.couponRate;
    const couponAmt = annualIncome / (12 / freqMonths);
    // last coupon: 1 period ago from valuation date
    const lastCouponDate = new Date(VALUATION_MS - freqMonths * 30 * 86400000);
    ALL_TXN.push({
      id: `TXN-${(1001 + i * 3).toString().padStart(5, "0")}`,
      date: lastCouponDate.toISOString().slice(0, 10),
      type: "Coupon",
      instrument: inst.name,
      issuer: inst.issuer,
      currency: inst.currency,
      amount: couponAmt,
      amountFmt: fmtCompact(couponAmt),
      status: "Settled",
    });
  }

  // Maturity — instruments maturing within 90 days of valuation date
  if (inst.maturityDate) {
    const matMs = new Date(inst.maturityDate).getTime();
    if (Math.abs(matMs - VALUATION_MS) < DAYS_90) {
      const matStatus =
        matMs < VALUATION_MS
          ? "Settled"
          : matMs - VALUATION_MS < 30 * 86400000
            ? "Processing"
            : "Pending";
      ALL_TXN.push({
        id: `TXN-${(1002 + i * 3).toString().padStart(5, "0")}`,
        date: inst.maturityDate,
        type: "Maturity",
        instrument: inst.name,
        issuer: inst.issuer,
        currency: inst.currency,
        amount: inst.faceValue,
        amountFmt: fmtCompact(inst.faceValue),
        status: matStatus,
      });
    }
  }
});

// Sort by date desc
ALL_TXN.sort((a, b) => b.date.localeCompare(a.date));

const TYPE_COLORS: Record<string, string> = {
  Buy: "bg-blue-100 text-blue-700",
  Coupon: "bg-green-100 text-success",
  Maturity: "bg-purple-100 text-purple-700",
  Accrual: "bg-gray-100 text-gray-500",
};

const STATUS_COLORS: Record<string, string> = {
  Settled: "bg-green-100 text-success",
  Processing: "bg-yellow-100 text-yellow-700",
  Pending: "bg-gray-100 text-gray-400",
};

const ALL_TYPES = ["All", "Buy", "Coupon", "Maturity"];

const COLUMNS: DataTableColumn<TxRow>[] = [
  {
    key: "id",
    header: "Ref",
    render: (r) => (
      <span className="font-mono text-xs text-gray-500">{r.id}</span>
    ),
  },
  {
    key: "date",
    header: "Date",
    render: (r) => (
      <span className="text-xs text-gray-600">{fmtDate(r.date)}</span>
    ),
  },
  {
    key: "type",
    header: "Type",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[r.type]}`}
      >
        {r.type}
      </span>
    ),
  },
  {
    key: "instrument",
    header: "Instrument",
    render: (r) => (
      <span className="text-xs font-medium text-dark-gray">{r.instrument}</span>
    ),
  },
  {
    key: "issuer",
    header: "Issuer",
    render: (r) => <span className="text-xs text-gray-500">{r.issuer}</span>,
  },
  {
    key: "currency",
    header: "CCY",
    render: (r) => <span className="text-xs text-gray-400">{r.currency}</span>,
  },
  {
    key: "amountFmt",
    header: "Amount",
    render: (r) => (
      <span className="text-xs font-semibold text-dark-gray text-right block">
        {r.amountFmt}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}
      >
        {r.status}
      </span>
    ),
  },
];

export function Transactions() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = useMemo(() => {
    let rows = ALL_TXN;
    if (typeFilter !== "All") rows = rows.filter((r) => r.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.instrument.toLowerCase().includes(q) ||
          r.issuer.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [search, typeFilter]);

  const buys = ALL_TXN.filter((t) => t.type === "Buy").length;

  const exportXlsx = () => {
    const headers = ["ID", "Date", "Type", "Instrument", "Issuer", "Currency", "Amount", "Status"];
    const rows = filtered.map((t) => [
      t.id, t.date, t.type, t.instrument, t.issuer, t.currency, +t.amount.toFixed(2), t.status,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `transactions-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const coupons = ALL_TXN.filter((t) => t.type === "Coupon").length;
  const maturities = ALL_TXN.filter((t) => t.type === "Maturity").length;
  const pending = ALL_TXN.filter((t) => t.status !== "Settled").length;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Transaction Log</h1>
          <p className="mt-1 text-sm text-gray-500">
            All purchases, coupon receipts and maturity events —{" "}
            {ALL_TXN.length} records
          </p>
        </div>
        <button onClick={exportXlsx} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-500 hover:bg-pale-red hover:text-primary">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Purchases", value: buys, color: "text-blue-600" },
          { label: "Coupon Events", value: coupons, color: "text-success" },
          { label: "Maturities", value: maturities, color: "text-purple-600" },
          {
            label: "Pending / Processing",
            value: pending,
            color: "text-yellow-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 flex-1 min-w-48">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            placeholder="Search instrument, issuer, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-pale-red hover:text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={COLUMNS} data={filtered} pageSize={25} />
    </div>
  );
}
