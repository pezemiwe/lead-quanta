import { useState } from "react";
import { Save, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { SectionCard } from "../../../components/shared/section-card";
import { Input } from "../../../components/shared/input";
import { Button } from "../../../components/shared/button";
import { Badge } from "../../../components/shared/badge";
import { useIFRS9 } from "../store";
import { DEFAULT_ASSUMPTIONS } from "../engine/reference-data";
import type { Assumptions } from "../engine/types";

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const SCENARIO_META = {
  baseline: { label: "Baseline", color: "#6B7280" },
  bestCase: { label: "Best-case", color: "#16A34A" },
  worseCase: { label: "Worse-case", color: "#B91C1C" },
} as const;

type ScenarioKey = keyof typeof SCENARIO_META;

export function IFRS9Assumptions() {
  const { assumptions, setAssumptions } = useIFRS9();
  const [draft, setDraft] = useState<Assumptions>(assumptions);
  const [expandedOverlay, setExpandedOverlay] = useState<ScenarioKey | null>(null);

  const updateWeight = (key: keyof Assumptions["weights"], v: number) => {
    setDraft((d) => ({ ...d, weights: { ...d.weights, [key]: v } }));
  };

  const updateOverlay = (key: ScenarioKey, text: string) => {
    const parsed = text
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    if (parsed.length === 0) return;
    const arr = parsed.slice(0, 60);
    while (arr.length < 60) arr.push(arr[arr.length - 1] ?? 1);
    setDraft((d) => ({ ...d, [key]: arr }) as Assumptions);
  };

  const applyPreset = (key: ScenarioKey, preset: "flat" | "rampDown" | "rampUp") => {
    let arr: number[];
    if (preset === "flat") {
      arr = Array(60).fill(1);
    } else if (preset === "rampDown") {
      // linear ramp from 1.20 → 1.00
      arr = Array.from({ length: 60 }, (_, i) => +(1.2 - (0.2 * i) / 59).toFixed(4));
    } else {
      // rampUp: 0.85 → 1.00
      arr = Array.from({ length: 60 }, (_, i) => +(0.85 + (0.15 * i) / 59).toFixed(4));
    }
    setDraft((d) => ({ ...d, [key]: arr }) as Assumptions);
  };

  const weightSum =
    draft.weights.baseline + draft.weights.bestCase + draft.weights.worseCase;
  const weightsValid = Math.abs(weightSum - 1) < 0.001;

  // Build chart data: one point per month
  const chartData = Array.from({ length: 60 }, (_, i) => ({
    month: i + 1,
    baseline: draft.baseline[i],
    bestCase: draft.bestCase[i],
    worseCase: draft.worseCase[i],
  }));

  // X-axis shows every 6th tick to avoid clutter
  const xTicks = [1, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
            ECL Assumptions
          </h1>
          <p className="mt-1 text-sm text-dark-gray/60">
            Reporting date, recovery rates and forward-looking information
            overlays.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => setDraft(DEFAULT_ASSUMPTIONS)}
          >
            Reset to default
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="h-3.5 w-3.5" />}
            disabled={!weightsValid}
            onClick={() => setAssumptions(draft)}
          >
            Apply assumptions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Reporting Parameters"
          description="Set the as-of date and sovereign recovery rate"
        >
          <div className="space-y-4">
            <Input
              type="date"
              label="Reporting Date"
              value={toISO(draft.reportingDate)}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  reportingDate: new Date(e.target.value),
                }))
              }
            />
            <Input
              type="number"
              step="0.01"
              min={0}
              max={1}
              label="Sovereign Recovery Rate (fraction)"
              hint="e.g. 0.53 represents 53% expected recovery on default."
              value={draft.sovereignRecoveryRate}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sovereignRecoveryRate: Number(e.target.value),
                }))
              }
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Scenario Weights"
          description="Probability-weighting across forward-looking scenarios"
        >
          <div className="space-y-4">
            <Input
              type="number"
              step="0.05"
              min={0}
              max={1}
              label="Baseline weight"
              value={draft.weights.baseline}
              onChange={(e) => updateWeight("baseline", Number(e.target.value))}
            />
            <Input
              type="number"
              step="0.05"
              min={0}
              max={1}
              label="Best-case weight"
              value={draft.weights.bestCase}
              onChange={(e) => updateWeight("bestCase", Number(e.target.value))}
            />
            <Input
              type="number"
              step="0.05"
              min={0}
              max={1}
              label="Worse-case weight"
              value={draft.weights.worseCase}
              onChange={(e) =>
                updateWeight("worseCase", Number(e.target.value))
              }
            />
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
              <span className="text-dark-gray/60">Sum of weights</span>
              <Badge variant={weightsValid ? "success" : "danger"} size="sm">
                {weightSum.toFixed(2)}
              </Badge>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="FLI Overlays — 60-Month Path"
        description="Forward-looking multipliers applied to monthly PD vectors for each macro scenario"
      >
        {/* Combined preview chart */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                ticks={xTicks}
                tick={{ fontSize: 11 }}
                label={{ value: "Month", position: "insideBottomRight", offset: -4, fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <ReferenceLine y={1} stroke="#d1d5db" strokeDasharray="4 2" />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) =>
                  [typeof v === "number" ? v.toFixed(4) : v, SCENARIO_META[name as ScenarioKey]?.label ?? name]
                }
                labelFormatter={(l) => `Month ${l}`}
              />
              <Legend
                formatter={(v) => SCENARIO_META[v as ScenarioKey]?.label ?? v}
              />
              {(["baseline", "bestCase", "worseCase"] as const).map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={SCENARIO_META[k].color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Per-scenario edit rows */}
        <div className="mt-4 space-y-2">
          {(["baseline", "bestCase", "worseCase"] as const).map((k) => {
            const meta = SCENARIO_META[k];
            const vals = draft[k];
            const mn = Math.min(...vals).toFixed(4);
            const mx = Math.max(...vals).toFixed(4);
            const isOpen = expandedOverlay === k;
            return (
              <div
                key={k}
                className="rounded-lg border border-border bg-surface"
              >
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => setExpandedOverlay(isOpen ? null : k)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <span className="text-sm font-medium text-dark-gray">
                      {meta.label}
                    </span>
                    <span className="text-xs text-dark-gray/50">
                      min {mn} · max {mx}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Presets */}
                    <span
                      className="rounded border border-border px-2 py-0.5 text-xs text-dark-gray/60 hover:border-primary/40 hover:bg-pale-red/20 hover:text-deep-red"
                      onClick={(e) => { e.stopPropagation(); applyPreset(k, "flat"); }}
                    >
                      Flat 1.0
                    </span>
                    <span
                      className="rounded border border-border px-2 py-0.5 text-xs text-dark-gray/60 hover:border-primary/40 hover:bg-pale-red/20 hover:text-deep-red"
                      onClick={(e) => { e.stopPropagation(); applyPreset(k, "rampUp"); }}
                    >
                      Ramp ↑
                    </span>
                    <span
                      className="rounded border border-border px-2 py-0.5 text-xs text-dark-gray/60 hover:border-primary/40 hover:bg-pale-red/20 hover:text-deep-red"
                      onClick={(e) => { e.stopPropagation(); applyPreset(k, "rampDown"); }}
                    >
                      Ramp ↓
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-dark-gray/40" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-dark-gray/40" />
                    )}
                  </div>
                </button>
                {/* Expanded raw editor */}
                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="mb-2 text-xs text-dark-gray/50">
                      Paste or edit comma-separated values (60 entries). Shorter inputs are extended by repeating the last value.
                    </p>
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs font-mono text-dark-gray outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      defaultValue={vals.join(", ")}
                      onBlur={(e) => updateOverlay(k, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
