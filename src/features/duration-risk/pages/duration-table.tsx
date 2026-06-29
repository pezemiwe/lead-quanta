import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpDown } from "lucide-react";
import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { EmptyPortfolio } from "../components/empty-portfolio";
import { fmtNumber, fmtPct, CLASSIFICATION_BADGE } from "../../valuation/utils";
import { fmtCompactNGN } from "../utils";
import type { DurationRow } from "../engine/types";

type SortKey =
  | "name"
  | "type"
  | "remainingTenor"
  | "modifiedDur"
  | "macaulayDur"
  | "convexity"
  | "dv01NGN"
  | "bsValueNGN";

export function DurationRiskTable() {
  const v = useDurationRisk();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dv01NGN");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterClass, setFilterClass] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  const rows = useMemo(() => {
    let r: DurationRow[] = v.result.durationRows;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.id.toLowerCase().includes(q) ||
          x.issuer.toLowerCase().includes(q),
      );
    }
    if (filterClass) r = r.filter((x) => x.classification === filterClass);
    if (filterType) r = r.filter((x) => x.type === filterType);
    r = [...r].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return r;
  }, [
    v.result.durationRows,
    search,
    sortKey,
    sortDir,
    filterClass,
    filterType,
  ]);

  if (!v.hasData) return <EmptyPortfolio />;

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const Th = ({
    k,
    children,
    align = "right",
  }: {
    k: SortKey;
    children: React.ReactNode;
    align?: "left" | "right";
  }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`cursor-pointer px-4 py-2.5 text-${align} text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-primary`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </span>
    </th>
  );

  const types = Array.from(new Set(v.result.durationRows.map((r) => r.type)));

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">Duration Table</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modified duration, DV01, and convexity per instrument. Click a row
            for full risk detail.
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {fmtNumber(rows.length)} of {fmtNumber(v.result.durationRows.length)}{" "}
          instruments
        </div>
      </div>

      <SectionCard noPadding>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, issuer…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All classifications</option>
            <option value="AC">AC</option>
            <option value="FVOCI">FVOCI</option>
            <option value="FVTPL">FVTPL</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-gray-50">
              <tr>
                <Th k="name" align="left">
                  Instrument
                </Th>
                <Th k="type" align="left">
                  Type
                </Th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Class
                </th>
                <Th k="remainingTenor">Tenor</Th>
                <Th k="macaulayDur">Mac Dur</Th>
                <Th k="modifiedDur">Mod Dur</Th>
                <Th k="convexity">Convex</Th>
                <Th k="dv01NGN">DV01 (NGN)</Th>
                <Th k="bsValueNGN">BS Value</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/duration-risk/asset/${r.id}`)}
                  className="cursor-pointer border-b border-border/60 hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-dark-gray">{r.name}</div>
                    <div className="font-mono text-[11px] text-gray-400">
                      {r.id}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {r.type}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CLASSIFICATION_BADGE[r.classification]}`}
                    >
                      {r.classification}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {r.remainingTenor.toFixed(2)}y
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {r.macaulayDur.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">
                    {r.modifiedDur.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">
                    {r.convexity.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {fmtCompactNGN(r.dv01NGN)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {fmtCompactNGN(r.bsValueNGN)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-gray-400"
                  >
                    No instruments match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border bg-gray-50 px-4 py-3 text-xs">
          <span className="text-gray-500">
            Portfolio Wtd Mod Duration:{" "}
            <span className="font-mono font-semibold text-dark-gray">
              {v.result.totals.wtdModifiedDur.toFixed(4)} yrs
            </span>
          </span>
          <span className="text-gray-500">
            Portfolio Total DV01:{" "}
            <span className="font-mono font-semibold text-dark-gray">
              {fmtCompactNGN(v.result.totals.totalDV01)}
            </span>
          </span>
          <span className="text-gray-500">
            Avg Yield:{" "}
            <span className="font-mono font-semibold text-dark-gray">
              {fmtPct(
                rows.reduce((s, r) => s + r.marketYield, 0) /
                  Math.max(1, rows.length),
                2,
              )}
            </span>
          </span>
        </div>
      </SectionCard>
    </div>
  );
}
