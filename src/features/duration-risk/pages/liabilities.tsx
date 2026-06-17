import { useState } from "react";
import { useDurationRisk } from "../store";
import { SectionCard } from "../../../components/shared/section-card";
import { fmtCompactNGN } from "../utils";
import { DEFAULT_LIABILITY_STRUCTURE } from "../engine/reference-data";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import type { LiabilityBucket } from "../engine/types";

export function DurationRiskLiabilities() {
  const v = useDurationRisk();
  const [rows, setRows] = useState<LiabilityBucket[]>(v.liabilities);

  const update = (i: number, patch: Partial<LiabilityBucket>) => {
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const remove = (i: number) => setRows((p) => p.filter((_, idx) => idx !== i));
  const add = () =>
    setRows((p) => [...p, { bucket: "New Bucket", duration: 1, valueNGN: 0 }]);
  const apply = () => v.setLiabilities(rows);
  const reset = () => {
    setRows(DEFAULT_LIABILITY_STRUCTURE);
    v.setLiabilities(DEFAULT_LIABILITY_STRUCTURE);
  };

  const totalValue = rows.reduce((s, r) => s + r.valueNGN, 0);
  const wtdDur =
    totalValue > 0
      ? rows.reduce((s, r) => s + r.duration * r.valueNGN, 0) / totalValue
      : 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">
            Liability Structure
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure the liability ladder used by the ALM gap analysis.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
          <button
            onClick={apply}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-mid-red"
          >
            Apply changes
          </button>
        </div>
      </div>

      <SectionCard noPadding>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Bucket</th>
              <th className="px-4 py-2.5 text-right">Duration (yrs)</th>
              <th className="px-4 py-2.5 text-right">Value (NGN)</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="px-4 py-2">
                  <input
                    value={r.bucket}
                    onChange={(e) => update(i, { bucket: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={r.duration}
                    onChange={(e) =>
                      update(i, { duration: Number(e.target.value) })
                    }
                    className="w-24 rounded border border-border bg-surface px-2 py-1 text-right text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    value={r.valueNGN}
                    onChange={(e) =>
                      update(i, { valueNGN: Number(e.target.value) })
                    }
                    className="w-44 rounded border border-border bg-surface px-2 py-1 text-right text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => remove(i)}
                    className="text-gray-400 hover:text-primary"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td className="px-4 py-2">
                <button
                  onClick={add}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1 text-xs text-gray-500 hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" /> Add bucket
                </button>
              </td>
              <td className="px-4 py-2 text-right text-xs font-semibold">
                Wtd: {wtdDur.toFixed(3)}y
              </td>
              <td className="px-4 py-2 text-right font-mono text-xs font-semibold">
                Total: {fmtCompactNGN(totalValue)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </SectionCard>
    </div>
  );
}
